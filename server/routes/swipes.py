"""Swipes: record a like/pass, and create a Match on a reciprocal like."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Item, Swipe, Match

swipes_bp = Blueprint("swipes", __name__)


@swipes_bp.route("/passes", methods=["DELETE"])
@jwt_required()
def clear_passes():
    """Forget the current user's passes (liked=False) so those items show up
    in the feed again. Likes/matches are untouched."""
    user_id = int(get_jwt_identity())
    cleared = Swipe.query.filter_by(swiper_id=user_id, liked=False).delete(
        synchronize_session=False
    )
    db.session.commit()
    return jsonify({"cleared": cleared}), 200


def _find_or_create_match(user_id_1, user_id_2):
    """Return an existing Match for the pair, or create one. Idempotent."""
    a_id, b_id = Match.ordered_pair(user_id_1, user_id_2)
    match = Match.query.filter_by(user_a_id=a_id, user_b_id=b_id).first()
    if match:
        return match, False
    match = Match(user_a_id=a_id, user_b_id=b_id)
    db.session.add(match)
    try:
        db.session.commit()
    except IntegrityError:
        # Two simultaneous swipes raced to create the same match.
        db.session.rollback()
        match = Match.query.filter_by(user_a_id=a_id, user_b_id=b_id).first()
        return match, False
    return match, True


@swipes_bp.route("", methods=["POST"])
@jwt_required()
def create_swipe():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    item_id = data.get("item_id")
    liked = bool(data.get("liked", False))

    if item_id is None:
        return jsonify({"error": "item_id is required"}), 400

    item = db.session.get(Item, item_id)
    if item is None:
        return jsonify({"error": "item not found"}), 404
    if item.user_id == user_id:
        return jsonify({"error": "cannot swipe on your own item"}), 400

    # Record the swipe (or update it if the user swiped this item before).
    swipe = Swipe.query.filter_by(swiper_id=user_id, item_id=item_id).first()
    if swipe is None:
        swipe = Swipe(swiper_id=user_id, item_id=item_id, liked=liked)
        db.session.add(swipe)
    else:
        swipe.liked = liked
    db.session.commit()

    result = {"swipe": swipe.to_dict(), "match": None}

    # A match happens only on a like where the other user already liked one of
    # my items back.
    if liked:
        other_user_id = item.user_id
        reciprocal = (
            Swipe.query.join(Item, Swipe.item_id == Item.id)
            .filter(
                Swipe.swiper_id == other_user_id,
                Swipe.liked.is_(True),
                Item.user_id == user_id,
            )
            .first()
        )
        if reciprocal is not None:
            match, created = _find_or_create_match(user_id, other_user_id)
            result["match"] = match.to_dict(current_user_id=user_id)
            result["match_created"] = created

    status = 201 if result["match"] else 200
    return jsonify(result), status
