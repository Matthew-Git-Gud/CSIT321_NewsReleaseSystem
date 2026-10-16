'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const backend = path.resolve(__dirname, '..');
const routesPath = [path.join(backend,'routes','routes.js'),path.join(backend,'src','routes','routes.js')].find(fs.existsSync);
if (!routesPath) throw new Error('Cannot locate backend routes/routes.js');
const source = fs.readFileSync(routesPath,'utf8');
const endpoints = [
 ['POST','/auth/register'],['POST','/auth/login'],['GET','/auth/me'],
 ['GET','/categories'],['GET','/articles'],['POST','/articles'],
 ['GET','/articles/mine'],['GET','/articles/:id'],['GET','/articles/:id/edit'],
 ['PUT','/articles/:id'],['DELETE','/articles/:id'],['POST','/articles/:id/view'],
 ['GET','/saved-articles'],['GET','/articles/:articleId/comments'],
 ['POST','/articles/:articleId/comments'],['GET','/articles/:articleId/rating'],
 ['POST','/articles/:articleId/reports'],['GET','/preferences']
];
for (const [method,url] of endpoints) {
 test(`${method} ${url} is registered`,()=>{
  const regex=new RegExp('router\\.'+method.toLowerCase()+'\\s*\\(\\s*["\\\']'+url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\\\']');
  assert.match(source,regex);
 });
}
