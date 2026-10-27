const repo=require('./chatRepository');
const service=require('./chatService');
const WINDOW_MS=60_000, LIMIT=8, attempts=new Map();
function rateLimit(req,res,next){
 const key=req.user?.user_id?`u:${req.user.user_id}`:`g:${req.ip}`;
 const now=Date.now();const entry=attempts.get(key)||{start:now,count:0};
 if(now-entry.start>WINDOW_MS){entry.start=now;entry.count=0;}
 entry.count++;attempts.set(key,entry);
 if(entry.count>LIMIT)return res.status(429).json({message:'Please wait before sending more messages.'});
 next();
}
const wrap=fn=>(req,res)=>Promise.resolve(fn(req,res)).catch(e=>{console.error('Chat error',e);res.status(500).json({message:'Chat service temporarily unavailable'});});
const create=wrap(async(req,res)=>{
 if(!req.user)return res.status(401).json({message:'Sign in to save conversations'});
 const id=await repo.create(req.user.user_id);res.status(201).json({id});
});
const list=wrap(async(req,res)=>res.json(await repo.list(req.user.user_id)));
const messages=wrap(async(req,res)=>{
 if(!await repo.owned(req.params.id,req.user.user_id))return res.status(404).json({message:'Conversation not found'});
 res.json(await repo.messages(req.params.id));
});
const remove=wrap(async(req,res)=>{await repo.remove(req.params.id,req.user.user_id);res.status(204).end();});
const send=wrap(async(req,res)=>{
 const message=typeof req.body?.message==='string'?req.body.message.trim():'';
 if(!message||message.length>1500)return res.status(400).json({message:'Message must contain 1–1500 characters'});
 let history=[],id=null;
 if(req.user){
   id=Number(req.body?.conversationId);
   if(!Number.isSafeInteger(id)||!await repo.owned(id,req.user.user_id))return res.status(404).json({message:'Conversation not found'});
   history=await repo.messages(id);
 } else {
   // Guest history supplied from browser, validated and capped; no server-side guest persistence.
   history=Array.isArray(req.body?.history)?req.body.history.slice(-12).filter(m=>['user','assistant'].includes(m?.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,3000)})):[];
 }
 const result=await service.answer(message,history,req.body?.context);
 if(id){
   await repo.append(id,'user',message);
   await repo.append(id,'assistant',result.reply);
   if(history.length===0)await repo.rename(id,message.slice(0,80));
 }
 res.json({...result,conversationId:id});
});
module.exports={create,list,messages,remove,send,rateLimit};
