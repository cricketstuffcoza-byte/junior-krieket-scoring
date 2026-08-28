# Junior Krieket Scoring — Portal Architecture V1

## Scope

This architecture adds the web portals around the existing scoring engine. The existing O/6 and O/7 `scorer.html` remains a separate, protected scoring module and is not replaced by the portals.

O/8 is explicitly out of scope for this scorer. It will later receive its own scoring module and ruleset.

## Roles

### Admin
- Full system administration.
- Create and manage teams, players, coaches, guardians and fixtures/matches.
- Assign coaches to teams.
- Assign exactly one scoring coach/user to a match.
- View any team's and any player's statistics.
- Generate any player's report.
- Correct authorised completed-match data through an admin correction workflow.
- View and manage league points.

### Coach
- Access only teams assigned through `coach_teams`.
- View only players belonging to those teams.
- View own team's fixtures and statistics.
- Generate reports only for players in own team.
- Create/edit player report feedback and homework for authorised players.
- A coach may score a match only when assigned as the match scorer.
- A non-scorer coach may use the live viewer but cannot alter scoring data.

### Parent/Guardian
- Access only players linked through `guardian_players`.
- View the linked child's profile, match statistics and reports.
- View homework and mark the linked child's homework as completed.
- View upcoming fixtures for the linked child and submit availability through `fixture_availability`.
- No access to other players, teams or scoring controls.

### Live Viewer
- Read-only match view.
- Available to authorised authenticated coaches, admins and linked guardians.
- Never exposes scoring controls.

## Routes

- `/login` — shared Supabase Auth login.
- `/admin` — admin dashboard.
- `/admin/teams` — teams and player management.
- `/admin/coaches` — coach/team assignments.
- `/admin/guardians` — guardian/player links.
- `/admin/matches` — fixture/match creation and management.
- `/admin/reports` — any player report.
- `/admin/statistics` — system-wide statistics.
- `/admin/points` — league points.
- `/coach` — coach dashboard.
- `/coach/team` — coach's team.
- `/coach/players` — coach's players.
- `/coach/reports` — player reports for coach's own players.
- `/parent` — guardian dashboard.
- `/parent/child` — linked child profile.
- `/parent/fixtures` — upcoming fixtures and availability.
- `/live/:matchId` — read-only live match viewer.
- `/scorer/:matchId` — protected launcher for the existing scorer module.

## Existing database mapping

| Portal feature | Existing table(s) |
|---|---|
| Users/roles | `user_profiles` |
| Teams | `teams` |
| Coach/team access | `coach_teams` |
| Players | `players` |
| Guardian/child access | `guardian_players` |
| Fixtures | `fixture_list` / `matches` |
| Match roster | `match_players` |
| Scorer assignment | `match_scorers` / `matches.scorer_user_id` |
| Live state | `live_match_state` |
| Innings | `innings` |
| Ball-by-ball | `ball_events` |
| Bowling/fielding assignments | `over_assignments`, `ball_events` |
| Match statistics | `player_match_stats` |
| Career statistics | `player_career_stats` |
| Player reports | `player_reports` |
| Homework completion | `homework_completions` |
| Fixture availability | `fixture_availability` |
| League points | `team_points_log` |

## Match/scoring authority

A match has one authoritative scorer. `matches.scorer_user_id` and `match_scorers` are used to identify the scorer. The scorer route must verify this server-side/database-side before allowing scoring actions.

All other users receive a read-only live view. The UI must not be treated as the security boundary; database/RLS policies remain authoritative.

## Age-group routing

`matches.age_group` and `teams.age_group` determine the scoring module.

- `O/6` → existing O/6 scorer.
- `O/7` → existing O/7 scorer.
- `O/8` → reserved for a future separate scorer.

The portal must never silently use the O/6/O/7 scorer for O/8.

## Player reports

Reports are generated outside the scoring UI.

Coach flow:
1. Select own team.
2. Select player.
3. Select completed match/report context.
4. Load `player_match_stats` and relevant fielding/bowling data.
5. Calculate the lowest relevant performance area.
6. Suggest a homework exercise of approximately 15 minutes or less.
7. Coach may accept/change the exercise.
8. Coach enters feedback.
9. Save to `player_reports`.
10. Generate the one-page PDF.

Admin follows the same flow but can select any team/player.

## Homework recommendation model

The first implementation is rules-based rather than dependent on an external AI service.

- Batting: use relevant batting performance from `player_match_stats`.
- Bowling: use relevant bowling performance from `player_match_stats`.
- Fielding: use catches + run-outs and available fielding events.
- Ignore areas where the player did not participate.
- If no reliable area can be compared, use a neutral/general skill exercise.

The coach remains the final decision-maker.

## Parent homework completion

`homework_completions` records completion for the exact `player_reports` row, player and guardian. The parent sees a simple checkbox. No video proof or formal assessment is required.

## Live updates

The live viewer subscribes to authorised match updates using Supabase Realtime. The preferred architecture is a private channel/broadcast model. The viewer is read-only and cannot write scoring events.

## Security principles

1. Supabase Auth identifies the user.
2. `user_profiles.role` determines application role.
3. Coach access is derived from `coach_teams`.
4. Guardian access is derived from `guardian_players`.
5. Match scoring authority is derived from the match scorer assignment.
6. RLS is the real security boundary; hidden buttons are not security.
7. No service-role key is exposed to browser code.
8. Admin-only writes/corrections must be protected by server-side/database authorization.

## UI separation

The scoring screen remains focused on live scoring. It must not contain the player-report workflow.

The Coach Portal contains the player-report workflow.

The Admin Portal contains the system-wide version of the player-report workflow.

The Parent Portal contains the read-only child experience, fixture availability and homework completion.

## Future extension

The portal shell is age-group independent. Each age group can select its own scoring engine and rules without changing the role model, player model, reports, parent access or team points architecture.
