import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import TabBar from "./components/TabBar.jsx";
import Logo from "./components/Logo.jsx";
import Home from "./pages/Home.jsx";
import ItemForm from "./pages/ItemForm.jsx";
import MyListings from "./pages/MyListings.jsx";
import Account from "./pages/Account.jsx";
import Matches from "./pages/Matches.jsx";
import Chat from "./pages/Chat.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import "./App.css";

export default function App() {
  const { user, loading } = useAuth();

  // While we check the session cookie, show a brief splash.
  if (loading) {
    return (
      <div className="app-shell app-splash">
        <Logo size={64} />
      </div>
    );
  }

  // Logged out: only auth screens are reachable.
  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Logged in: the full app.
  return (
    <div className="app-shell">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/list" element={<ItemForm />} />
          <Route path="/listings" element={<MyListings />} />
          <Route path="/listings/:id/edit" element={<ItemForm />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/matches/:id" element={<Chat />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
