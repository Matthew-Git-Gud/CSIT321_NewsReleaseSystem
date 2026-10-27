import {useEffect,useState,type FormEvent} from 'react';
import {useLocation,Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {chatApi,type ChatMessage,type ChatArticle} from '../services/chat';
import '../styles/AiChatWidget.css';

export default function AiChatWidget(){
 const {user}=useAuth(),location=useLocation();
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [conversationId,setConversationId]=useState<number|null>(null);
 const [conversations,setConversations]=useState<{id:number;title:string}[]>([]);
 const [messages,setMessages]=useState<ChatMessage[]>([]);
 const [articles,setArticles]=useState<ChatArticle[]>([]);
 const articleMatch=location.pathname.match(/^\/articles\/(\d+)$/);
 const context=articleMatch?{type:'article' as const,articleId:Number(articleMatch[1])}:{type:'general' as const};

 useEffect(()=>{
  setConversationId(null);
  setMessages([]);
  setArticles([]);
  setError('');
  if(user)chatApi.list().then(setConversations).catch(()=>{});
 },[user?.user_id]);

 async function selectConversation(id:number){
  setBusy(true);
  try{
   setMessages(await chatApi.messages(id));
   setConversationId(id);
   setArticles([]);
   setError('');
  }catch(e){setError((e as Error).message)}
  finally{setBusy(false)}
 }

 function newChat(){
  setConversationId(null);
  setMessages([]);
  setArticles([]);
  setError('');
  setDraft('');
 }

 async function send(e:FormEvent){
  e.preventDefault();
  const message=draft.trim();
  // Guard here for keyboard submission or unexpected form events, not only disabled button state.
  if(!message){
   setError('Please enter a message.');
   return;
  }
  if(busy)return;

  setBusy(true);
  setError('');
  setDraft('');
  const prior=messages;
  setMessages([...prior,{role:'user',content:message}]);
  try{
   let id=conversationId;
   if(user&&!id){id=(await chatApi.create()).id;setConversationId(id);}
   const result=await chatApi.send({message,conversationId:id,history:user?undefined:prior,context});
   setMessages([...prior,{role:'user',content:message},{role:'assistant',content:result.reply}]);
   setArticles(result.articles||[]);
   if(user)chatApi.list().then(setConversations).catch(()=>{});
  }catch(e){
   setMessages(prior);
   setDraft(message);
   setError((e as Error).message);
  }finally{setBusy(false)}
 }

 return <div className="ai-chat-anchor">
  {open&&<section className="ai-chat-panel" aria-label="News AI assistant">
   <header className="ai-chat-header"><strong>News AI Assistant</strong><div><button onClick={newChat} title="New chat">＋</button><button onClick={()=>setOpen(false)} title="Close">×</button></div></header>
   <div className="ai-chat-context">{context.type==='article'?`Discussing article #${context.articleId}`:'General news discovery'}</div>
   {user&&<select aria-label="Previous conversations" value={conversationId??''} onChange={e=>e.target.value?selectConversation(Number(e.target.value)):newChat()}>
    <option value="">New conversation</option>{conversations.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
   </select>}
   <div className="ai-chat-messages" aria-live="polite">
    {messages.length===0&&<p>Ask about news, find related stories, or discuss the article you're reading.</p>}
    {messages.map((m,i)=><div className={`ai-chat-bubble ${m.role}`} key={i}><strong>{m.role==='user'?'You':'Assistant'}</strong><p>{m.content}</p></div>)}
    {busy&&<p>Thinking…</p>}
    {articles.length>0&&<div className="ai-chat-links"><strong>Related articles</strong>{articles.map((a,i)=>
     a.url.startsWith('/')?
      <Link key={`${a.url}-${i}`} to={a.url} onClick={()=>setOpen(false)}>{a.title} · {a.source}</Link>:
      <a key={`${a.url}-${i}`} href={a.url} target="_blank" rel="noopener noreferrer">{a.title} · {a.source}</a>
    )}</div>}
   </div>
   {error&&<p role="alert" className="ai-chat-error">{error}</p>}
   <form onSubmit={send} className="ai-chat-compose" noValidate>
    <input aria-label="Message" value={draft} onChange={e=>{setDraft(e.target.value);if(error)setError('');}} maxLength={1500} placeholder="Ask about the news…" />
    <button disabled={busy||!draft.trim()} type="submit">Send</button>
   </form>
   {!user&&<small>Guest chats are temporary. Sign in to save conversations.</small>}
  </section>}
  <button className="ai-chat-launcher" onClick={()=>setOpen(!open)} aria-label={open?'Close news chatbot':'Open news chatbot'}>{open?'×':'✦ Chat'}</button>
 </div>;
}
