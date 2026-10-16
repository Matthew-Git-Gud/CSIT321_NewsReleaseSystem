const categoryService = require("./categoryService");

async function getCategories(req, res) {
  try {
    const categories = await categoryService.listCategories();
    return res.status(200).json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ message: "Server error while fetching categories" });
  }
}

module.exports = { getCategories };
