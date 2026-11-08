import {getStore} from "@netlify/blobs";
import crypto from "node:crypto";
import {mail} from "./_mail.mjs";
const j=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json"}});
const tokOf=()=>crypto.createHmac("sha256",process.env.SECRET||"change-me").update(process.env.ADMIN_PASSWORD||"").digest("hex");
const all=async s=>{const{blobs}=await s.list();return Promise.all(blobs.map(b=>s.get(b.key,{type:"json"})))};
const esc=s=>String(s??"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
export default async req=>{
  const a=new URL(req.url).searchParams.get("a"),b=await req.json().catch(()=>({}));
  const gigs=getStore("gigs"),reqs=getStore("requests"),cfgS=getStore("cfg");
  const cfg=(await cfgS.get("cfg",{type:"json"}))||{};
  if(a==="login"){if(process.env.ADMIN_PASSWORD&&b.password===process.env.ADMIN_PASSWORD)return j({token:tokOf()});return j({error:"bad"},401)}
  if(a==="book"){
    if(b.bot)return j({ok:true});
    if(!b.name||!b.phone||!b.date)return j({error:"missing"},400);
    const id=crypto.randomUUID(),r={id,at:new Date().toISOString()};
    for(const k of["name","phone","email","eventType","date","time","location","guests","lighting","notes"])r[k]=String(b[k]??"").slice(0,500);
    await reqs.setJSON(id,r);
    await mail(process.env.ADMIN_EMAIL,`New booking request: ${r.name} (${r.date})`,`<p><b>${esc(r.name)}</b> ${esc(r.phone)} ${esc(r.email)}</p><p>${esc(r.eventType)} on ${esc(r.date)} ${esc(r.time)} at ${esc(r.location)}<br>Guests: ${esc(r.guests)} · Lighting: ${esc(r.lighting)}</p><p>${esc(r.notes)}</p><p>Open your admin to approve.</p>`);
    await mail(r.email,"We got your request",`<p>Hi ${esc(r.name)}, thanks for reaching out to Yisroel Piekarski Music. We received your request for ${esc(r.date)} and will be in touch shortly. For anything urgent call or text 929-331-6708.</p>`);
    return j({ok:true});
  }
  if(a==="invoice"){const g=await gigs.get(String(b.id||""),{type:"json"});if(!g)return j({error:"nf"},404);
    return j({gig:{client:g.client,email:g.email,phone:g.phone,type:g.type,date:g.date,time:g.time,location:g.location,fee:g.fee,lighting:g.lighting,paid:g.paid},pay:{zelle:cfg.zelle,cash:cfg.cash,paypal:cfg.paypal}})}
  if(req.headers.get("x-token")!==tokOf()||!process.env.ADMIN_PASSWORD)return j({error:"auth"},401);
  if(a==="list")return j({gigs:await all(gigs),requests:(await all(reqs)).sort((x,y)=>x.at.localeCompare(y.at)),cfg});
  if(a==="save"){const id=b.id||crypto.randomUUID(),old=(await gigs.get(id,{type:"json"}))||{};
    const g={...old,...b,id,sent:old.sent||{}};if(g.paid)delete g.nagAt;await gigs.setJSON(id,g);return j({gig:g})}
  if(a==="del"){await gigs.delete(b.id);return j({ok:true})}
  if(a==="cfg"){await cfgS.setJSON("cfg",{zelle:b.zelle||"",cash:b.cash||"",paypal:b.paypal||""});return j({ok:true})}
  if(a==="decline"){await reqs.delete(b.id);return j({ok:true})}
  if(a==="approve"){const r=await reqs.get(b.id,{type:"json"});if(!r)return j({error:"nf"},404);
    const id=crypto.randomUUID(),g={id,client:r.name,phone:r.phone,email:r.email,type:r.eventType,date:r.date,time:r.time,location:r.location,lighting:r.lighting==="Yes"?"Yes":"No",notes:[r.guests&&"Guests: "+r.guests,r.notes].filter(Boolean).join(" · "),fee:"",paid:false,sent:{}};
    await gigs.setJSON(id,g);await reqs.delete(b.id);
    await mail(r.email,"You're on the calendar!",`<p>Hi ${esc(r.name)}, your ${esc(r.eventType)} on ${esc(r.date)} is confirmed with Yisroel Piekarski Music. Questions? Call or text 929-331-6708.</p>`);
    return j({gig:g})}
  return j({error:"unknown"},404);
};
