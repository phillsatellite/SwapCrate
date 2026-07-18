// API client for the Flask backend.
//
// Auth uses an httpOnly cookie (the browser sends it automatically), so there
// is no token to store in JS. For state-changing requests we echo the readable
// CSRF cookie in an X-CSRF-TOKEN header (double-submit protection).

function getCookie(name) {
  const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return match ? decodeURIComponent(match.pop()) : null;
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };

  // CSRF token required on writes (POST/PATCH/PUT/DELETE).
  if (!["GET", "HEAD"].includes(method)) {
    const csrf = getCookie("csrf_access_token");
    if (csrf) headers["X-CSRF-TOKEN"] = csrf;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "include", // send/receive the auth cookie
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  logout: () => request("/auth/logout", { method: "DELETE" }),
  me: () => request("/auth/me"),

  // Items
  feed: () => request("/items/feed"),
  myItems: () => request("/auth/me").then((u) => u.items || []),
  getItem: (id) => request(`/items/${id}`),
  createItem: (payload) => request("/items", { method: "POST", body: payload }),
  updateItem: (id, payload) =>
    request(`/items/${id}`, { method: "PATCH", body: payload }),
  deleteItem: (id) => request(`/items/${id}`, { method: "DELETE" }),

  // Swipes
  swipe: (itemId, liked) =>
    request("/swipes", { method: "POST", body: { item_id: itemId, liked } }),
  clearPasses: () => request("/swipes/passes", { method: "DELETE" }),

  // Matches
  matches: () => request("/matches"),
  match: (id) => request(`/matches/${id}`),
  incomingLikes: () => request("/matches/incoming"),

  // Messaging (PubNub) — get a scoped token + keys for a match's channel
  messagingToken: (matchId) =>
    request("/messaging/token", { method: "POST", body: { match_id: matchId } }),
};
