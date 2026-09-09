const pool = require('../config/database')

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      `SELECT category_id, name
       FROM categories
       ORDER BY name ASC`,
    )

    return res.status(200).json({
      categories,
    })
  } catch (error) {
    console.error('Get categories error:', error)

    return res.status(500).json({
      message: 'Server error while fetching categories',
    })
  }
}

module.exports = {
  getCategories,
}