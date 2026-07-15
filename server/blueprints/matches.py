"""Matches: list the current user's matches."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Match

matches_bp = Blueprint("matches", __name__)


@matches_bp.route("", methods=["GET"])
@jwt_required()
def list_matches():
    user_id = int(get_jwt_identity())
    matches = Match.query.filter(
        (Match.user_a_id == user_id) | (Match.user_b_id == user_id)
    ).order_by(Match.created_at.desc()).all()
    return jsonify([m.to_dict(current_user_id=user_id) for m in matches]), 200


@matches_bp.route("/<int:match_id>", methods=["GET"])
@jwt_required()
def get_match(match_id):
    user_id = int(get_jwt_identity())
    match = Match.query.get(match_id)
    if match is None:
        return jsonify({"error": "match not found"}), 404
    if user_id not in (match.user_a_id, match.user_b_id):
        return jsonify({"error": "not your match"}), 403
    return jsonify(match.to_dict(current_user_id=user_id)), 200
