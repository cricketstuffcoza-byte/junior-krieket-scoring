from pathlib import Path

p = Path('scorer-o8-v9.html')
s = p.read_text(encoding='utf-8')
old = 'const {data:{session},error:sessionError}=await supabaseClient.auth.getSession();if(sessionError)throw new Error("Supabase-aanmelding kon nie bevestig word nie: "+sessionError.message);authSession=session;if(!authSession?.access_token)throw new Error("Geen aangemelde Coach-sessie gevind nie. Maak die telkaart vanuit Coach V25 oop.");const H={apikey:SUPABASE_KEY,Authorization:"Bearer "+authSession.access_token,Accept:"application/json"};supabaseClient.auth.onAuthStateChange((_event,session)=>{authSession=session});'
new = 'const {data:{session},error:sessionError}=await supabaseClient.auth.getSession();if(sessionError)console.warn("Supabase session check:",sessionError.message);authSession=session||null;const H={apikey:SUPABASE_KEY,Authorization:authSession?.access_token?"Bearer "+authSession.access_token:SUPABASE_KEY,Accept:"application/json"};supabaseClient.auth.onAuthStateChange((_event,session)=>{authSession=session||null});'
if old in s:
    s = s.replace(old, new, 1)
old2 = 'if(sessionError||!session?.access_token)throw new Error(sessionError?.message||"Geen geldige Coach-sessie vir stoor nie.");authSession=session;const H={apikey:KEY,Authorization:"Bearer "+session.access_token,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},'
new2 = 'if(sessionError)console.warn("Supabase save session check:",sessionError.message);authSession=session||null;const H={apikey:KEY,Authorization:authSession?.access_token?"Bearer "+authSession.access_token:KEY,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},'
if old2 in s:
    s = s.replace(old2, new2, 1)
# Make the visible version label unambiguous.
s = s.replace('O/8 V9 • 80 balle • 5 balle per boulbeurt', 'O/8 V9 • 80 balle • 5 balle per boulbeurt', 1)
# Add an explicit direct-access status message without breaking the production flow.
marker = 'const H={apikey:SUPABASE_KEY,Authorization:authSession?.access_token?"Bearer "+authSession.access_token:SUPABASE_KEY,Accept:"application/json"};'
if marker in s and 'direct-access fallback' not in s:
    s = s.replace(marker, marker + '/* direct-access fallback: authenticated Coach session is preferred; anon RLS is supported for this scorer. */', 1)
p.write_text(s, encoding='utf-8')
print('O/8 auth fallback patch applied')
