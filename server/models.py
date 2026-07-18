"""SQLAlchemy models for SwapCrate.

Resources:
    User      - an account; owns Items.
    Item      - a listing / swipe card; belongs to a User.
    Tag       - a reusable category (e.g. "bike"), used for filtering & matching.
    Swipe     - a User's like/pass on a single Item.
    Match     - created when two Users have both liked one of each other's Items.

Plus TokenBlocklist, which lets JWT logout actually revoke a token.
"""
from datetime import datetime

from sqlalchemy import UniqueConstraint

from extensions import db, bcrypt


# --- Association tables (Item <-> Tag, two different relationships) -----------

# What an item IS (its own categories).
item_categories = db.Table(
    "item_categories",
    db.Column("item_id", db.Integer, db.ForeignKey("items.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id"), primary_key=True),
)

# What an item's owner WANTS in exchange (the trade filters).
item_wanted_tags = db.Table(
    "item_wanted_tags",
    db.Column("item_id", db.Integer, db.ForeignKey("items.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id"), primary_key=True),
)


# --- User --------------------------------------------------------------------

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    _password_hash = db.Column("password_hash", db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship(
        "Item", back_populates="owner", cascade="all, delete-orphan"
    )
    swipes = db.relationship(
        "Swipe", back_populates="swiper", cascade="all, delete-orphan"
    )

    @property
    def password(self):
        raise AttributeError("password is write-only")

    @password.setter
    def password(self, plaintext):
        self._password_hash = bcrypt.generate_password_hash(plaintext).decode("utf-8")

    def check_password(self, plaintext):
        return bcrypt.check_password_hash(self._password_hash, plaintext)

    def to_dict(self, include_items=False):
        data = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_items:
            data["items"] = [i.to_dict(include_owner=False) for i in self.items]
        return data


# --- Item --------------------------------------------------------------------

class Item(db.Model):
    __tablename__ = "items"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, default="")
    image_url = db.Column(db.String(500))
    location = db.Column(db.String(120))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    owner = db.relationship("User", back_populates="items")
    categories = db.relationship("Tag", secondary=item_categories)
    wanted = db.relationship("Tag", secondary=item_wanted_tags)
    swipes = db.relationship(
        "Swipe", back_populates="item", cascade="all, delete-orphan"
    )

    def to_dict(self, include_owner=True):
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "image_url": self.image_url,
            "location": self.location,
            "user_id": self.user_id,
            "categories": [t.name for t in self.categories],
            "wanted": [t.name for t in self.wanted],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_owner and self.owner:
            data["owner"] = {"id": self.owner.id, "username": self.owner.username}
        return data


# --- Tag ---------------------------------------------------------------------

class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(60), unique=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}

    @classmethod
    def get_or_create(cls, name):
        """Return an existing tag (case-insensitive) or a new, unsaved one."""
        name = name.strip().lower()
        tag = cls.query.filter(db.func.lower(cls.name) == name).first()
        if tag is None:
            tag = cls(name=name)
            db.session.add(tag)
        return tag


# --- Swipe -------------------------------------------------------------------

class Swipe(db.Model):
    __tablename__ = "swipes"
    __table_args__ = (
        UniqueConstraint("swiper_id", "item_id", name="uq_swiper_item"),
    )

    id = db.Column(db.Integer, primary_key=True)
    swiper_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey("items.id"), nullable=False)
    liked = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    swiper = db.relationship("User", back_populates="swipes")
    item = db.relationship("Item", back_populates="swipes")

    def to_dict(self):
        return {
            "id": self.id,
            "swiper_id": self.swiper_id,
            "item_id": self.item_id,
            "liked": self.liked,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# --- Match -------------------------------------------------------------------

class Match(db.Model):
    __tablename__ = "matches"
    __table_args__ = (
        UniqueConstraint("user_a_id", "user_b_id", name="uq_match_pair"),
    )

    id = db.Column(db.Integer, primary_key=True)
    # Stored with user_a_id < user_b_id so a pair is unique regardless of order.
    user_a_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user_b_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_a = db.relationship("User", foreign_keys=[user_a_id])
    user_b = db.relationship("User", foreign_keys=[user_b_id])

    @property
    def channel(self):
        """PubNub channel name both matched users subscribe to."""
        return f"match-{self.id}"

    @staticmethod
    def ordered_pair(user_id_1, user_id_2):
        """Return the two ids sorted, so (a, b) and (b, a) map to one row."""
        return tuple(sorted((user_id_1, user_id_2)))

    def to_dict(self, current_user_id=None):
        data = {
            "id": self.id,
            "user_a": self.user_a.to_dict(),
            "user_b": self.user_b.to_dict(),
            "channel": self.channel,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if current_user_id is not None:
            other = self.user_b if self.user_a_id == current_user_id else self.user_a
            data["other_user"] = other.to_dict()
        return data


# --- Token blocklist (for real JWT logout) -----------------------------------

class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
