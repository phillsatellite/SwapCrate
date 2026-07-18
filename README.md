# SwapCrate

**A "Tinder × Facebook Marketplace" bartering app.** List an item you want to
trade, swipe through other people's items, and when two people both like each
other's stuff you **match** — then chat in real time to arrange the swap.

---

## What it's built with

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 (JavaScript/JSX) + Vite, React Router, PubNub SDK |
| **Backend** | Python **Flask** REST API (app-factory + blueprints) |
| **Database** | **PostgreSQL** via SQLAlchemy ORM + Flask-Migrate (Alembic) |
| **Auth** | JWT (Flask-JWT-Extended) stored in an httpOnly cookie + CSRF, Flask-Bcrypt password hashing, Flask-Limiter rate limiting |
| **Real-time chat** | PubNub |

Frontend lives in `client/`, backend in `server/`. The Vite dev server proxies
`/api` to Flask on port 5555, so the two run side by side in development.

---

## Features

**Accounts & security**
- Register, log in, log out with **JWT auth stored in an httpOnly cookie** (JavaScript can't read it → safe from XSS token theft)
- **CSRF protection** on all write requests (double-submit token)
- **Rate limiting** on login/register (brute-force protection)
- Passwords **bcrypt-hashed**; generic, timing-safe login errors (no account enumeration)
- Real server-side **logout** (token revoked via a blocklist table)

**Listings (full CRUD, owned by the user)**
- Create, view, edit, and delete your own listings (title, description, location, photo URL)
- Category tags (what it is) and "wanted" tags (what you'll trade for)

**Swipe feed**
- You must list at least one item before you can swipe (so others can match with you)
- Feed shows everyone else's un-swiped items, **prioritizing the ones matching your "wanted" tags**, the rest in random order
- Swipe cards with animations, a detail sheet with a photo gallery, and pass/like buttons
- "Refresh" brings back the listings you passed on

**Matching**
- A **match** is created only when two users like each other's items
- **"Likes You"** — see people who liked your item and **match back** to complete the match
- Celebration modal when a match happens

**Real-time chat**
- After matching, chat over a private **PubNub** channel per match
- The backend issues a **scoped access token** — it never sees the messages themselves

---

## Project structure

```
SwapCrate/
├── client/                     # React frontend
│   ├── index.html
│   ├── vite.config.js          # dev server + /api proxy to Flask
│   └── src/
│       ├── main.jsx            # entry (Router + AuthProvider)
│       ├── App.jsx             # routes + logged-in/out gating
│       ├── api/client.js       # every API call (cookies + CSRF)
│       ├── context/
│       │   └── AuthContext.jsx # current-user state
│       ├── hooks/
│       │   ├── useAsync.js     # loading/error for fetches
│       │   └── usePubnubChat.js# real-time chat logic
│       ├── pages/              # one file per screen
│       │   ├── Home.jsx        # "list an item" gate
│       │   ├── SwipeDeck.jsx   # the swipe feed
│       │   ├── Matches.jsx     # likes-you + matches
│       │   ├── Chat.jsx        # conversation
│       │   ├── MyListings.jsx  # your listings
│       │   ├── ItemForm.jsx    # create / edit / delete a listing
│       │   ├── Login.jsx / Register.jsx
│       │   └── Account.jsx
│       └── components/         # TradeCard, ItemDetail, MatchModal, TabBar, …
│
└── server/                     # Flask backend
    ├── app.py                  # app factory: extensions, JWT, blueprints
    ├── config.py               # settings from environment variables
    ├── extensions.py           # shared extension instances
    ├── models.py               # User, Item, Tag, Swipe, Match, TokenBlocklist
    ├── seed.py                 # sample data
    ├── requirements.txt
    ├── .env.example
    ├── migrations/             # Alembic migrations
    └── routes/                 # one blueprint per resource
        ├── auth.py             # register / login / logout / me
        ├── items.py            # item CRUD + the swipe feed
        ├── swipes.py           # swipes + match creation
        ├── matches.py          # matches + "likes you"
        ├── tags.py             # tag list/create
        └── messaging.py        # PubNub token
```

---

## Getting started

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **PostgreSQL** (running locally)

### 1. Backend (Flask API)

```bash
cd server

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # then edit values (see below)

createdb swapcrate            # create the PostgreSQL database
flask db upgrade              # apply migrations (create tables)
python seed.py                # load sample users + items

flask run --port 5555         # API now at http://localhost:5555
```

> Tip: run `flask run --port 5555 --debug` during development for auto-reload.

### 2. Frontend (React)

```bash
cd client
npm install
npm run dev                   # app now at http://localhost:5173
```

Open **http://localhost:5173** and log in.

### Seed accounts

`python seed.py` creates four users, all with password **`password123`**:

`alice` · `bob` · `carol` · `dave`

### Why the app shows sample data (it's *seed* data, not *mock* data)

When you open the app you'll see listings from `alice`, `bob`, `carol`, and
`dave` that you didn't create. **This is real data in the PostgreSQL database —
not hardcoded frontend mock data.**

- There is **no mock data in the frontend.** Every screen fetches from the live
  Flask API. (Early in development the UI used placeholder arrays; they were
  deleted once the frontend was wired to the backend.)
- The sample users and their items are inserted by **`python seed.py`**, which
  writes them straight into Postgres. They're served through the exact same API
  endpoints as anything a real user creates — that's why they look "real."
- **Why it's there:** a bartering app needs *other people* to match with — you
  can't demonstrate swiping, matching, or chat with a single empty account. The
  seed data gives you trade partners out of the box (e.g. log in as `dave` to
  play the other side of a match).

**Want a clean, empty app?** Skip `python seed.py` — just run `flask db upgrade`
to create the tables and start with an empty database. Anything you then create
in the running app is stored in Postgres the same way.

---

## Environment variables (`server/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://<user>@localhost:5432/swapcrate` |
| `JWT_SECRET_KEY` | Long random string used to sign JWTs |
| `FRONTEND_ORIGIN` | Allowed CORS origin (default `http://localhost:5173`) |
| `COOKIE_SECURE` | `false` for local http; **`true` in production (HTTPS)** |
| `PUBNUB_PUBLISH_KEY` / `PUBNUB_SUBSCRIBE_KEY` / `PUBNUB_SECRET_KEY` | PubNub keys for chat (leave blank to disable messaging) |

---

## API reference

All routes are under `/api`. Protected routes require the auth cookie; write
requests (POST/PATCH/DELETE) also require the `X-CSRF-TOKEN` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account → sets auth cookie |
| POST | `/api/auth/login` | Log in → sets auth cookie |
| DELETE | `/api/auth/logout` | Log out (revokes token) |
| GET | `/api/auth/me` | Current user + their items |
| GET | `/api/items/feed` | The swipe deck (prioritized) |
| GET | `/api/items` · `/api/items/:id` | List / read items |
| POST | `/api/items` | Create a listing |
| PATCH | `/api/items/:id` | Edit a listing (owner only) |
| DELETE | `/api/items/:id` | Delete a listing (owner only) |
| POST | `/api/swipes` | Record a like/pass (creates a match on reciprocal like) |
| DELETE | `/api/swipes/passes` | Forget your passes (feed "refresh") |
| GET | `/api/matches` | Your confirmed matches |
| GET | `/api/matches/incoming` | People who liked you (pending match-back) |
| GET | `/api/matches/:id` | One match |
| GET | `/api/tags` · POST `/api/tags` | List / create tags |
| POST | `/api/messaging/token` | Scoped PubNub token for a match's channel |

---

## Testing the backend with curl

Auth is **cookie-based with CSRF**, so use a cookie jar (`-c`/`-b`) and send the
`X-CSRF-TOKEN` header on writes. Copy-paste this block after `flask run`:

```bash
BASE=http://localhost:5555/api
JAR=/tmp/swapcrate.cookies

# 1. Health check
curl -s $BASE/health
# -> {"status":"ok"}

# 2. Log in as a seed user (saves the auth + CSRF cookies to the jar)
curl -s -c $JAR -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"bob","password":"password123"}'
# -> {"user":{"id":..,"username":"bob",...}}

# Pull the CSRF token out of the cookie jar for write requests
CSRF=$(grep csrf_access_token $JAR | awk '{print $7}')

# 3. Who am I? (GET — cookie only, no CSRF needed)
curl -s -b $JAR $BASE/auth/me

# 4. See the swipe feed
curl -s -b $JAR $BASE/items/feed

# 5. Create a listing (POST — needs the CSRF header)
curl -s -b $JAR -X POST $BASE/items \
  -H 'Content-Type: application/json' -H "X-CSRF-TOKEN: $CSRF" \
  -d '{"title":"Skateboard","description":"Barely used","location":"NYC","categories":["skateboard"],"wanted":["bike"]}'

# 6. Swipe LIKE on item #1
curl -s -b $JAR -X POST $BASE/swipes \
  -H 'Content-Type: application/json' -H "X-CSRF-TOKEN: $CSRF" \
  -d '{"item_id":1,"liked":true}'
# -> {"swipe":{...}, "match": null | {...}}   (match is set if it was reciprocal)

# 7. Matches and incoming likes
curl -s -b $JAR $BASE/matches
curl -s -b $JAR $BASE/matches/incoming

# 8. Log out (DELETE — needs the CSRF header; revokes the token)
curl -s -b $JAR -X DELETE $BASE/auth/logout -H "X-CSRF-TOKEN: $CSRF"

# 9. Prove logout worked — the old cookie is now rejected
curl -s -b $JAR $BASE/auth/me
# -> {"error":"..."} with HTTP 401
```

**Quick security checks:**

```bash
# Wrong password -> generic error (no account enumeration)
curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"bob","password":"wrong"}'
# -> {"error":"invalid credentials"}  (HTTP 401)

# A write WITHOUT the CSRF header is rejected
curl -s -o /dev/null -w "%{http_code}\n" -b $JAR -X POST $BASE/swipes \
  -H 'Content-Type: application/json' -d '{"item_id":1,"liked":true}'
# -> 401
```

---

## How the core pieces work

- **Auth** — On login/register the server puts the JWT in an **httpOnly cookie**
  (`set_access_cookies`) and returns the user. Because the cookie is httpOnly,
  JavaScript can't read it, so XSS can't steal the session; a separate readable
  `csrf_access_token` cookie is echoed back as the `X-CSRF-TOKEN` header to stop
  CSRF. Logout adds the token's id to a **blocklist** so it can't be reused.
  → `server/routes/auth.py`, `server/config.py`, `client/src/context/AuthContext.jsx`

- **Swipe feed** — Returns everyone else's un-swiped items, splitting them into a
  **priority group** (category matches your "wanted" tags) and the rest, each
  shuffled. Tag matching is case- and plural-insensitive (`bike` = `bikes`).
  → `server/routes/items.py`, `client/src/pages/SwipeDeck.jsx`

- **Matching** — Every *like* checks whether the other user already liked one of
  *your* items; if so, a **Match** row is created. Until then, they appear in your
  **"Likes You"** list, and you match back by liking one of their items.
  → `server/routes/swipes.py`, `server/routes/matches.py`, `client/src/pages/Matches.jsx`

- **Messaging** — Each match owns a PubNub channel `match-<id>`. The backend
  verifies you belong to the match and grants a token scoped to just that
  channel; the browser then publishes/subscribes directly to PubNub.
  → `server/routes/messaging.py`, `client/src/hooks/usePubnubChat.js`

---

## Deploying (Railway — one always-on service)

The repo includes a **`Dockerfile`** that builds the React app and runs Flask
(serving **both** the API and the built frontend) with gunicorn — so the entire
site deploys as a **single service**. Because Flask serves the frontend,
everything is same-origin and the cookie auth just works (no cross-site cookie
issues).

1. Go to **https://railway.com** and **sign in with GitHub**.
2. **New Project → Deploy from GitHub repo →** pick `SwapCrate`. Railway detects
   the `Dockerfile` and builds it automatically.
3. **New → Database → PostgreSQL** in the same project.
4. On the web service, set **Variables** (Settings → Variables):
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | reference the Postgres service: `${{Postgres.DATABASE_URL}}` |
   | `JWT_SECRET_KEY` | a long random string |
   | `COOKIE_SECURE` | `true` (Railway serves HTTPS) |
   | `PUBNUB_PUBLISH_KEY` / `PUBNUB_SUBSCRIBE_KEY` / `PUBNUB_SECRET_KEY` | your PubNub keys |
5. Deploy. On boot the container runs `flask db upgrade` (creates the tables),
   then starts gunicorn. Railway hands you a **public URL** — that's the whole app.
6. *(Optional, first deploy only)* load sample data with
   `railway run python seed.py` — **this wipes and reseeds the DB**, so never run
   it once real users exist.

### Further production hardening (optional)
- Use a persistent rate-limiter store (e.g. Redis) instead of in-memory, and add
  `ProxyFix` so per-IP limiting works correctly behind Railway's proxy.
- Rotate the PubNub keys and `JWT_SECRET_KEY` used in development.
