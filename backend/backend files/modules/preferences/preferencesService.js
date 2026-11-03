const { outcome } = require('../../shared/outcome');
const repository = require("./preferencesRepository");

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

    return outcome('OK', { preferences })
  } catch (error) {
    console.error(error)
    return outcome('INTERNAL_ERROR', { message: 'Unable to load preferences' })
  }
}

const savePreferences = async (command) => {
  const { categoryIds } = command.payload

  if (!Array.isArray(categoryIds) || !categoryIds.every(Number.isInteger)) {
    return outcome('INVALID', { message: 'Category IDs must be an array of whole numbers' })
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

    // Replace the complete selection so cleared topics are removed as well.
    await repository.statement5([command.actor.user_id], connection)

    if (uniqueCategoryIds.length > 0) {
      const values = uniqueCategoryIds.map((categoryId) => [command.actor.user_id, categoryId])
      await repository.statement6([values], connection)
    }

    await connection.commit()
    return outcome('OK', { message: 'Topics saved successfully' })
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
