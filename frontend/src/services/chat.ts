export type ChatMessage={role:'user'|'assistant';content:string};
export type ChatArticle={title:string;url:string;source:string};
const BASE=import.meta.env.VITE_API_BASE_URL||'http://localhost:3000';

async function request(path:string,init?:RequestInit){
 const r=await fetch(`${BASE}/api/chat${path}`,{
  credentials:'include',
  ...init,
  headers:{'Content-Type':'application/json',...init?.headers}
 });
 const data=r.status===204?null:await r.json().catch(()=>null);
 if(!r.ok)throw new Error(data?.message||`Request failed: ${r.status}`);
 return data;
}

export const chatApi={
 create:():Promise<{id:number}>=>request('/conversations',{method:'POST'}),
 list:():Promise<{id:number;title:string}[]>=>request('/conversations'),
 messages:(id:number):Promise<(ChatMessage&{id:number})[]>=>request(`/conversations/${id}/messages`),
 remove:(id:number)=>request(`/conversations/${id}`,{method:'DELETE'}),
 send:(payload:{message:string;conversationId?:number|null;history?:ChatMessage[];context:{type:'general'|'article';articleId?:number}}):Promise<{reply:string;articles:ChatArticle[];conversationId:number|null}>=>{
  const message=payload.message.trim();
  if(!message) return Promise.reject(new Error('Please enter a message.'));
  return request('/message',{method:'POST',body:JSON.stringify({...payload,message})});
 }
};
