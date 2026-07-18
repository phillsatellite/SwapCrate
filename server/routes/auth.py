"""Authentication: register, login, logout, current user.

The JWT is delivered in an httpOnly cookie (see config) so it is never exposed
to JavaScript. Login/register are rate-limited to slow brute-force attempts,
and errors are intentionally generic to avoid revealing which accounts exist.
"""
import re

from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    unset_jwt_cookies,
)
from sqlalchemy.exc import IntegrityError

from extensions import db, bcrypt, limiter
from models import User, TokenBlocklist

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LEN = 8

# A throwaway hash so login runs bcrypt even when the user doesn't exist,
# keeping response timing uniform (defeats username-enumeration via timing).
_DUMMY_HASH = None


def _dummy_password_check(password):
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = bcrypt.generate_password_hash("swapcrate-timing-guard").decode()
    bcrypt.check_password_hash(_DUMMY_HASH, password)


def _auth_response(user, status):
    """Build a JSON response with the JWT set as an httpOnly cookie."""
    token = create_access_token(identity=str(user.id))
    resp = make_response(jsonify({"user": user.to_dict()}), status)
    set_access_cookies(resp, token)
    return resp


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("10 per hour")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return jsonify({"error": "username, email, and password are required"}), 400
    if len(username) < 3 or len(username) > 80:
        return jsonify({"error": "username must be 3-80 characters"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "please enter a valid email address"}), 400
    if len(password) < MIN_PASSWORD_LEN:
        return jsonify(
            {"error": f"password must be at least {MIN_PASSWORD_LEN} characters"}
        ), 400

    user = User(username=username, email=email)
    user.password = password  # hashed via the setter

    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "username or email already taken"}), 409

    return _auth_response(user, 201)


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter(
        (db.func.lower(User.username) == identifier)
        | (db.func.lower(User.email) == identifier)
    ).first()

    if user is None:
        _dummy_password_check(password)  # normalize timing
        return jsonify({"error": "invalid credentials"}), 401
    if not user.check_password(password):
        return jsonify({"error": "invalid credentials"}), 401

    return _auth_response(user, 200)


@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    # Revoke this token server-side (blocklist) and clear the cookie.
    jti = get_jwt()["jti"]
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()

    resp = make_response(jsonify({"message": "logged out"}), 200)
    unset_jwt_cookies(resp)
    return resp


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None:
        return jsonify({"error": "user not found"}), 404
    return jsonify(user.to_dict(include_items=True)), 200
