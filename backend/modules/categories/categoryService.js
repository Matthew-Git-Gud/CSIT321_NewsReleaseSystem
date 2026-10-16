const categoryRepository = require("./categoryRepository");

async function listCategories() {
  return categoryRepository.findAllCategories();
}

module.exports = { listCategories };
