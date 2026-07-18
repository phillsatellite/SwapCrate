import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { Spinner, ErrorState } from "../components/Status.jsx";
import SwipeDeck from "./SwipeDeck.jsx";
import { api } from "../api/client.js";
import { useAsync } from "../hooks/useAsync.js";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  // You must have listed at least one item before you can browse the feed —
  // otherwise nobody could ever match with you.
  const { data: myItems, loading, error, reload } = useAsync(() => api.myItems());
  const hasListing = (myItems?.length || 0) > 0;

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-header__top">
          <div className="brand">
            <Logo size={44} />
            <h1 className="brand__name">
              Swap<span>Crate</span>
            </h1>
          </div>
          {hasListing && (
            <button
              className="home__add"
              onClick={() => navigate("/list")}
              aria-label="List an item"
            >
              ＋
            </button>
          )}
        </div>
        <p className="brand__tagline">Swipe to find your next trade</p>
      </header>

      {loading ? (
        <div className="home__stage">
          <Spinner label="Loading…" />
        </div>
      ) : error ? (
        <div className="home__stage">
          <ErrorState message="Couldn't load your account." onRetry={reload} />
        </div>
      ) : hasListing ? (
        <SwipeDeck />
      ) : (
        <div className="home__gate">
          <div className="home__gate-emoji">📦</div>
          <h2>List an item to start</h2>
          <p>
            You need at least one listing before you can browse and match with
            other traders.
          </p>
          <button className="btn-primary" onClick={() => navigate("/list")}>
            List your first item
          </button>
        </div>
      )}
    </div>
  );
}
