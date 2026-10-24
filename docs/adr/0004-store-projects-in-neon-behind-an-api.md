---
id: ADR-0004
status: Accepted
date: 2026-10-23
---

# ADR-0004: Store projects in Neon Postgres behind a small API

## Context and problem statement

BlueprintOS started fully static: projects autosave in the browser and can be downloaded as JSON files (CLAUDE.md, "No backend"). The browser copy is lost if site data is cleared or the homeowner changes computers, and downloading files depends on him remembering to do it. Victor decided the risk is not acceptable for a project that will be used for weeks. Where should projects be stored, and how is access restricted to the allowed users?

## Decision drivers

- A plan must survive a cleared browser or a new computer without user effort.
- Only the family may read or change projects; the site URL is public.
- Free to run for one family; little to operate.
- Keep the existing project format (FDD-0007 version 1.1) and the JSON download.
- The browser must never hold database credentials.

## Considered options

1. **Keep browser storage and JSON files** (status quo).
2. **"Save to Google Drive" button:** files in the user's own Drive, no server of ours.
3. **Neon Postgres queried from the browser through the Data API with row-level security.**
4. **Neon Postgres behind a small API in this repo (Vercel functions), with Neon Auth Google login.**
5. **Supabase or Firebase** (hosted database plus auth with a browser SDK).

## Decision outcome

Chosen option: **4**, because it saves automatically to the cloud (unlike 1 and 2), keeps credentials and authorisation on the server (unlike 3, which Neon itself advises against for new apps because a wrong policy exposes the database), stays on the free plans of Neon and Vercel, and reuses the provider Victor already chose. Option 5 would work equally well technically, but brings a second vendor with no advantage here.

The project row stores the version 1.1 project JSON as-is, so no new data model is introduced.

### Consequences

- Good, because plans are safe in the cloud and follow the user to any computer.
- Good, because Google login means no new password for a non-technical user.
- Good, because the API validates every request (token, allowed email, project shape) in one place.
- Bad, because the project now has a backend: three new dependencies, server code, environment secrets, and a Neon and Google setup that Victor must do.
- Bad, because the app needs a network connection to save to the cloud; the browser copy remains as an offline fallback.
- Bad, because local development of the API needs the Vercel CLI (`vercel dev`) instead of only `npm run dev`.
- This supersedes the "No backend" rule in CLAUDE.md; FDDs now describe the API under 5.5 Persistence.
