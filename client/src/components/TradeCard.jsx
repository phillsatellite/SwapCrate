import { onImgError } from "../utils/img.js";
import "./TradeCard.css";

// A single "for trade" ad — the swipe card. Shows picture, title,
// description, and the tags the owner will trade for.
export default function TradeCard({ item }) {
  return (
    <article className="card">
      <div className="card__photo">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            onError={onImgError}
          />
        ) : (
          <div className="card__photo-fallback">📦</div>
        )}
        {item.owner && (
          <span className="card__owner">@{item.owner.username}</span>
        )}
      </div>

      <div className="card__body">
        <h2 className="card__title">{item.title}</h2>
        {item.location && <p className="card__location">📍 {item.location}</p>}
        <p className="card__desc">{item.description}</p>

        {item.wanted && item.wanted.length > 0 && (
          <div className="card__wants">
            <span className="card__wants-label">Wants</span>
            <div className="chips">
              {item.wanted.map((tag) => (
                <span className="chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
