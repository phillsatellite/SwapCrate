"""Tags: list existing tags and create new ones (for filter pickers)."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from extensions import db
from models import Tag

tags_bp = Blueprint("tags", __name__)


@tags_bp.route("", methods=["GET"])
def list_tags():
    tags = Tag.query.order_by(Tag.name.asc()).all()
    return jsonify([t.to_dict() for t in tags]), 200


@tags_bp.route("", methods=["POST"])
@jwt_required()
def create_tag():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    tag = Tag.get_or_create(name)
    db.session.commit()
    return jsonify(tag.to_dict()), 201
