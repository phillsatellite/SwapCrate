import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { onImgError } from "../utils/img.js";
import TagInput from "../components/TagInput.jsx";
import { Spinner } from "../components/Status.jsx";
import "./NewItem.css";

// Create or edit a listing. In edit mode (route has :id) it loads the item,
// prefills the form, saves via PATCH, and offers Delete.
export default function ItemForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState([]);
  const [wanted, setWanted] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    api
      .getItem(id)
      .then((item) => {
        if (!active) return;
        setTitle(item.title || "");
        setDescription(item.description || "");
        setLocation(item.location || "");
        setImageUrl(item.image_url || "");
        setCategories(item.categories || []);
        setWanted(item.wanted || []);
      })
      .catch(() => active && setError("Couldn't load this listing."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const canSubmit = title.trim().length > 0 && !busy;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      image_url: imageUrl.trim(),
      categories,
      wanted,
    };
    try {
      if (isEdit) await api.updateItem(id, payload);
      else await api.createItem(payload);
      navigate(-1);
    } catch (err) {
      setError(err.message || "Couldn't save listing");
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this listing? This can't be undone.")) return;
    setBusy(true);
    try {
      await api.deleteItem(id);
      navigate("/listings");
    } catch (err) {
      setError(err.message || "Couldn't delete listing");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="new-item">
        <Spinner label="Loading…" />
      </div>
    );
  }

  return (
    <div className="new-item">
      <header className="new-item__bar">
        <button
          type="button"
          className="new-item__cancel"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
        <span className="new-item__heading">
          {isEdit ? "Edit Listing" : "List an Item"}
        </span>
        <button
          type="submit"
          form="item-form"
          className="new-item__post"
          disabled={!canSubmit}
        >
          {isEdit ? "Save" : "Post"}
        </button>
      </header>

      <form id="item-form" onSubmit={handleSubmit} className="new-item__form">
        <label className="field-label" htmlFor="image_url">
          Photo URL
        </label>
        <div className="photo-preview">
          {imageUrl.trim() ? (
            <img src={imageUrl.trim()} alt="Preview" onError={onImgError} />
          ) : (
            <span className="photo-preview__hint">🖼️ Paste an image link below</span>
          )}
        </div>
        <input
          id="image_url"
          className="field-input"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          autoCapitalize="none"
          autoCorrect="off"
        />

        <label className="field-label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="field-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mountain Bike"
          maxLength={120}
        />

        <label className="field-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="field-input field-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Condition, details, what you're looking to trade for…"
          rows={4}
        />

        <label className="field-label" htmlFor="location">
          Location
        </label>
        <input
          id="location"
          className="field-input"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Brooklyn, NY"
        />

        <label className="field-label">Category</label>
        <TagInput
          value={categories}
          onChange={setCategories}
          placeholder="e.g. bike, guitar"
        />

        <label className="field-label">Wants in return</label>
        <TagInput
          value={wanted}
          onChange={setWanted}
          placeholder="e.g. camera, books"
        />

        {error && <p className="new-item__error">{error}</p>}

        <button
          type="submit"
          className="btn-primary new-item__submit"
          disabled={!canSubmit}
        >
          {busy
            ? isEdit
              ? "Saving…"
              : "Listing…"
            : isEdit
            ? "Save changes"
            : "List item"}
        </button>

        {isEdit && (
          <button
            type="button"
            className="new-item__delete"
            onClick={handleDelete}
            disabled={busy}
          >
            Delete listing
          </button>
        )}
      </form>
    </div>
  );
}
