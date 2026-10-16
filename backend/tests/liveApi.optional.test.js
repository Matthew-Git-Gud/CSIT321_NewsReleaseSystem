'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const base=process.env.TEST_API_BASE_URL;
const enabled=Boolean(base)&&process.env.RUN_LIVE_API_TESTS==='1';
const request=async(endpoint)=>fetch(base.replace(/\/$/,'')+endpoint,{signal:AbortSignal.timeout(5000)});
test('LIVE: GET /categories responds with JSON',{skip:!enabled},async()=>{
 const res=await request('/categories');assert.equal(res.status,200);
 assert.match(res.headers.get('content-type')||'',/json/i);
});
test('LIVE: GET /articles responds with JSON',{skip:!enabled},async()=>{
 const res=await request('/articles');assert.equal(res.status,200);
 const data=await res.json();assert.ok(Array.isArray(data.articles));
});
test('LIVE: unknown article does not return server error',{skip:!enabled},async()=>{
 const res=await request('/articles/2147483647');assert.equal(res.status,404);
});
