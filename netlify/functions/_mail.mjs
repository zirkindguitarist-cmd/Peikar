export async function mail(to,subject,html){
  const k=process.env.RESEND_API_KEY;if(!k||!to)return;
  try{await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+k,"content-type":"application/json"},
  body:JSON.stringify({from:process.env.FROM_EMAIL||"Yisroel Piekarski Music <onboarding@resend.dev>",to:[to],subject,html})})}catch(e){console.error(e)}
}
