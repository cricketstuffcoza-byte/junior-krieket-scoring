# Junior Krieket V18

Afrigter-portaal foundation:
- Coach authentication via Supabase Auth.
- Coach access restricted to active `coach_teams` assignments.
- Coach sees only fixtures involving assigned teams.
- LIVE fixtures can open the existing `scorer.html` with the match ID.
- Completed fixtures allow the coach to select match players and submit individual reports.
- Reports are stored in `player_reports` with coach feedback and approximately 15-minute homework.
- Homework evidence remains governed by the existing requirement that completion requires a minimum 1-minute video clip.

The existing Admin V17 and scorer pages are intentionally not replaced by this change.

Future report-notification work will connect submitted reports to guardian email and the parent portal/PDF workflow.
