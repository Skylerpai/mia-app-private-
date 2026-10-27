import http from 'node:http';
import crypto from 'node:crypto';
const port=Number(process.env.PORT3000);
const user = process.env.APP_USER || 'owner';
const user=process.env.APP_USER'owner';
const passHash=process.env.APP_PASSWORD_SHA256'';
const sessions=new Map();
const data={messages:[],memories:[]};
const json=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(body));};
const read=(req)=>new Promise((ok,fail)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{ok(s?JSON.parse(s):{})}catch(e){fail(e)}})});
const token=()=>crypto.randomBytes(32).toString('hex');
const auth=(req)=>{const t=(req.headers.authorization'').replace(/^Bearer /,'');return t&&sessions.has(t)};
const server=http.createServer(async(req,res)=>{
try{
if(req.method==='GET'&&req.url==='/health')return json(res,200,{ok:true});
if(req.method==='POST'&&req.url==='/auth/login'){
const b=await read(req);const hash=crypto.createHash('sha256').update(String(b.password'')).digest('hex');
if(b.username!==user!passHashhash!==passHash)return json(res,401,{error:'invalid credentials'});
const t=token();sessions.set(t,Date.now());return json(res,200,{token:t});
}
if(!auth(req))return json(res,401,{error:'authentication required'});
if(req.method==='GET'&&req.url==='/api/state')return json(res,200,data);
if(req.method==='POST'&&req.url==='/api/messages'){const b=await read(req);data.messages.push({from:'You',text:String(b.text''),at:new Date().toISOString()});return json(res,201,{ok:true});}
if(req.method==='POST'&&req.url==='/api/memories'){const b=await read(req);data.memories.push({text:String(b.text||''),at:new Date().toISOString()});return json(res,201,{ok:true});}
return json(res,404,{error:'not found'});
}catch(e){return json(res,400,{error:'bad request'})}
});
server.listen(port,()=>console.log(Mia backend listening on ${port}));
