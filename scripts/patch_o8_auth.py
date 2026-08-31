from pathlib import Path
import re

p = Path('scorer-o8-v9.html')
s = p.read_text(encoding='utf-8')

# Production boot: prefer an authenticated Coach session, but allow the scorer
# to load the match directly using the scorer's anon RLS fallback.
pattern = r'const\{data:\{session\},error:sessionError\}=await supabaseClient\.auth\.getSession\(\);.*?supabaseClient\.auth\.onAuthStateChange\(\(_event,session\)=>\{authSession=session\}\);'
replacement = 'const{data:{session},error:sessionError}=await supabaseClient.auth.getSession();if(sessionError)console.warn("Supabase session check:",sessionError.message);authSession=session||null;const H={apikey:SUPABASE_KEY,Authorization:authSession?.access_token?"Bearer "+authSession.access_token:SUPABASE_KEY,Accept:"application/json"};supabaseClient.auth.onAuthStateChange((_event,session)=>{authSession=session||null});/* direct-access fallback: authenticated Coach session preferred; anon RLS supported. */'
s, n = re.subn(pattern, replacement, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('Could not patch production authentication block')

# Save: use the authenticated token when available, otherwise use the anon key.
pattern2 = r'if\(sessionError\|\|!session\?\.access_token\)throw new Error\(sessionError\?\.message\|\|"Geen geldige Coach-sessie vir stoor nie\."\);authSession=session;const H=\{apikey:KEY,Authorization:"Bearer "+session\.access_token,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"\},'
replacement2 = 'if(sessionError)console.warn("Supabase save session check:",sessionError.message);authSession=session||null;const H={apikey:KEY,Authorization:authSession?.access_token?"Bearer "+authSession.access_token:KEY,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},'
s, n2 = re.subn(pattern2, replacement2, s, count=1)
if n2 != 1:
    raise SystemExit('Could not patch save authentication block')

p.write_text(s, encoding='utf-8')
print('O/8 auth fallback patch applied')
