# Setup (about 10 minutes)
1. Put this folder in a GitHub repo, then Netlify > Add new site > Import from Git. (Functions need a Git deploy so dependencies install.)
2. Site settings > Environment variables, add:
   - ADMIN_PASSWORD  (admin login)
   - SECRET          (any long random string)
   - ADMIN_EMAIL     (where reminders and new requests go)
   - RESEND_API_KEY  (free at resend.com)
   - FROM_EMAIL      (optional, a verified Resend sender; otherwise Resend's test sender is used, which only delivers to the Resend account owner)
3. Redeploy. Admin is at /#/admin.
Reminders run daily at ~8am Chicago: 1 week, 2 days, day-of (with customer invoice link), then unpaid nags every 2 days.
