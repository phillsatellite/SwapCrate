"""Items (listings / swipe cards): CRUD + the swipe feed."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Item, Tag, Swipe, item_categories, item_wanted_tags

items_bp = Blueprint("items", __name__)


def _tags_from_names(names):
    """Turn a list of tag names into Tag rows, creating any that are new."""
    tags = []
    for name in names or []:
        if isinstance(name, str) and name.strip():
            tags.append(Tag.get_or_create(name))
    return tags


@items_bp.route("", methods=["GET"])
def list_items():
    """All items (public browse). Optional ?tag=bike filter by category."""
    query = Item.query
    tag_name = request.args.get("tag")
    if tag_name:
        query = query.join(item_categories).join(Tag).filter(
            db.func.lower(Tag.name) == tag_name.strip().lower()
        )
    items = query.order_by(Item.created_at.desc()).all()
    return jsonify([i.to_dict() for i in items]), 200


@items_bp.route("/<int:item_id>", methods=["GET"])
def get_item(item_id):
    item = db.session.get(Item, item_id)
    if item is None:
        return jsonify({"error": "item not found"}), 404
    return jsonify(item.to_dict()), 200


@items_bp.route("", methods=["POST"])
@jwt_required()
def create_item():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400

    item = Item(
        title=title,
        description=(data.get("description") or "").strip(),
        image_url=(data.get("image_url") or "").strip() or None,
        user_id=user_id,
    )
    item.categories = _tags_from_names(data.get("categories"))
    item.wanted = _tags_from_names(data.get("wanted"))

    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@items_bp.route("/<int:item_id>", methods=["PATCH"])
@jwt_required()
def update_item(item_id):
    user_id = int(get_jwt_identity())
    item = db.session.get(Item, item_id)
    if item is None:
        return jsonify({"error": "item not found"}), 404
    if item.user_id != user_id:
        return jsonify({"error": "not your item"}), 403

    data = request.get_json() or {}
    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        item.title = title
    if "description" in data:
        item.description = (data.get("description") or "").strip()
    if "image_url" in data:
        item.image_url = (data.get("image_url") or "").strip() or None
    if "categories" in data:
        item.categories = _tags_from_names(data.get("categories"))
    if "wanted" in data:
        item.wanted = _tags_from_names(data.get("wanted"))

    db.session.commit()
    return jsonify(item.to_dict()), 200


@items_bp.route("/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    user_id = int(get_jwt_identity())
    item = db.session.get(Item, item_id)
    if item is None:
        return jsonify({"error": "item not found"}), 404
    if item.user_id != user_id:
        return jsonify({"error": "not your item"}), 403

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


@items_bp.route("/feed", methods=["GET"])
@jwt_required()
def feed():
    """The swipe stack for the current user.

    Shows other people's items that:
      - the user hasn't already swiped on, and
      - match the user's trade filters.

    Filters default to the union of `wanted` tags across the user's own items,
    and can be overridden with one or more ?tag= query params.
    """
    user_id = int(get_jwt_identity())

    # Items the user has already swiped on — exclude them.
    swiped_ids = [s.item_id for s in Swipe.query.filter_by(swiper_id=user_id).all()]

    query = Item.query.filter(Item.user_id != user_id)
    if swiped_ids:
        query = query.filter(~Item.id.in_(swiped_ids))

    # Determine which category tags to match against.
    requested = [t.strip().lower() for t in request.args.getlist("tag") if t.strip()]
    if requested:
        wanted_names = requested
    else:
        my_items = Item.query.filter_by(user_id=user_id).all()
        wanted_names = {t.name for item in my_items for t in item.wanted}

    if wanted_names:
        query = query.join(item_categories).join(Tag).filter(
            db.func.lower(Tag.name).in_(list(wanted_names))
        ).distinct()

    items = query.order_by(Item.created_at.desc()).all()
    return jsonify([i.to_dict() for i in items]), 200
