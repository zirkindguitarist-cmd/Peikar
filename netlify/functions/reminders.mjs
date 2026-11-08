import {getStore} from "@netlify/blobs";
import {mail} from "./_mail.mjs";
export const config={schedule:"0 13 * * *"};
const day=s=>Date.parse(s+"T12:00:00Z")/864e5;
export default async()=>{
  const gigs=getStore("gigs"),to=process.env.ADMIN_EMAIL,site=process.env.URL||"";
  const today=new Date().toLocaleDateString("en-CA",{timeZone:"America/Chicago"}),T=day(today);
  const{blobs}=await gigs.list();
  for(const b of blobs){
    const g=await gigs.get(b.key,{type:"json"});if(!g||!g.date)continue;
    g.sent=g.sent||{};const d=day(g.date)-T,inv=`${site}/#/invoice/${g.id}`;
    const info=`${g.client} · ${g.type}<br>${g.date} ${g.time||""} · ${g.location||""}<br>${g.phone||""} ${g.email||""}`;
    const key=d===7?"wk":d===2?"two":d===0?"day":null;
    if(key&&!g.sent[key]){
      const extra=key==="day"?`<p>Customer invoice link (send it to them): <a href="${inv}">${inv}</a></p>`:"";
      await mail(to,`Reminder (${key==="wk"?"1 week":key==="two"?"2 days":"today"}): ${g.client}`,`<p>${info}</p>${extra}`);
      g.sent[key]=1;await gigs.setJSON(g.id,g);
    }
    if(d<0&&!g.paid&&g.fee&&(!g.nagAt||T-day(g.nagAt)>=2)){
      await mail(to,`Unpaid: ${g.client} ($${g.fee})`,`<p>${info}</p><p>Not marked paid. Invoice: <a href="${inv}">${inv}</a></p>`);
      g.nagAt=today;await gigs.setJSON(g.id,g);
    }
  }
};
