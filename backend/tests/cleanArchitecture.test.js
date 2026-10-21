'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '../modules');
const folders = ['admin','appeals','auth','comments','preferences','ratings','reports','saved-articles'];
const originalLoad = Module._load;
const mockDb = {execute:async()=>[[],[]],query:async()=>[[],[]],getConnection:async()=>({execute:async()=>[[],[]],query:async()=>[[],[]],beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{}})};
Module._load = function(id,parent,isMain){
 if(id==='bcrypt')return {hash:async()=>'',compare:async()=>true};
 if(id==='jsonwebtoken')return {sign:()=> 'test-token',verify:()=>({user_id:1,purpose:'suspension_appeal'})};
 if(id==='mysql2/promise')return {createPool:()=>mockDb};
 return originalLoad.call(this,id,parent,isMain);
};
require.cache[path.resolve(__dirname,'../config/database.js')] = {exports:mockDb,loaded:true};
function response(){return {statusCode:200,body:null,cookies:[],cleared:[],status(n){this.statusCode=n;return this},json(b){this.body=b;return this},cookie(...args){this.cookies.push(args);return this},clearCookie(...args){this.cleared.push(args);return this}}}
for(const folder of folders){
 test(`${folder}: service does not access Express req/res`,()=>{
  const file=fs.readdirSync(path.join(root,folder)).find(x=>x.endsWith('Service.js'));
  const source=fs.readFileSync(path.join(root,folder,file),'utf8');
  assert.doesNotMatch(source,/\breq\s*\.|\bres\s*\.|\b(req|res)\s*,\s*(req|res)\b/);
 });
 test(`${folder}: controller translates domain outcome into HTTP`,async()=>{
  const dir=path.join(root,folder);
  const controllerName=fs.readdirSync(dir).find(x=>x.endsWith('Controller.js'));
  const serviceName=controllerName.replace('Controller.js','Service.js');
  const service=require(path.join(dir,serviceName));
  const controller=require(path.join(dir,controllerName));
  const fn=Object.keys(controller)[0];
  const prior=service[fn];
  service[fn]=async command=>{
   assert.deepEqual(command,{payload:{value:42},identifiers:{id:'7'},filters:{page:'1'},actor:{user_id:9}});
   return {code:'CONFLICT',data:{message:'conflict'}};
  };
  try{
   const res=response();
   await controller[fn]({body:{value:42},params:{id:'7'},query:{page:'1'},user:{user_id:9}},res);
   assert.equal(res.statusCode,409);
   assert.deepEqual(res.body,{message:'conflict'});
  }finally{service[fn]=prior}
 });
}
test('auth: login cookie set by controller, not by service',async()=>{
 const service=require(path.join(root,'auth/authService'));
 const controller=require(path.join(root,'auth/authController'));
 const old=service.login;
 service.login=async()=>({code:'OK',data:{message:'Login successful',__authToken:'example-token',user:{user_id:1}}});
 try{
  const res=response();await controller.login({body:{}},res);
  assert.equal(res.statusCode,200);
  assert.deepEqual(res.body,{message:'Login successful',user:{user_id:1}});
  assert.equal(res.cookies[0][0],'token');
  assert.equal(res.cookies[0][1],'example-token');
  assert.equal(res.cookies[0][2].httpOnly,true);
 }finally{service.login=old}
});
test('auth: logout clears cookie in controller',async()=>{
 const res=response();
 const controller=require(path.join(root,'auth/authController'));
 await controller.logout({body:{}},res);
 assert.equal(res.statusCode,200);
 assert.equal(res.cleared[0][0],'token');
 assert.deepEqual(res.body,{message:'Logout successful'});
});
