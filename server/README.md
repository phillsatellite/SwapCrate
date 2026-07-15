# SwapCrate — Backend (Flask API)

Flask + PostgreSQL REST API for SwapCrate, a "Tinder × Facebook Marketplace"
bartering app. Users list items to trade, set filters for what they want, swipe
through others' items, and match when interest is mutual. Post-match chat runs
over PubNub.

## Stack

- Flask (app-factory + blueprints)
- PostgreSQL via SQLAlchemy + Alembic (Flask-Migrate)
- JWT auth (Flask-JWT-Extended) with a DB token blocklist for real logout
- Bcrypt password hashing
- PubNub for post-match messaging

## Setup

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # then edit values

# create the database (once)
createdb swapcrate

# run migrations
flask db upgrade            # or: flask db init && flask db migrate && flask db upgrade

# seed sample data (drops & recreates tables)
python seed.py

# run the API
flask run --port 5555       # or: python app.py
```

Set `FLASK_APP=app.py` (already picked up since the module exposes `app`).

## Data model

| Resource | Belongs to | Notes |
|----------|-----------|-------|
| User     | —         | owns items; bcrypt password |
| Item     | User      | the swipe card: title, description, image_url |
| Tag      | —         | reusable category ("bike"); used for filters/matching |
| Swipe    | User→Item | like / pass |
| Match    | User↔User | created on reciprocal likes; owns PubNub channel |

## API

All routes are under `/api`. Protected routes need `Authorization: Bearer <token>`.

### Auth
| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | `{username, email, password}` | returns user + token |
| POST | `/auth/login` | `{username\|email, password}` | returns user + token |
| DELETE | `/auth/logout` | — | revokes the current token |
| GET | `/auth/me` | — | current user + their items |

### Items
| Method | Path | Notes |
|--------|------|-------|
| GET | `/items` | all items; `?tag=bike` filters by category |
| GET | `/items/:id` | one item |
| POST | `/items` | `{title, description, image_url, categories[], wanted[]}` |
| PATCH | `/items/:id` | owner only |
| DELETE | `/items/:id` | owner only |
| GET | `/items/feed` | swipe stack: others' items matching your `wanted` tags, unswiped. `?tag=` overrides |

### Tags
| Method | Path | Notes |
|--------|------|-------|
| GET | `/tags` | list all tags |
| POST | `/tags` | `{name}` |

### Swipes
| Method | Path | Notes |
|--------|------|-------|
| POST | `/swipes` | `{item_id, liked}`; returns `{swipe, match}` — `match` is set when this like completes a mutual match |

### Matches
| Method | Path | Notes |
|--------|------|-------|
| GET | `/matches` | current user's matches |
| GET | `/matches/:id` | one match (participants only) |

### Messaging
| Method | Path | Notes |
|--------|------|-------|
| POST | `/messaging/token` | `{match_id}`; returns a scoped PubNub token + keys for that match's channel |
