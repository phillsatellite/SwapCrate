"""Application configuration, loaded from environment variables."""
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    # --- Database ---
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql://localhost:5432/swapcrate"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Auth / JWT ---
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # --- PubNub (post-match messaging) ---
    PUBNUB_PUBLISH_KEY = os.environ.get("PUBNUB_PUBLISH_KEY")
    PUBNUB_SUBSCRIBE_KEY = os.environ.get("PUBNUB_SUBSCRIBE_KEY")
    PUBNUB_SECRET_KEY = os.environ.get("PUBNUB_SECRET_KEY")
