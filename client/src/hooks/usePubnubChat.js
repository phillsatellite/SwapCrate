import { useEffect, useRef, useState } from "react";
import PubNub from "pubnub";
import { api } from "../api/client.js";

// Real-time chat for a match's PubNub channel. Gets a scoped token from the
// backend, subscribes, loads history, and exposes a send() that publishes.
// `status`: 'connecting' | 'ready' | 'error'.
export function usePubnubChat(match) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("connecting");

  const pubnubRef = useRef(null);
  const channelRef = useRef(null);
  const uuidRef = useRef(null);

  useEffect(() => {
    if (!match) return;
    let cancelled = false;
    let listener = null;

    async function setup() {
      setStatus("connecting");
      try {
        const { token, publish_key, subscribe_key, channel, uuid } =
          await api.messagingToken(match.id);
        if (cancelled) return;

        channelRef.current = channel;
        uuidRef.current = uuid;

        const pubnub = new PubNub({
          publishKey: publish_key,
          subscribeKey: subscribe_key,
          userId: uuid,
        });
        pubnub.setToken(token);
        pubnubRef.current = pubnub;

        listener = {
          message: (ev) => {
            if (ev.channel !== channel) return;
            setMessages((prev) => [
              ...prev,
              {
                id: String(ev.timetoken),
                from: ev.publisher === uuid ? "me" : "them",
                text: ev.message?.text ?? "",
              },
            ]);
          },
        };
        pubnub.addListener(listener);
        pubnub.subscribe({ channels: [channel] });

        // Load prior messages (requires Message Persistence; ignore if off).
        try {
          const res = await pubnub.fetchMessages({ channels: [channel], count: 50 });
          if (!cancelled) {
            const history = (res.channels?.[channel] || []).map((m) => ({
              id: String(m.timetoken),
              from: m.uuid === uuid ? "me" : "them",
              text: m.message?.text ?? "",
            }));
            setMessages(history);
          }
        } catch {
          // no history available — start empty
        }

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    setup();

    return () => {
      cancelled = true;
      const pn = pubnubRef.current;
      if (pn) {
        if (listener) pn.removeListener(listener);
        pn.unsubscribeAll();
        pn.destroy();
      }
      pubnubRef.current = null;
    };
  }, [match]);

  async function send(text) {
    const pn = pubnubRef.current;
    const channel = channelRef.current;
    const body = text.trim();
    if (!pn || !channel || !body) return;
    // Our own published message echoes back via the listener, so we don't add
    // it locally here (avoids duplicates).
    await pn.publish({ channel, message: { text: body } });
  }

  return { messages, status, send };
}
