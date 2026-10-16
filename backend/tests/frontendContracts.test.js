'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const front=path.join(root,'frontend','src');
const backend=path.join(root,'backend');
const routeFile=[path.join(backend,'routes','routes.js'),path.join(backend,'src','routes','routes.js')].find(fs.existsSync);
const routes=routeFile?fs.readFileSync(routeFile,'utf8'):'';
const required={
 'articles.ts':['getPublishedArticles','createArticle','getArticleById','updateArticle','deleteArticle'],
 'auth.ts':[], 'categories.ts':[], 'comments.ts':[], 'savedArticles.ts':[],
 'ratings.ts':[], 'reports.ts':[], 'preferences.ts':[], 'admin.ts':[]
};
for(const [file,names] of Object.entries(required)){
 test(`frontend service ${file} exists`,()=>{
  const f=path.join(front,'services',file);assert.ok(fs.existsSync(f),`Missing ${f}`);
  const source=fs.readFileSync(f,'utf8');
  for(const name of names)assert.match(source,new RegExp('(?:function|const)\\s+'+name+'\\b'));
 });
}
test('article CRUD endpoints exist for frontend services',()=>{
 assert.ok(routes,'Missing routes.js');
 for(const method of ['get','post','put','delete']){
  assert.match(routes,new RegExp('router\\.'+method+'\\s*\\('));
 }
 assert.match(routes,/['"]\/articles['"]/);
 assert.match(routes,/['"]\/articles\/:id['"]/);
});
test('article publishing and editing pages exist',()=>{
 for(const file of ['PublishArticle.tsx','EditArticle.tsx','ArticleView.tsx','MyArticles.tsx'])
 assert.ok(fs.existsSync(path.join(front,'pages',file)),`Missing ${file}`);
});
