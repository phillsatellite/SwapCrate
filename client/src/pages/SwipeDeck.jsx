import { useState } from "react";
import TradeCard from "../components/TradeCard.jsx";
import ItemDetail from "../components/ItemDetail.jsx";
import MatchModal from "../components/MatchModal.jsx";
import { Spinner, ErrorState } from "../components/Status.jsx";
import { api } from "../api/client.js";
import { useAsync } from "../hooks/useAsync.js";

// The swipe feed. Only rendered once the user has listed at least one item.
// The backend automatically prioritizes listings whose category matches the
// user's own "wanted" tags (the things they're looking for).
export default function SwipeDeck() {
  const { data: feed, loading, error, reload } = useAsync(() => api.feed());
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(null); // 'left' (pass) | 'right' (like)
  const [detailOpen, setDetailOpen] = useState(false);
  const [match, setMatch] = useState(null);

  const items = feed || [];
  const item = items[index];

  function handleSwipe(liked) {
    if (exiting || !item) return;
    const current = item;
    setExiting(liked ? "right" : "left");
    setTimeout(() => {
      setIndex((i) => i + 1);
      setExiting(null);
    }, 350);

    api
      .swipe(current.id, liked)
      .then((res) => {
        if (res.match) setMatch(res.match);
      })
      .catch(() => {});
  }

  return (
    <div className="home__stage">
      {loading ? (
        <Spinner label="Finding trades…" />
      ) : error ? (
        <ErrorState message="Couldn't load trades." onRetry={reload} />
      ) : item ? (
        <>
          <div
            key={item.id}
            className={
              "swipe-card " +
              (exiting ? `swipe-card--exit-${exiting}` : "swipe-card--enter")
            }
            onClick={() => !exiting && setDetailOpen(true)}
            role="button"
            tabIndex={0}
          >
            <TradeCard item={item} />
            <span className="stamp stamp--pass">❌ NOPE</span>
            <span className="stamp stamp--like">💚 TRADE</span>
          </div>
          <div className="swipe-actions">
            <button
              className="swipe-btn swipe-btn--pass"
              onClick={() => handleSwipe(false)}
              disabled={!!exiting}
              aria-label="Pass"
            >
              ✕
            </button>
            <button
              className="swipe-btn swipe-btn--like"
              onClick={() => handleSwipe(true)}
              disabled={!!exiting}
              aria-label="Trade"
            >
              ♥
            </button>
          </div>
        </>
      ) : (
        <div className="home__empty">
          <div className="home__empty-emoji">🎉</div>
          <h2>You're all caught up</h2>
          <p>Want another look at the listings you passed on?</p>
          <button
            className="btn-primary"
            onClick={() => {
              api.clearPasses().finally(() => {
                setIndex(0);
                reload();
              });
            }}
          >
            Refresh
          </button>
        </div>
      )}

      {item && detailOpen && (
        <ItemDetail
          item={item}
          onClose={() => setDetailOpen(false)}
          onSwipe={(liked) => {
            setDetailOpen(false);
            handleSwipe(liked);
          }}
        />
      )}

      {match && <MatchModal match={match} onClose={() => setMatch(null)} />}
    </div>
  );
}
