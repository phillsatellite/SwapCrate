import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./List.css";

// Profile screen for the logged-in user, with access to My Listings and logout.
export default function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <div>
      <header className="page-header">
        <h1>Account</h1>
      </header>

      <div className="profile">
        <div className="profile__avatar">{initial}</div>
        <div className="profile__name">@{user?.username}</div>
        <div className="profile__email">{user?.email}</div>
      </div>

      <ul className="list list--grouped">
        <li
          className="list-row list-row--tappable"
          onClick={() => navigate("/listings")}
          role="button"
          tabIndex={0}
        >
          <span className="list-row__title">My Listings</span>
          <span className="list-row__chevron">›</span>
        </li>
      </ul>

      <div className="list-cta">
        <button className="btn-primary btn-primary--danger" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
