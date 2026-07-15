"""Seed the database with sample users, items, and tags for development.

Run with:  python seed.py
"""
from app import create_app
from extensions import db
from models import User, Item, Tag, Swipe, Match

app = create_app()


def run():
    with app.app_context():
        print("Clearing tables...")
        db.drop_all()
        db.create_all()

        print("Seeding users...")
        alice = User(username="alice", email="alice@example.com")
        alice.password = "password123"
        bob = User(username="bob", email="bob@example.com")
        bob.password = "password123"
        carol = User(username="carol", email="carol@example.com")
        carol.password = "password123"
        db.session.add_all([alice, bob, carol])
        db.session.commit()

        print("Seeding tags...")
        bike = Tag.get_or_create("bike")
        guitar = Tag.get_or_create("guitar")
        camera = Tag.get_or_create("camera")
        books = Tag.get_or_create("books")
        db.session.commit()

        print("Seeding items...")
        # Alice has a guitar, wants a bike.
        alice_guitar = Item(
            title="Fender Acoustic Guitar",
            description="Barely used, great condition.",
            image_url="https://picsum.photos/seed/guitar/600/400",
            user_id=alice.id,
        )
        alice_guitar.categories = [guitar]
        alice_guitar.wanted = [bike]

        # Bob has a bike, wants a guitar. (Alice + Bob are a mutual match.)
        bob_bike = Item(
            title="Mountain Bike",
            description="27-speed, recently tuned up.",
            image_url="https://picsum.photos/seed/bike/600/400",
            user_id=bob.id,
        )
        bob_bike.categories = [bike]
        bob_bike.wanted = [guitar]

        # Carol has a camera, wants books.
        carol_camera = Item(
            title="Canon DSLR Camera",
            description="Includes two lenses and a bag.",
            image_url="https://picsum.photos/seed/camera/600/400",
            user_id=carol.id,
        )
        carol_camera.categories = [camera]
        carol_camera.wanted = [books]

        db.session.add_all([alice_guitar, bob_bike, carol_camera])
        db.session.commit()

        print("Done! Users: alice / bob / carol, password: password123")


if __name__ == "__main__":
    run()
