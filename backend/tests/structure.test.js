'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '../modules');
const expected = {
  admin: ['getDashboard','getUsers','updateUserStatus','deleteArticleAsAdmin','getArticleForAdminEdit','updateArticleAsAdmin'],
  appeals: ['submitAppeal','getPendingAppeals','reviewAppeal'],
  articles: ['createArticle','getMyArticles','deleteArticle','getArticleForEdit','updateArticle','getArticleById','getPublishedArticles','getPersonalisedFeed','recordArticleView'],
  auth: ['register','login','adminLogin','logout','getCurrentUser'],
  categories: ['getCategories'],
  comments: ['getComments','createComment','updateComment','deleteComment'],
  preferences: ['getCategories','getPreferences','savePreferences'],
  ratings: ['getArticleRating','rateArticle'],
  reports: ['createArticleReport','getArticleReportStatus','getPendingReports','updateReportStatus'],
  'saved-articles': ['getSavedArticles','getSavedStatus','saveArticle','unsaveArticle']
};
const mockPool = {
  query: async()=>[[],[]],execute:async()=>[[],[]],
  getConnection: async()=>({query:async()=>[[],[]],execute:async()=>[[],[]],beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{}})
};
const originalLoad = Module._load;
Module._load = function(id, parent, isMain){
  if(id==='mysql2/promise')return {createPool:()=>mockPool};
  if(id==='bcrypt')return {hash:async()=>'',compare:async()=>false};
  if(id==='jsonwebtoken')return {sign:()=> 'token',verify:()=>({purpose:'suspension_appeal',user_id:1})};
  return originalLoad.call(this,id,parent,isMain);
};
const database = path.resolve(__dirname,'../config/database.js');
require.cache[database] = {id:database,filename:database,loaded:true,exports:mockPool};
for(const [folder,names] of Object.entries(expected)){
 test(`${folder}: controller, service, repository exports`,()=>{
  const dir=path.join(root,folder);
  const files=fs.readdirSync(dir);
  const controllerFile=files.find(f=>f.endsWith('Controller.js'));
  const prefix=controllerFile.slice(0,-'Controller.js'.length);
  for(const layer of ['Controller','Service','Repository'])assert.ok(files.includes(`${prefix}${layer}.js`),`${folder} missing ${layer}`);
  const controller=require(path.join(dir,controllerFile));
  const service=require(path.join(dir,`${prefix}Service.js`));
  const repository=require(path.join(dir,`${prefix}Repository.js`));
  for(const name of names){assert.equal(typeof controller[name],'function',name);if(folder!=='categories')assert.equal(typeof service[name],'function',name);}
  if(folder==='categories')assert.equal(typeof service.listCategories,'function');
  assert.ok(Object.values(repository).some(v=>typeof v==='function'));
 });
}
for(const [folder] of Object.entries(expected)){
 if(['articles','categories'].includes(folder))continue;
 test(`${folder}: repository SQL delegation`,async()=>{
  const dir=path.join(root,folder);
  const file=fs.readdirSync(dir).find(f=>f.endsWith('Repository.js'));
  const repo=require(path.join(dir,file));
  const statements=Object.entries(repo).filter(([k])=>/^statement\d+$/.test(k));
  assert.ok(statements.length>0);
  const calls=[];
  const conn={query:async(sql,params)=>{calls.push({sql,params});return [[],[]]},execute:async(sql,params)=>{calls.push({sql,params});return [[],[]]}};
  for(const [,fn] of statements){
   // Dynamic template strings need interpolation vars. They are checked for syntax separately.
   await fn([],conn,{whereClause:'',placeholders:'?',sortClause:''});
  }
  assert.equal(calls.length,statements.length);
  assert.ok(calls.every(c=>typeof c.sql==='string'&&c.sql.length>0));
 });
}
