"""Matches: the current user's matches and incoming likes."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Match, Item, Swipe, User

matches_bp = Blueprint("matches", __name__)


@matches_bp.route("", methods=["GET"])
@jwt_required()
def list_matches():
    user_id = int(get_jwt_identity())
    matches = Match.query.filter(
        (Match.user_a_id == user_id) | (Match.user_b_id == user_id)
    ).order_by(Match.created_at.desc()).all()
    return jsonify([m.to_dict(current_user_id=user_id) for m in matches]), 200


@matches_bp.route("/incoming", methods=["GET"])
@jwt_required()
def incoming_likes():
    """People who liked one of my items but whom I haven't matched with yet.

    These are pending — I can "match back" by liking one of their items, which
    completes the match (via the normal swipe endpoint).
    """
    user_id = int(get_jwt_identity())

    my_item_ids = [i.id for i in Item.query.filter_by(user_id=user_id).all()]
    if not my_item_ids:
        return jsonify([]), 200

    # Users I've already matched with — exclude them.
    matches = Match.query.filter(
        (Match.user_a_id == user_id) | (Match.user_b_id == user_id)
    ).all()
    matched_user_ids = {
        m.user_b_id if m.user_a_id == user_id else m.user_a_id for m in matches
    }

    # Likes on my items, newest first.
    likes = (
        Swipe.query.filter(
            Swipe.item_id.in_(my_item_ids), Swipe.liked.is_(True)
        )
        .order_by(Swipe.created_at.desc())
        .all()
    )

    results = {}
    for swipe in likes:
        liker_id = swipe.swiper_id
        if liker_id == user_id or liker_id in matched_user_ids:
            continue
        if liker_id in results:
            continue  # already captured this liker

        # I match back by liking one of THEIR items, so they must have one.
        their_items = (
            Item.query.filter_by(user_id=liker_id)
            .order_by(Item.created_at.desc())
            .all()
        )
        if not their_items:
            continue

        liker = db.session.get(User, liker_id)
        liked_item = db.session.get(Item, swipe.item_id)
        results[liker_id] = {
            "user": liker.to_dict(),
            "liked_item": liked_item.to_dict(include_owner=False),
            "their_item": their_items[0].to_dict(),
        }

    return jsonify(list(results.values())), 200


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
