"""PubNub messaging: hand a matched user a scoped access token for their
match channel. Chat itself happens client-to-PubNub; the backend only gates
access so that only the two matched users can read/write a channel.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Match

messaging_bp = Blueprint("messaging", __name__)


def _pubnub_configured():
    cfg = current_app.config
    return all(
        [
            cfg.get("PUBNUB_PUBLISH_KEY"),
            cfg.get("PUBNUB_SUBSCRIBE_KEY"),
            cfg.get("PUBNUB_SECRET_KEY"),
        ]
    )


@messaging_bp.route("/token", methods=["POST"])
@jwt_required()
def grant_token():
    """Grant a short-lived PubNub token for a match's channel.

    Body: { "match_id": <int> }
    Returns: { token, subscribe_key, publish_key, channel, uuid }
    """
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    match_id = data.get("match_id")
    if match_id is None:
        return jsonify({"error": "match_id is required"}), 400

    match = Match.query.get(match_id)
    if match is None:
        return jsonify({"error": "match not found"}), 404
    if user_id not in (match.user_a_id, match.user_b_id):
        return jsonify({"error": "not your match"}), 403

    if not _pubnub_configured():
        return jsonify({"error": "messaging is not configured on the server"}), 503

    # Imported lazily so the app still boots without pubnub installed/configured.
    from pubnub.pnconfiguration import PNConfiguration
    from pubnub.pubnub import PubNub
    from pubnub.models.consumer.v3.channel import Channel

    cfg = current_app.config
    uuid = f"user-{user_id}"

    pn_config = PNConfiguration()
    pn_config.publish_key = cfg["PUBNUB_PUBLISH_KEY"]
    pn_config.subscribe_key = cfg["PUBNUB_SUBSCRIBE_KEY"]
    pn_config.secret_key = cfg["PUBNUB_SECRET_KEY"]
    pn_config.uuid = uuid
    pubnub = PubNub(pn_config)

    try:
        envelope = (
            pubnub.grant_token()
            .channels([Channel.id(match.channel).read().write()])
            .authorized_uuid(uuid)
            .ttl(60)  # minutes
            .sync()
        )
        token = envelope.result.token
    except Exception as exc:  # noqa: BLE001 - surface PubNub errors to the client
        return jsonify({"error": f"could not grant token: {exc}"}), 502

    return jsonify(
        {
            "token": token,
            "subscribe_key": cfg["PUBNUB_SUBSCRIBE_KEY"],
            "publish_key": cfg["PUBNUB_PUBLISH_KEY"],
            "channel": match.channel,
            "uuid": uuid,
        }
    ), 200
