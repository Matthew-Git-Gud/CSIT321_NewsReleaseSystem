const pool = require('../config/database')

const getCategories = async (_req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT category_id, name FROM categories ORDER BY name',
    )

    return res.json({ categories })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to load categories' })
  }
}

const getPreferences = async (req, res) => {
  try {
    // Join through the category table so the client receives usable topic names and IDs.
    const [preferences] = await pool.execute(
      `SELECT c.category_id, c.name
       FROM user_preferred_categories AS upc
       JOIN categories AS c ON c.category_id = upc.category_id
       WHERE upc.user_id = ?
       ORDER BY c.name`,
      [req.user.user_id],
    )

    return res.json({ preferences })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to load preferences' })
  }
}

const savePreferences = async (req, res) => {
  const { categoryIds } = req.body

  if (!Array.isArray(categoryIds) || !categoryIds.every(Number.isInteger)) {
    return res.status(400).json({ message: 'Category IDs must be an array of whole numbers' })
  }

  // Removing duplicates prevents a primary-key error when the selected topics are saved.
  const uniqueCategoryIds = [...new Set(categoryIds)]
  const connection = await pool.getConnection()

  try {
    if (uniqueCategoryIds.length > 0) {
      const placeholders = uniqueCategoryIds.map(() => '?').join(', ')
      const [categories] = await connection.execute(
        `SELECT category_id FROM categories WHERE category_id IN (${placeholders})`,
        uniqueCategoryIds,
      )

      if (categories.length !== uniqueCategoryIds.length) {
        return res.status(400).json({ message: 'One or more selected categories do not exist' })
      }
    }

    await connection.beginTransaction()

    // Create the user's preference record if it does not exist yet.
    await connection.execute(
      'INSERT IGNORE INTO user_preferences (user_id) VALUES (?)',
      [req.user.user_id],
    )

    // Replace the complete selection so cleared topics are removed as well.
    await connection.execute(
      'DELETE FROM user_preferred_categories WHERE user_id = ?',
      [req.user.user_id],
    )

    if (uniqueCategoryIds.length > 0) {
      const values = uniqueCategoryIds.map((categoryId) => [req.user.user_id, categoryId])
      await connection.query(
        'INSERT INTO user_preferred_categories (user_id, category_id) VALUES ?',
        [values],
      )
    }

    await connection.commit()
    return res.json({ message: 'Topics saved successfully' })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    return res.status(500).json({ message: 'Unable to save preferences' })
  } finally {
    connection.release()
  }
}

module.exports = {
  getCategories,
  getPreferences,
  savePreferences,
}
