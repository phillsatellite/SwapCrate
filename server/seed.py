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
        dave = User(username="dave", email="dave@example.com")
        dave.password = "password123"
        db.session.add_all([alice, bob, carol, dave])
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
            image_url="https://loremflickr.com/800/600/acoustic,guitar?lock=51",
            location="Brooklyn, NY",
            user_id=alice.id,
        )
        alice_guitar.categories = [guitar]
        alice_guitar.wanted = [bike]

        # Bob has a bike, wants a guitar. (Alice + Bob are a mutual match.)
        bob_bike = Item(
            title="Mountain Bike",
            description="27-speed, recently tuned up.",
            image_url="https://loremflickr.com/800/600/mountain,bike?lock=21",
            location="Queens, NY",
            user_id=bob.id,
        )
        bob_bike.categories = [bike]
        bob_bike.wanted = [guitar]

        # Carol has a camera, wants books.
        carol_camera = Item(
            title="Canon DSLR Camera",
            description="Includes two lenses and a bag.",
            image_url="https://loremflickr.com/800/600/dslr,camera?lock=31",
            location="Jersey City, NJ",
            user_id=carol.id,
        )
        carol_camera.categories = [camera]
        carol_camera.wanted = [books]

        # Dave has another guitar, so Bob (who wants a guitar) has something
        # left to swipe even after matching with Alice.
        dave_guitar = Item(
            title="Classical Guitar",
            description="Nylon-string, warm tone. Comes with a soft case.",
            image_url="https://loremflickr.com/800/600/classical,guitar?lock=52",
            location="Manhattan, NY",
            user_id=dave.id,
        )
        dave_guitar.categories = [guitar]
        dave_guitar.wanted = [camera]

        db.session.add_all([alice_guitar, bob_bike, carol_camera, dave_guitar])
        db.session.commit()

        print("Seeding a match (alice <-> bob)...")
        # Both like each other's items -> a mutual match.
        db.session.add_all(
            [
                Swipe(swiper_id=alice.id, item_id=bob_bike.id, liked=True),
                Swipe(swiper_id=bob.id, item_id=alice_guitar.id, liked=True),
            ]
        )
        a_id, b_id = sorted([alice.id, bob.id])
        db.session.add(Match(user_a_id=a_id, user_b_id=b_id))
        db.session.commit()

        # Dave has already liked Bob's bike (a pending like). So when Bob likes
        # Dave's guitar in the app, it completes a fresh match live — handy for
        # demoing the "It's a Match!" moment.
        db.session.add(Swipe(swiper_id=dave.id, item_id=bob_bike.id, liked=True))
        db.session.commit()

        print("Done! Users: alice / bob / carol / dave, password: password123")


if __name__ == "__main__":
    run()
