# Live API test findings (2026-09-28)

End-to-end tests were run against the deployed API
(`https://varsityhubapi-production.up.railway.app`) with real accounts and data.

## ✅ Verified working
- Auth: `POST /api/Auth/register` + `POST /api/Auth/login` (token issued immediately).
- Student reads: `me`, `me/summary`, `me/recommendations`, `me/results`, `me/aps`,
  `me/payments`, jobs (+`mine`/`saved`/`recommended`/`{id}`), bursaries
  (+`mine`/`bookmarked`/`{id}`), documents, notifications + `unread-count`,
  conversations, listings, fee status, interview sessions.
- Mutations: document upload-url + create, job save/apply (CV required — apply
  **without** a `cvDocumentId` correctly returns **400**), bursary bookmark/apply,
  accommodation favourite, create listing (correct lowercase enums → 201),
  notifications `read-all`, interview session create, `PUT me/results`.
- All `admin/*`, `uni-admin/*`, `employer/*` endpoints exist and are role-guarded
  (a student token gets **403**, not 404).

### Fixed in the latest backend deploy (were failing before)
- `GET /api/lookups/provinces` → **200** (all 9 provinces).
- `GET /api/careers` + `/api/careers/{id}` → **200** (12 careers).
- `GET /api/Accommodations/{id}` → **200**.
- `POST /api/listings/{id}/images` (multipart `file`) → **200**.
- Invalid listing enum now returns **400** with a validation message (was 500).
- SA ID is now validated (13 digits + **Luhn checksum**). The frontend register
  form now mirrors this (length + Luhn + ID↔DOB) and surfaces server `IdNumber`
  errors from a 400.

## ❌ Outstanding backend action

### Interview AI feedback is broken
`POST /api/interview/sessions/{id}/feedback` returns **`503 "AI feedback is
temporarily unavailable."`** (previously `409 "Claude:ApiKey is not configured"`).

- **Cause:** the server's Claude API key is not configured / the AI call is failing.
- **Fix:** set the Claude API key in the Railway environment for the API service
  (e.g. `Claude__ApiKey` / `ANTHROPIC_API_KEY`, per the backend's config binding),
  then redeploy.
- **Frontend status:** correctly wired to `POST /api/interview/sessions` and
  `.../feedback`; it shows "Couldn't get feedback" until the key is set. No
  frontend change needed — this is the last item blocking PDF issue #5.
