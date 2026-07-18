import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAsync } from "../hooks/useAsync.js";
import { usePubnubChat } from "../hooks/usePubnubChat.js";
import { Spinner, ErrorState } from "../components/Status.jsx";
import "./Chat.css";

// Real-time conversation with a matched user, over the match's PubNub channel.
export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: match, loading, error, reload } = useAsync(() => api.match(id), [id]);

  const { messages, status, send } = usePubnubChat(match);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  async function handleSend(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    try {
      await send(body);
    } catch {
      // publish failed; keep it simple for now
    }
  }

  const other = match?.other_user;

  return (
    <div className="chat">
      <header className="chat__header">
        <button
          className="chat__back"
          onClick={() => navigate("/matches")}
          aria-label="Back to matches"
        >
          ‹
        </button>
        {other && (
          <>
            <div className="chat__avatar">{other.username[0].toUpperCase()}</div>
            <div className="chat__title">@{other.username}</div>
          </>
        )}
      </header>

      {loading ? (
        <div className="chat__messages">
          <Spinner label="Opening chat…" />
        </div>
      ) : error ? (
        <div className="chat__messages">
          <ErrorState message="Couldn't open this chat." onRetry={reload} />
        </div>
      ) : (
        <>
          <div className="chat__messages">
            {status === "connecting" && <Spinner label="Connecting…" />}
            {status === "error" && (
              <div className="chat__empty">
                Couldn't connect to messaging. Check the PubNub keys.
              </div>
            )}
            {status === "ready" && messages.length === 0 && (
              <div className="chat__empty">
                You matched with @{other?.username}! Say hi 👋
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  "bubble " + (m.from === "me" ? "bubble--me" : "bubble--them")
                }
              >
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form className="chat__composer" onSubmit={handleSend}>
            <input
              className="chat__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message…"
              aria-label="Message"
              disabled={status !== "ready"}
            />
            <button
              className="chat__send"
              type="submit"
              disabled={status !== "ready" || !text.trim()}
              aria-label="Send"
            >
              ↑
            </button>
          </form>
        </>
      )}
    </div>
  );
}
