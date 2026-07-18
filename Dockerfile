# SwapCrate — single-image deploy: build the React app, then run Flask (which
# serves both the API and the built frontend) with gunicorn.

# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend
WORKDIR /client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build          # outputs to /client/dist

# ---- Stage 2: Flask API + the built frontend ----
FROM python:3.11-slim
WORKDIR /app

COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ ./
# Copy the built SPA into the folder Flask serves in production
COPY --from=frontend /client/dist ./static_frontend

ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# The host (Railway) injects $PORT. Apply DB migrations, then start gunicorn.
CMD flask db upgrade && gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 2 app:app
