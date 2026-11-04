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
import {
  ACCENT_COLOURS,
  type AccentColour,
} from "../constants/appearance";

import "../styles/Preferences.css";

type PreferencesProps = {
  accentColour: AccentColour;
  onAccentColourChange: (
    accentColour: AccentColour,
  ) => void;
};

function Preferences({
  accentColour,
  onAccentColourChange,
}: PreferencesProps) {
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
    selectedAccentColour,
    setSelectedAccentColour,
  ] = useState<AccentColour>(
    accentColour,
  );

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
            savedCategories.preferences.map(
              (category) =>
                category.category_id,
            ),
          );

          setSelectedAccentColour(
            savedCategories.accentColour,
          );

          // Apply the saved choice as soon as it is known, not only after a
          // second click. This also restores the theme on another device.
          onAccentColourChange(
            savedCategories.accentColour,
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

  const selectAccentColour = (
    nextAccentColour: AccentColour,
  ) => {
    setSuccess("");
    setSelectedAccentColour(
      nextAccentColour,
    );

    // Preview the colour immediately; saving below makes it follow the user
    // to their next sign-in as well.
    onAccentColourChange(
      nextAccentColour,
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
            selectedAccentColour,
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
            Loading preferences...
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

            <section
              className="appearance-preferences"
              aria-labelledby="appearance-title"
            >
              <div className="appearance-preferences-heading">
                <p className="eyebrow">
                  Appearance
                </p>

                <h2 id="appearance-title">
                  Choose your accent colour.
                </h2>

                <p>
                  Your choice updates buttons, links and highlights across the site.
                </p>
              </div>

              <div
                className="accent-colour-options"
                role="radiogroup"
                aria-label="Accent colour"
              >
                {ACCENT_COLOURS.map(
                  (colour) => {
                    const isSelected =
                      selectedAccentColour === colour.id;

                    return (
                      <button
                        key={colour.id}
                        className={
                          isSelected
                            ? "accent-colour-option selected"
                            : "accent-colour-option"
                        }
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() =>
                          selectAccentColour(
                            colour.id,
                          )
                        }
                      >
                        <span
                          className="accent-colour-swatch"
                          style={{
                            backgroundColor:
                              colour.swatch,
                          }}
                          aria-hidden="true"
                        />

                        <span>
                          <strong>
                            {colour.label}
                          </strong>

                          <small>
                            {colour.description}
                          </small>
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </section>

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
                  : "Save preferences"}
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
