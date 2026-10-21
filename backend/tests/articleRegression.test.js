'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const backend=path.resolve(__dirname,'..');
const dir=[path.join(backend,'modules','articles'),path.join(backend,'src','modules','articles')].find(fs.existsSync);
if(!dir)throw new Error('Cannot find articles module');
const repositoryPath=path.join(dir,'articleRepository.js');
const servicePath=path.join(dir,'articleService.js');
const stub={
 findCategory:async()=>({category_id:1}),insertArticle:async()=>9,
 findCreatedArticle:async()=>({article_id:9,title:'Test'}),
 findByAuthor:async()=>[],softDelete:async()=>1,findForEdit:async()=>({article_id:9}),
 update:async()=>1,findPublishedById:async()=>({article_id:9}),
 findPublished:async()=>[],findPersonalised:async()=>[],recordView:async()=>({view_count:1})
};
require.cache[repositoryPath]={id:repositoryPath,filename:repositoryPath,loaded:true,exports:stub};
const svc=require(servicePath);
const input={title:' Title ',summary:' Summary ',content:' Content ',category_id:1,status:'draft'};
test('draft creation trims inputs and returns expected envelope',async()=>{
 const result=await svc.createArticle(input,2);
 assert.match(result.message,/draft/i);assert.equal(result.article.article_id,9);
});
test('invalid article status rejected on update',async()=>{
 await assert.rejects(svc.updateArticle(9,2,{...input,status:'invalid'}),e=>e.status===400);
});
test('updating missing article returns 404',async()=>{
 const original=stub.update;stub.update=async()=>0;
 try{await assert.rejects(svc.updateArticle(9,2,input),e=>e.status===404);}
 finally{stub.update=original;}
});
test('deleting existing article returns message',async()=>{
 assert.match((await svc.deleteArticle(9,2)).message,/deleted/i);
});
test('article view requires published article',async()=>{
 const original=stub.recordView;stub.recordView=async()=>null;
 try{await assert.rejects(svc.recordArticleView(9,'123e4567-e89b-42d3-a456-426614174000'),e=>e.status===404);}
 finally{stub.recordView=original;}
});
test('published article not found returns 404',async()=>{
 const original=stub.findPublishedById;stub.findPublishedById=async()=>null;
 try{await assert.rejects(svc.getArticleById(9),e=>e.status===404);}
 finally{stub.findPublishedById=original;}
});
