import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./MatchModal.css";

// Celebratory "It's a Match!" overlay shown when a swipe completes a mutual
// match. `match` is the object returned by POST /swipes (has other_user + id).
export default function MatchModal({ match, onClose }) {
  const navigate = useNavigate();
  const other = match.other_user || {};

  return createPortal(
    <div className="match-modal" onClick={onClose}>
      <div className="match-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="match-modal__emoji">🎉</div>
        <h2 className="match-modal__title">It's a Match!</h2>
        <p className="match-modal__text">
          You and <strong>@{other.username}</strong> both want to trade.
        </p>
        <button
          className="match-modal__primary"
          onClick={() => navigate(`/matches/${match.id}`)}
        >
          Send a message
        </button>
        <button className="match-modal__secondary" onClick={onClose}>
          Keep swiping
        </button>
      </div>
    </div>,
    document.body
  );
}
