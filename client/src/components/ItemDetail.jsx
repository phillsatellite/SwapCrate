import { useState } from "react";
import { createPortal } from "react-dom";
import { onImgError } from "../utils/img.js";
import "./ItemDetail.css";

// Slide-up detail sheet for a single ad: swipeable photo gallery + full info.
// Falls back to the single image_url when an `images` array isn't provided.
export default function ItemDetail({ item, onClose, onSwipe }) {
  const images =
    item.images && item.images.length
      ? item.images
      : item.image_url
      ? [item.image_url]
      : [];

  const [active, setActive] = useState(0);

  function handleScroll(e) {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  }

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${item.title} details`}
      >
        <button className="sheet__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="gallery" onScroll={handleScroll}>
          {images.map((src, i) => (
            <img
              className="gallery__img"
              src={src}
              key={i}
              alt={`${item.title} — photo ${i + 1}`}
              draggable="false"
              onError={onImgError}
            />
          ))}
        </div>

        {images.length > 1 && (
          <div className="gallery__dots">
            {images.map((_, i) => (
              <span
                key={i}
                className={"dot" + (i === active ? " dot--active" : "")}
              />
            ))}
          </div>
        )}

        <div className="sheet__body">
          {item.owner && (
            <div className="sheet__owner">@{item.owner.username}</div>
          )}
          <h2 className="sheet__title">{item.title}</h2>
          {item.location && <p className="sheet__location">📍 {item.location}</p>}
          <p className="sheet__desc">{item.description}</p>

          {item.categories && item.categories.length > 0 && (
            <div className="sheet__group">
              <span className="sheet__label">Category</span>
              <div className="chips">
                {item.categories.map((tag) => (
                  <span className="chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.wanted && item.wanted.length > 0 && (
            <div className="sheet__group">
              <span className="sheet__label">Wants in return</span>
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

        {onSwipe && (
          <div className="sheet__actions">
            <button
              className="sheet-btn sheet-btn--pass"
              onClick={() => onSwipe(false)}
            >
              ✕ Pass
            </button>
            <button
              className="sheet-btn sheet-btn--like"
              onClick={() => onSwipe(true)}
            >
              ♥ Trade
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
