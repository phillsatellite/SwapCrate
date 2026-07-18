import "./Status.css";

export function Spinner({ label }) {
  return (
    <div className="status">
      <div className="spinner" />
      {label && <p className="status__text">{label}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="status">
      <div className="status__emoji">⚠️</div>
      <p className="status__text">{message || "Something went wrong."}</p>
      {onRetry && (
        <button className="status__btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
