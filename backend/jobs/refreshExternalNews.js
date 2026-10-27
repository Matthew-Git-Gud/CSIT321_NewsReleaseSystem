// Run from backend root: node jobs/refreshExternalNews.js
require('dotenv').config();
const service = require('../modules/newsAggregation/newsService');
service.refreshCategories()
  .then(report => { console.log(JSON.stringify(report, null, 2));
    if (Object.values(report).every(x => x.error)) process.exitCode = 1;
  })
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(async () => {
    const db = require('../config/database');
    await db.end();
  });
