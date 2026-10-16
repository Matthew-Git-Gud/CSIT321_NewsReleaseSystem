'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const repoPath=path.resolve(__dirname,'../modules/articles/articleRepository.js');
const servicePath=path.resolve(__dirname,'../modules/articles/articleService.js');
const stub={
 findCategory:async()=>({category_id:1}),
 insertArticle:async()=>17,
 findCreatedArticle:async()=>({article_id:17,title:'Example'}),
 findByAuthor:async()=>[],
 softDelete:async()=>0,
 findForEdit:async()=>null,
 update:async()=>0,
 findPublishedById:async()=>null,
 findPublished:async()=>[],
 findPersonalised:async()=>[],
 recordView:async()=>null
};
require.cache[repoPath]={id:repoPath,filename:repoPath,loaded:true,exports:stub};
const service=require(servicePath);
const isStatus=status=>error=>error instanceof service.ArticleError&&error.status===status;
test('article creation requires title, summary, content and category',async()=>{
 await assert.rejects(service.createArticle({title:'',summary:'S',content:'C',category_id:1},1),isStatus(400));
});
test('article creation rejects an unknown category',async()=>{
 const old=stub.findCategory;stub.findCategory=async()=>null;
 try{await assert.rejects(service.createArticle({title:'T',summary:'S',content:'C',category_id:9},1),isStatus(400));}
 finally{stub.findCategory=old;}
});
test('article creation preserves published response contract',async()=>{
 const result=await service.createArticle({title:' Test ',summary:' S ',content:' C ',category_id:1,status:'published'},2);
 assert.equal(result.article.article_id,17);
 assert.match(result.message,/published/i);
});
test('article listing returns articles envelope',async()=>{
 assert.deepEqual(await service.getMyArticles(1),{articles:[]});
 assert.deepEqual(await service.getPublishedArticles(),{articles:[]});
 assert.deepEqual(await service.getPersonalisedFeed(1),{articles:[]});
});
test('article deletion and edit lookup preserve 404 handling',async()=>{
 await assert.rejects(service.deleteArticle(1,1),isStatus(404));
 await assert.rejects(service.getArticleForEdit(1,1),isStatus(404));
});
test('article views reject invalid ID or session ID',async()=>{
 await assert.rejects(service.recordArticleView('abc','abc'),isStatus(400));
 await assert.rejects(service.recordArticleView(2,'invalid'),isStatus(400));
});
