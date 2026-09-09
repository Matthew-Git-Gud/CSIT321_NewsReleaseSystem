import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getCategories,
  getPreferences,
  savePreferences,
  type Category,
} from "../services/preferences";

import { useAuth } from "../context/AuthContext";

import "../styles/Preferences.css";

function Preferences() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    selectedCategoryIds,
    setSelectedCategoryIds,
  ] = useState<number[]>([]);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  // =========================
  // LOAD PREFERENCES
  // =========================

  useEffect(() => {
    const loadPreferences =
      async () => {
        try {
          setError("");

          const [
            availableCategories,
            savedCategories,
          ] = await Promise.all([
            getCategories(),
            getPreferences(),
          ]);

          setCategories(
            availableCategories,
          );

          setSelectedCategoryIds(
            savedCategories.map(
              (category) =>
                category.category_id,
            ),
          );
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load preferences",
          );
        } finally {
          setLoading(false);
        }
      };

    loadPreferences();
  }, []);

  // =========================
  // TOGGLE CATEGORY
  // =========================

  const toggleCategory = (
    categoryId: number,
  ) => {
    setSuccess("");

    setSelectedCategoryIds(
      (currentIds) =>
        currentIds.includes(
          categoryId,
        )
          ? currentIds.filter(
              (id) =>
                id !== categoryId,
            )
          : [
              ...currentIds,
              categoryId,
            ],
    );
  };

  // =========================
  // SAVE PREFERENCES
  // =========================

  const handleSave =
    async () => {
      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await savePreferences(
            selectedCategoryIds,
          );

        setSuccess(
          response.message,
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to save preferences",
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <main className="preferences-page">
      <section
        className="preferences-card"
        aria-labelledby="preferences-title"
      >
        <p className="eyebrow">
          Personalised feed
        </p>

        <h1 id="preferences-title">
          Choose your preferred topics.
        </h1>

        <p className="preferences-copy">
          Select the news categories
          you want to see more often,
          then save your choices.
        </p>

        {user && (
          <p className="preferences-status">
            Preferences for{" "}
            <strong>
              {user.full_name}
            </strong>
          </p>
        )}

        {loading ? (
          <p className="preferences-status">
            Loading topics...
          </p>
        ) : (
          <>
            <div
              className="topic-options"
              aria-label="Available news topics"
            >
              {categories.map(
                (category) => {
                  const isSelected =
                    selectedCategoryIds.includes(
                      category.category_id,
                    );

                  return (
                    <button
                      key={
                        category.category_id
                      }
                      className={
                        isSelected
                          ? "topic-option selected"
                          : "topic-option"
                      }
                      type="button"
                      aria-pressed={
                        isSelected
                      }
                      onClick={() =>
                        toggleCategory(
                          category.category_id,
                        )
                      }
                    >
                      {category.name}
                    </button>
                  );
                },
              )}
            </div>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            {success && (
              <p className="form-success">
                {success}
              </p>
            )}

            <div className="preferences-actions">
              <button
                className="primary-button"
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save topics"}
              </button>

              <button
                className="text-button"
                type="button"
                onClick={() =>
                  navigate("/")
                }
              >
                Back to home
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Preferences;