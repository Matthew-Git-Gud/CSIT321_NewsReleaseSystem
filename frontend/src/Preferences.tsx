import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import {
  getCategories,
  getPreferences,
  savePreferences,
  type Category,
} from './services/preferences'
import type { User } from './services/auth'
import './Preferences.css'

type PreferencesProps = {
  user: User | null
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onHome: () => void
  onLogin: () => void
}

function Preferences({ user, theme, onToggleTheme, onHome, onLogin }: PreferencesProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Load both lists together, then mark the user's saved topics as selected.
    Promise.all([getCategories(), getPreferences()])
      .then(([availableCategories, savedCategories]) => {
        setCategories(availableCategories)
        setSelectedCategoryIds(savedCategories.map((category) => category.category_id))
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load preferences')
      })
      .finally(() => setLoading(false))
  }, [user])

  const toggleCategory = (categoryId: number) => {
    setSuccess('')
    setSelectedCategoryIds((currentIds) =>
      currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId],
    )
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const response = await savePreferences(selectedCategoryIds)
      setSuccess(response.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <main className="preferences-page">
        <div className="preferences-theme-control">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <section className="preferences-card sign-in-required">
          <p className="eyebrow">Personalised feed</p>
          <h1>Sign in to choose topics.</h1>
          <p>Your preferred topics are saved to your account and can be used to personalise your feed.</p>
          <button className="primary-button" type="button" onClick={onLogin}>Sign in</button>
          <button className="text-button" type="button" onClick={onHome}>Back to home</button>
        </section>
      </main>
    )
  }

  return (
    <main className="preferences-page">
      <header className="preferences-header">
        <button className="brand preferences-brand" type="button" onClick={onHome}>News Release System</button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      <section className="preferences-card" aria-labelledby="preferences-title">
        <p className="eyebrow">Personalised feed</p>
        <h1 id="preferences-title">Choose your preferred topics.</h1>
        <p className="preferences-copy">Select the news categories you want to see more often, then save your choices.</p>

        {loading ? (
          <p className="preferences-status">Loading topics...</p>
        ) : (
          <>
            <div className="topic-options" aria-label="Available news topics">
              {categories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.category_id)

                return (
                  <button
                    className={isSelected ? 'topic-option selected' : 'topic-option'}
                    type="button"
                    key={category.category_id}
                    aria-pressed={isSelected}
                    onClick={() => toggleCategory(category.category_id)}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>

            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <div className="preferences-actions">
              <button className="primary-button" type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save topics'}
              </button>
              <button className="text-button" type="button" onClick={onHome}>Back to home</button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default Preferences
