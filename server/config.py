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

    # Store the JWT in an httpOnly cookie so JavaScript can't read it (XSS can't
    # steal the session). CSRF protection compensates for cookie-based auth.
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_HTTPONLY = True
    # Secure=True requires HTTPS; keep it off for local http dev, on in prod.
    JWT_COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    JWT_COOKIE_SAMESITE = "Lax"
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_ACCESS_COOKIE_PATH = "/api/"

    # Origin allowed to call the API with credentials (CORS lockdown).
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    # --- PubNub (post-match messaging) ---
    PUBNUB_PUBLISH_KEY = os.environ.get("PUBNUB_PUBLISH_KEY")
    PUBNUB_SUBSCRIBE_KEY = os.environ.get("PUBNUB_SUBSCRIBE_KEY")
    PUBNUB_SECRET_KEY = os.environ.get("PUBNUB_SECRET_KEY")
