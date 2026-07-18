"""Application factory and entry point."""
import os

from flask import Flask, jsonify, send_from_directory

from config import Config
from extensions import db, migrate, bcrypt, jwt, cors, limiter
from models import TokenBlocklist


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    # CORS locked to the known frontend origin, with credentials so the
    # httpOnly auth cookie is allowed on cross-origin requests.
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": [app.config["FRONTEND_ORIGIN"]]}},
        supports_credentials=True,
    )

    # A token is revoked (logged out) if its jti is in the blocklist table.
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        return db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar() is not None

    # Consistent JSON responses for common auth failures.
    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": "Invalid token"}), 401

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": "Authorization token required"}), 401

    @jwt.revoked_token_loader
    def revoked_token(jwt_header, jwt_payload):
        return jsonify({"error": "Token has been revoked"}), 401

    # Reject requests that are missing/failing the CSRF double-submit check.
    from flask_jwt_extended.exceptions import CSRFError

    @app.errorhandler(CSRFError)
    def handle_csrf_error(err):
        return jsonify({"error": "CSRF token missing or invalid"}), 401

    # Friendly JSON when a client trips a rate limit.
    @app.errorhandler(429)
    def ratelimit_handler(err):
        return jsonify({"error": "Too many requests, please slow down"}), 429

    # Register route modules
    from routes.auth import auth_bp
    from routes.items import items_bp
    from routes.tags import tags_bp
    from routes.swipes import swipes_bp
    from routes.matches import matches_bp
    from routes.messaging import messaging_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(items_bp, url_prefix="/api/items")
    app.register_blueprint(tags_bp, url_prefix="/api/tags")
    app.register_blueprint(swipes_bp, url_prefix="/api/swipes")
    app.register_blueprint(matches_bp, url_prefix="/api/matches")
    app.register_blueprint(messaging_bp, url_prefix="/api/messaging")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    # In production the built React app is copied to ./static_frontend during
    # the Docker build, and Flask serves it (same-origin -> cookie auth just
    # works). Locally the folder is absent (Vite serves the frontend), so these
    # routes aren't registered and the app stays API-only.
    frontend_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "static_frontend"
    )
    if os.path.isdir(frontend_dir):

        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_spa(path):
            if path.startswith("api/"):
                return jsonify({"error": "not found"}), 404
            file_path = os.path.join(frontend_dir, path)
            if path and os.path.isfile(file_path):
                return send_from_directory(frontend_dir, path)
            # Everything else -> index.html (client-side routing)
            return send_from_directory(frontend_dir, "index.html")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(port=5555, debug=True)
