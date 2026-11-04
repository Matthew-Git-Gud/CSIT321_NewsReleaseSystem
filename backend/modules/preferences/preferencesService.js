const { outcome } = require('../../shared/outcome');
const repository = require("./preferencesRepository");

const ACCENT_COLOURS = new Set([
  'emerald', 'ocean', 'violet', 'coral', 'amber', 'indigo', 'rose',
  'terracotta', 'sky', 'plum',
]);
const DEFAULT_ACCENT_COLOUR = 'emerald';

const getCategories = async (_input) => {
  try {
    const [categories] = await repository.statement1(undefined, undefined)

    return outcome('OK', { categories })
  } catch (error) {
    console.error(error)
    return outcome('INTERNAL_ERROR', { message: 'Unable to load categories' })
  }
}

const getPreferences = async (command) => {
  try {
    // Join through the category table so the client receives usable topic names and IDs.
    const [preferences] = await repository.statement2([command.actor.user_id], undefined)
    const [appearance] = await repository.getAccentColour([command.actor.user_id], undefined)

    const accentColour = ACCENT_COLOURS.has(appearance[0]?.accent_colour)
      ? appearance[0].accent_colour
      : DEFAULT_ACCENT_COLOUR;

    return outcome('OK', { preferences, accentColour })
  } catch (error) {
    console.error(error)
    return outcome('INTERNAL_ERROR', { message: 'Unable to load preferences' })
  }
}

const savePreferences = async (command) => {
  const { categoryIds, accentColour = DEFAULT_ACCENT_COLOUR } = command.payload

  if (!Array.isArray(categoryIds) || !categoryIds.every(Number.isInteger)) {
    return outcome('INVALID', { message: 'Category IDs must be an array of whole numbers' })
  }

  if (!ACCENT_COLOURS.has(accentColour)) {
    return outcome('INVALID', { message: 'Please choose a valid accent colour' })
  }

  // Removing duplicates prevents a primary-key error when the selected topics are saved.
  const uniqueCategoryIds = [...new Set(categoryIds)]
  const connection = await repository.getConnection()

  try {
    if (uniqueCategoryIds.length > 0) {
      const placeholders = uniqueCategoryIds.map(() => '?').join(', ')
      const [categories] = await repository.statement3(uniqueCategoryIds, connection, { placeholders })

      if (categories.length !== uniqueCategoryIds.length) {
        return outcome('INVALID', { message: 'One or more selected categories do not exist' })
      }
    }

    await connection.beginTransaction()

    // Create the user's preference record if it does not exist yet.
    await repository.statement4([command.actor.user_id], connection)

    // Store only an approved palette key, never a user-supplied CSS value.
    await repository.saveAccentColour([accentColour, command.actor.user_id], connection)

    // Replace the complete selection so cleared topics are removed as well.
    await repository.statement5([command.actor.user_id], connection)

    if (uniqueCategoryIds.length > 0) {
      const values = uniqueCategoryIds.map((categoryId) => [command.actor.user_id, categoryId])
      await repository.statement6([values], connection)
    }

    await connection.commit()
    return outcome('OK', {
      message: 'Preferences saved successfully',
      accentColour,
    })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    return outcome('INTERNAL_ERROR', { message: 'Unable to save preferences' })
  } finally {
    connection.release()
  }
}

module.exports = {
  getCategories,
  getPreferences,
  savePreferences,
}
