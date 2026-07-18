"""Shared extension instances.

Kept in their own module so both the app factory and the models/routes can
import them without creating circular imports.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()
cors = CORS()
# Rate limiter keyed by client IP; used to throttle auth endpoints.
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
