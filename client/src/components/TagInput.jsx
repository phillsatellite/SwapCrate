import { useState } from "react";
import "./TagInput.css";

// Chip-style tag entry. Type and press Enter or comma to add a tag; click ✕ or
// Backspace on an empty field to remove. `value` is a string[] of tag names.
export default function TagInput({ value, onChange, placeholder }) {
  const [text, setText] = useState("");

  function add(raw) {
    const tag = raw.trim().toLowerCase();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="taginput">
      {value.map((tag) => (
        <span className="taginput__chip" key={tag}>
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        className="taginput__field"
        value={text}
        placeholder={value.length ? "" : placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => add(text)}
        autoCapitalize="none"
        autoCorrect="off"
      />
    </div>
  );
}
