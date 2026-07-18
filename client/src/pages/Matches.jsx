import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAsync } from "../hooks/useAsync.js";
import { Spinner, ErrorState } from "../components/Status.jsx";
import MatchModal from "../components/MatchModal.jsx";
import { onImgError } from "../utils/img.js";
import "./List.css";

// My Matches: incoming likes (people who liked your ad — match them back) and
// confirmed matches (mutual — tap to chat).
export default function Matches() {
  const navigate = useNavigate();
  const incoming = useAsync(() => api.incomingLikes());
  const matches = useAsync(() => api.matches());

  const [busyId, setBusyId] = useState(null);
  const [match, setMatch] = useState(null);

  const loading = incoming.loading || matches.loading;
  const error = incoming.error || matches.error;

  function reloadAll() {
    incoming.reload();
    matches.reload();
  }

  function matchBack(like) {
    setBusyId(like.user.id);
    api
      .swipe(like.their_item.id, true)
      .then((res) => {
        if (res.match) setMatch(res.match);
        reloadAll();
      })
      .finally(() => setBusyId(null));
  }

  const likes = incoming.data || [];
  const confirmed = matches.data || [];

  return (
    <div>
      <header className="page-header">
        <h1>My Matches</h1>
        <p className="page-subtitle">Match back, then start trading</p>
      </header>

      {loading ? (
        <Spinner label="Loading matches…" />
      ) : error ? (
        <ErrorState message="Couldn't load matches." onRetry={reloadAll} />
      ) : likes.length === 0 && confirmed.length === 0 ? (
        <div className="list-empty">
          <div className="list-empty__emoji">💫</div>
          <p>No matches yet. Keep swiping!</p>
        </div>
      ) : (
        <>
          {likes.length > 0 && (
            <>
              <p className="list-section">Likes you</p>
              <ul className="list">
                {likes.map((like) => (
                  <li className="list-row" key={like.user.id}>
                    <div className="list-thumb">
                      {like.their_item.image_url ? (
                        <img
                          src={like.their_item.image_url}
                          alt={like.their_item.title}
                          onError={onImgError}
                        />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div className="list-row__text">
                      <span className="list-row__title">
                        @{like.user.username}
                      </span>
                      <span className="list-row__sub">
                        likes your {like.liked_item.title}
                      </span>
                    </div>
                    <button
                      className="matchback-btn"
                      onClick={() => matchBack(like)}
                      disabled={busyId === like.user.id}
                      aria-label={`Match back with ${like.user.username}`}
                    >
                      ♥
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {confirmed.length > 0 && (
            <>
              <p className="list-section">Matches</p>
              <ul className="list">
                {confirmed.map((m) => (
                  <li
                    className="list-row list-row--tappable"
                    key={m.id}
                    onClick={() => navigate(`/matches/${m.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="list-avatar">
                      {m.other_user.username[0].toUpperCase()}
                    </div>
                    <div className="list-row__text">
                      <span className="list-row__title">
                        @{m.other_user.username}
                      </span>
                      <span className="list-row__sub">Tap to start chatting</span>
                    </div>
                    <span className="list-row__chevron">›</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {match && <MatchModal match={match} onClose={() => setMatch(null)} />}
    </div>
  );
}
