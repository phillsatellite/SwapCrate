import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAsync } from "../hooks/useAsync.js";
import { Spinner, ErrorState } from "../components/Status.jsx";
import { onImgError } from "../utils/img.js";
import "./List.css";

// The current user's listings, with full CRUD: create (+ button), read (list),
// and tap a row to edit/delete on the item form.
export default function MyListings() {
  const navigate = useNavigate();
  const { data: items, loading, error, reload } = useAsync(() => api.myItems());

  return (
    <div>
      <header className="page-header">
        <button className="back-link" onClick={() => navigate("/account")}>
          ‹ Account
        </button>
        <h1>My Listings</h1>
        <p className="page-subtitle">Items you've listed for swap</p>
      </header>

      {loading ? (
        <Spinner label="Loading your listings…" />
      ) : error ? (
        <ErrorState message="Couldn't load your listings." onRetry={reload} />
      ) : items && items.length > 0 ? (
        <ul className="list">
          {items.map((item) => (
            <li
              className="list-row list-row--tappable"
              key={item.id}
              onClick={() => navigate(`/listings/${item.id}/edit`)}
              role="button"
              tabIndex={0}
            >
              <div className="list-thumb">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} onError={onImgError} />
                ) : (
                  <span>📦</span>
                )}
              </div>
              <div className="list-row__text">
                <span className="list-row__title">{item.title}</span>
                <span className="list-row__sub">
                  {item.wanted && item.wanted.length
                    ? `Wants: ${item.wanted.join(", ")}`
                    : item.location || "Listed"}
                </span>
              </div>
              <span className="list-row__chevron">›</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="list-empty">
          <div className="list-empty__emoji">📦</div>
          <p>You haven't listed anything yet.</p>
        </div>
      )}

      <div className="list-cta">
        <button className="btn-primary" onClick={() => navigate("/list")}>
          + List an item
        </button>
      </div>
    </div>
  );
}
