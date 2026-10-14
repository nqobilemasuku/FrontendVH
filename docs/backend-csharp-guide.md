# Varsity Hub — C# Backend Implementation Guide

A complete guide for building the Varsity Hub backend in **ASP.NET Core (.NET 8)** on top of the
Supabase Postgres schema in `supabase/migrations/20260724000000_init.sql`.

---

## 0. Architecture

```
 React (TanStack Start)                    ASP.NET Core Web API (.NET 8)
 ─────────────────────                     ───────────────────────────────
  Supabase JS Auth  ──login──►  Supabase Auth (GoTrue)  ─── issues JWT
        │  (JWT)                                  ▲
        └───── Authorization: Bearer <jwt> ──────►│
                                          [JwtBearer validation]
                                                  │
                                          Controllers / Services
                                                  │
                        ┌─────────────────────────┴─────────────────────────┐
                        │  Npgsql + Dapper                                    │
                        │  • AsUser()    → SET ROLE authenticated + claims    │  ◄─ RLS enforced
                        │  • AsService() → stays superuser                    │  ◄─ RLS bypassed
                        └─────────────────────────┬─────────────────────────┘
                                                  ▼
                                     Supabase Postgres (your schema)
                                       + Supabase Storage (files)
```

**Why this shape**
- **Supabase Auth (GoTrue)** owns users/passwords/sessions and mints JWTs. Don't rebuild auth.
- The C# API validates that JWT, then runs SQL **as the caller** so your Row Level Security is a
  second wall even if a controller forgets a check.
- Admin work (OTP issue/verify, sending notifications, webhooks) runs on a **service path** that
  bypasses RLS — the equivalent of Supabase's `service_role`.

---

## 1. Prerequisites & scaffold

```bash
dotnet new webapi -n VarsityHub.Api
cd VarsityHub.Api

# Data access
dotnet add package Npgsql
dotnet add package Dapper

# Schema migrations (runs the .sql you already have)
dotnet add package dbup-postgresql

# Auth (validate Supabase JWT)
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

# Misc
dotnet add package Supabase                 # optional: Storage/Realtime SDK
dotnet add package Swashbuckle.AspNetCore    # Swagger
```

---

## 2. Configuration (`appsettings.json` + user-secrets)

Never commit secrets — use `dotnet user-secrets` locally and env vars in prod.

```jsonc
{
  "Supabase": {
    "Url": "https://<project-ref>.supabase.co",
    "AnonKey": "<anon-key>",              // for the frontend only
    "ServiceRoleKey": "<service-role-key>" // server-side Storage/Admin REST calls
  },
  "ConnectionStrings": {
    // Use the SESSION pooler (port 5432) so SET ROLE / SET LOCAL survive.
    // Connect as a NOINHERIT role that can switch into authenticated/anon (see §3.1).
    "Supabase": "Host=<ref>.pooler.supabase.com;Port=5432;Database=postgres;Username=app_backend;Password=<pwd>;SSL Mode=Require;Trust Server Certificate=true;Pooling=true;Maximum Pool Size=20"
  },
  "Jwt": {
    "Issuer": "https://<project-ref>.supabase.co/auth/v1",
    "Audience": "authenticated"
  },
  "Email": { "Provider": "smtp", "From": "no-reply@varsityhub.co.za" },
  "Payments": { "Provider": "payfast" }
}
```

---

## 3. Apply the database schema

The schema is SQL-first. Two options:

**A. One-off via Supabase (recommended for the initial create)** — paste
`supabase/migrations/20260724000000_init.sql` into the Supabase SQL Editor, or `supabase db push`.
This runs as `postgres`, which is required for the `storage.*` and `auth`-referencing statements.

**B. From C# with DbUp** (good for *subsequent* app-owned migrations). Put `.sql` files under
`Migrations/` as **Embedded Resources**, then run on startup:

```csharp
// Program.cs (before app.Run)
using DbUp;

var cs = builder.Configuration.GetConnectionString("Supabase")!;
var upgrader = DeployChanges.To
    .PostgresqlDatabase(cs)
    .WithScriptsEmbeddedInAssembly(System.Reflection.Assembly.GetExecutingAssembly())
    .WithTransactionPerScript()
    .LogToConsole()
    .Build();

var result = upgrader.PerformUpgrade();
if (!result.Successful) throw new Exception("DB migration failed", result.Error);
```

> DbUp must connect as a role allowed to create policies on `storage.objects` (i.e. `postgres`).
> If you use the least-privilege `app_backend` role for the app, still apply the **initial** schema
> as `postgres`.

### 3.1 Create the least-privilege backend login (run once, as postgres)

Mirrors how Supabase's own `authenticator` role works — no privileges until it `SET ROLE`s.

```sql
create role app_backend login password '<strong-password>' noinherit;
grant anon, authenticated, service_role to app_backend;
```

Your API connects as `app_backend`. By default it inherits nothing; each request explicitly
switches into `authenticated` (RLS on) or does nothing / uses `service_role` for admin (RLS off).

---

## 4. Authentication — validate the Supabase JWT

```csharp
// Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

builder.Services
  .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
      var issuer = builder.Configuration["Jwt:Issuer"]!;
      options.Authority = issuer;                       // discovers JWKS (asymmetric keys)
      options.RequireHttpsMetadata = true;
      options.TokenValidationParameters = new TokenValidationParameters
      {
          ValidateIssuer = true,   ValidIssuer = issuer,
          ValidateAudience = true, ValidAudience = builder.Configuration["Jwt:Audience"],
          ValidateLifetime = true,
          NameClaimType = "sub"
          // Legacy HS256 projects instead set:
          // IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
          // ValidateIssuerSigningKey = true
      };
  });

builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("Admin",       p => p.RequireClaim("user_role", "super_admin"));
    o.AddPolicy("UniAdmin",    p => p.RequireClaim("user_role", "university_admin", "super_admin"));
    o.AddPolicy("Counsellor",  p => p.RequireClaim("user_role", "counsellor", "super_admin"));
});
```

> Put the app role into the JWT so `[Authorize(Policy="Admin")]` works without a DB round-trip.
> In Supabase, add a custom **Access Token Hook** (Auth → Hooks) that copies `profiles.role` into a
> `user_role` claim. Otherwise read the role from `profiles` in a middleware.

---

## 5. RLS-aware data access

The core of the design: a factory that opens a connection, and for user requests forwards the JWT
claims + switches to the `authenticated` role inside a transaction so `auth.uid()` resolves.

```csharp
using System.Data;
using System.Text.Json;
using Npgsql;

public interface IUserContext { string? UserId { get; } string? Email { get; } }

public sealed class SupabaseDb(IConfiguration cfg)
{
    private readonly string _cs = cfg.GetConnectionString("Supabase")!;

    /// Run as the authenticated caller — RLS policies apply.
    public async Task<T> AsUserAsync<T>(string userId, string? email,
        Func<NpgsqlConnection, IDbTransaction, Task<T>> work)
    {
        await using var conn = new NpgsqlConnection(_cs);
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        // Build the claims blob that auth.uid()/auth.role() read from.
        var claims = JsonSerializer.Serialize(new Dictionary<string, string?>
        {
            ["sub"]  = userId,
            ["role"] = "authenticated",
            ["email"]= email
        });

        await using (var cmd = new NpgsqlCommand(
            "select set_config('request.jwt.claims', @c, true); set local role authenticated;", conn, tx))
        {
            cmd.Parameters.AddWithValue("c", claims);
            await cmd.ExecuteNonQueryAsync();
        }

        var result = await work(conn, tx);
        await tx.CommitAsync();
        return result;
    }

    /// Run with full privileges — RLS bypassed. Use for OTP, notifications, webhooks, admin jobs.
    public async Task<T> AsServiceAsync<T>(Func<NpgsqlConnection, IDbTransaction, Task<T>> work)
    {
        await using var conn = new NpgsqlConnection(_cs);
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();
        var result = await work(conn, tx);
        await tx.CommitAsync();
        return result;
    }
}
```

Register it and a per-request user context:

```csharp
builder.Services.AddSingleton<SupabaseDb>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContext>(sp =>
{
    var u = sp.GetRequiredService<IHttpContextAccessor>().HttpContext?.User;
    return new UserContext(u?.FindFirst("sub")?.Value, u?.FindFirst("email")?.Value);
});
public sealed record UserContext(string? UserId, string? Email) : IUserContext;
```

---

## 6. Example module — Universities & Applications

### 6.1 DTOs / models

```csharp
public record University(Guid Id, string Name, string ShortCode, string Province,
    int? MinAps, decimal? TuitionFrom, int ProgrammesCount, int FacultiesCount);

public record NewApplication(Guid ProgrammeId, Guid UniversityId);
```

### 6.2 Repository (Dapper)

```csharp
public sealed class UniversityRepo(SupabaseDb db, IUserContext me)
{
    // Public catalog — RLS allows anon/authenticated read.
    public Task<IEnumerable<University>> SearchAsync(string? q, string? province) =>
        db.AsUserAsync(me.UserId ?? "", me.Email, async (c, tx) =>
            await c.QueryAsync<University>(new CommandDefinition("""
                select id, name, short_code as ShortCode, province,
                       min_aps as MinAps, tuition_from as TuitionFrom,
                       programmes_count as ProgrammesCount, faculties_count as FacultiesCount
                from public.universities
                where (@q is null or name ilike '%' || @q || '%')
                  and (@province is null or @province = 'All' or province = @province)
                order by name
            """, new { q, province }, tx)));
}

public sealed class ApplicationRepo(SupabaseDb db, IUserContext me)
{
    public Task<Guid> CreateAsync(NewApplication a) =>
        db.AsUserAsync(me.UserId!, me.Email, async (c, tx) =>
        {
            // Fee gate: student must have a PAID application-fee payment.
            var paid = await c.ExecuteScalarAsync<bool>(new CommandDefinition("""
                select exists(select 1 from public.payments
                              where student_id = auth.uid() and status = 'paid')
            """, transaction: tx));
            if (!paid) throw new InvalidOperationException("Application fee not paid.");

            // INSERT: RLS "applications: student create" ensures student_id = auth.uid().
            return await c.ExecuteScalarAsync<Guid>(new CommandDefinition("""
                insert into public.applications (student_id, university_id, programme_id, status, aps_at_apply)
                values (auth.uid(), @UniversityId, @ProgrammeId, 'submitted',
                        (select aps from public.student_aps where student_id = auth.uid()))
                returning id
            """, a, tx));
        });
}
```

### 6.3 Controller

```csharp
[ApiController, Route("api/[controller]")]
public sealed class UniversitiesController(UniversityRepo repo) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] string? province)
        => Ok(await repo.SearchAsync(q, province));
}

[ApiController, Route("api/[controller]"), Authorize]
public sealed class ApplicationsController(ApplicationRepo repo) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] NewApplication body)
    {
        try { return Ok(new { id = await repo.CreateAsync(body) }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }
}
```

---

## 7. OTP flow (registration verification)

Matches the app's `/register-verify` screen. Runs on the **service path** (RLS-bypass) because it
writes to `otp_verifications` and updates verification flags.

```csharp
public sealed class OtpService(SupabaseDb db, IEmailSender email, ISmsSender sms)
{
    public async Task IssueAsync(Guid userId, string destination, string channel /*email|sms*/)
    {
        var code = Random.Shared.Next(0, 1_000_000).ToString("D6");
        var hash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(code + userId)));

        await db.AsServiceAsync(async (c, tx) =>
        {
            await c.ExecuteAsync(new CommandDefinition("""
                insert into public.otp_verifications
                    (user_id, channel, purpose, destination, code_hash, expires_at)
                values (@userId, @channel::otp_channel, 'registration', @destination, @hash, now() + interval '10 minutes')
            """, new { userId, channel, destination, hash }, tx));
            return 0;
        });

        var body = $"Your Varsity Hub verification code is {code}. It expires in 10 minutes.";
        if (channel == "sms") await sms.SendAsync(destination, body);
        else                  await email.SendAsync(destination, "Verify your account", body);
    }

    public async Task<bool> VerifyAsync(Guid userId, string code)
    {
        var hash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(code + userId)));

        return await db.AsServiceAsync(async (c, tx) =>
        {
            var id = await c.ExecuteScalarAsync<Guid?>(new CommandDefinition("""
                select id from public.otp_verifications
                where user_id = @userId and consumed_at is null and expires_at > now()
                order by created_at desc limit 1
            """, new { userId }, tx));

            if (id is null) return false;

            var ok = await c.ExecuteScalarAsync<bool>(new CommandDefinition("""
                update public.otp_verifications
                set attempts = attempts + 1,
                    consumed_at = case when code_hash = @hash then now() else consumed_at end
                where id = @id
                returning code_hash = @hash
            """, new { id, hash }, tx));

            if (ok)
                await c.ExecuteAsync(new CommandDefinition(
                    "update public.profiles set email_verified = true where id = @userId",
                    new { userId }, tx));
            return ok;
        });
    }
}
```

> **Alternative:** Supabase Auth (GoTrue) has built-in email/phone OTP (`signInWithOtp`). If you use
> it, you can drop the custom `otp_verifications` table. The above keeps your existing UI/flow.

---

## 8. Payments (application fee)

1. `POST /api/payments/application-fee` → create a `payments` row (`status = 'pending'`) as the user,
   call your gateway (PayFast/Stripe/Yoco), return the redirect/checkout URL.
2. Gateway redirects the user to pay.
3. **Webhook** `POST /api/payments/webhook` (AllowAnonymous, verify signature) → on success run
   `db.AsServiceAsync` to set `status = 'paid', paid_at = now()`.
4. The application `CreateAsync` (§6.2) only succeeds once a paid payment exists.

```csharp
[HttpPost("webhook"), AllowAnonymous]
public async Task<IActionResult> Webhook()
{
    // 1) verify provider signature (reject if invalid)
    // 2) mark the payment paid via service role
    await db.AsServiceAsync(async (c, tx) =>
        await c.ExecuteAsync(new CommandDefinition(
            "update public.payments set status='paid', paid_at=now() where reference=@ref",
            new { @ref = providerReference }, tx)));
    return Ok();
}
```

---

## 9. Notifications

Insert via the **service path** (the RLS policy only lets clients insert as super_admin):

```csharp
public Task NotifyAsync(Guid userId, string category, string title, string? body, string? url) =>
    db.AsServiceAsync(async (c, tx) =>
    {
        await c.ExecuteAsync(new CommandDefinition("""
            insert into public.notifications (user_id, category, title, body, action_url)
            values (@userId, @category::notification_category, @title, @body, @url)
        """, new { userId, category, title, body, url }, tx));
        return 0;
    });
```

Call it from your domain events (application approved, bursary deadline, new marketplace message…).
For live delivery to the browser, enable **Supabase Realtime** on the `notifications` table and
subscribe from the React app — no backend push needed.

---

## 10. File storage (documents, CVs, listing images, avatars)

Files live in Supabase Storage buckets created by the migration (`documents` private,
`avatars`/`listings` public). Two options:

- **Signed upload URLs (recommended):** backend asks Supabase Storage for a signed URL using the
  service-role key, returns it to the client, client uploads directly. Then record metadata:
  `insert into documents(student_id, type, name, storage_path, size_bytes) values (auth.uid(), …)`.
- **Proxy upload:** client posts the file to your API; API streams it to Storage via the Storage
  REST API (`POST /storage/v1/object/documents/<uid>/<file>`) with the service-role bearer token.

Path convention required by the storage RLS policies: **`<user-uuid>/<filename>`**.

---

## 11. REST surface (map to the schema)

| Area | Endpoints |
|---|---|
| Auth/OTP | `POST /api/auth/register` (calls GoTrue admin create → issues OTP), `POST /api/auth/otp/verify`, `POST /api/auth/otp/resend` |
| Profile | `GET/PATCH /api/me`, `GET/PATCH /api/me/settings` |
| Universities | `GET /api/universities`, `GET /api/universities/{id}`, `POST/DELETE /api/universities/{id}/favourite` |
| Programmes | `GET /api/programmes?universityId=&faculty=&minAps=` |
| Results/APS | `GET/PUT /api/me/results`, `GET /api/me/aps` |
| Applications | `GET/POST /api/applications`, `PATCH /api/applications/{id}`, `POST /api/applications/{id}/documents` |
| Payments | `POST /api/payments/application-fee`, `POST /api/payments/webhook` |
| Documents | `POST /api/documents/upload-url`, `GET /api/documents` |
| Bursaries | `GET /api/bursaries`, `POST /api/bursaries/{id}/apply`, `POST/DELETE /api/bursaries/{id}/bookmark` |
| Jobs | `GET /api/jobs`, `POST /api/jobs/{id}/apply`, `POST/DELETE /api/jobs/{id}/save` |
| Marketplace | `GET/POST /api/listings`, `POST /api/listings/{id}/wishlist`, `GET/POST /api/listings/{id}/messages`, `POST /api/listings/{id}/rate` |
| Events | `GET /api/events`, `POST/DELETE /api/events/{id}/register` |
| Accommodation | `GET /api/accommodations`, `POST/DELETE /api/accommodations/{id}/favourite` |
| Interview | `POST /api/interview/sessions`, `POST /api/interview/sessions/{id}/feedback` |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/{id}/read` |
| Admin (super) | `/api/admin/*` — users, universities CRUD, aps-rules, audit logs |
| Uni-admin | `/api/uni-admin/applications` (read + status update for their university) |

---

## 12. Suggested project structure

```
VarsityHub.Api/
  Program.cs
  Auth/            JwtBearer setup, UserContext, policies
  Data/            SupabaseDb, repositories (Dapper)
  Modules/
    Universities/  Controller + Repo + DTOs
    Applications/
    Bursaries/
    Jobs/
    Marketplace/
    ...
  Services/        OtpService, PaymentService, NotificationService, StorageService
  Migrations/      *.sql (embedded)  — for post-launch changes
  appsettings.json
```

---

## 13. Deployment

- Host anywhere (Azure App Service, Fly.io, Render, container). Set config via env vars:
  `ConnectionStrings__Supabase`, `Supabase__ServiceRoleKey`, `Jwt__Issuer`, provider keys.
- Use the Supabase **connection pooler** (session mode, port 5432) so `SET ROLE`/`SET LOCAL` work;
  cap `Maximum Pool Size` to stay under your Supabase connection limit.
- Run schema migrations as part of your release pipeline (Supabase CLI or DbUp).
- Enable CORS for your frontend origin only.

---

## 14. Security checklist

- [ ] Backend connects as `app_backend` (NOINHERIT), **never** as `postgres` in production traffic.
- [ ] `AsUserAsync` is used for all end-user data; `AsServiceAsync` only for OTP, notifications, webhooks, admin.
- [ ] JWT validated against Supabase issuer/audience; short access-token lifetime.
- [ ] Service-role key kept server-side only — never shipped to the React app.
- [ ] OTP codes stored as hashes, expiring, attempt-limited.
- [ ] Payment webhooks verify the provider signature before trusting them.
- [ ] Storage paths always prefixed with the owner's UID (RLS depends on it).
- [ ] RLS left **enabled** on every table — the C# checks are a convenience, RLS is the guarantee.

---
---

# Part II — Everything else the backend must have

Part I covers the plumbing and security model. This part covers the domain features your
requirements document calls out (AI, eligibility, reminders) and the production cross-cutting
concerns (validation, errors, paging, rate limiting, logging, health, audit, tests) — the pieces a
real deployment can't ship without.

## 15. Complete package & service inventory

Add these on top of the Part I packages:

```bash
# Validation, logging, mapping
dotnet add package FluentValidation.AspNetCore
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console

# Resilience (retry/timeout for outbound HTTP: Supabase Storage, Claude, email/SMS)
dotnet add package Microsoft.Extensions.Http.Resilience

# Health checks (DB probe)
dotnet add package AspNetCore.HealthChecks.Npgsql

# Email / SMS providers (pick per vendor)
dotnet add package SendGrid            # transactional email
dotnet add package Twilio              # SMS OTP

# Rate limiting is built in (Microsoft.AspNetCore.RateLimiting, .NET 7+ — no package)
# Background jobs use IHostedService / BackgroundService (built in). Hangfire optional:
# dotnet add package Hangfire.AspNetCore && dotnet add package Hangfire.PostgreSql
```

| Concern | What provides it | Section |
|---|---|---|
| Identity | Supabase GoTrue (Admin API for signup) | §16 |
| Email / SMS (OTP, notifications) | SendGrid + Twilio | §17 |
| APS eligibility matching | SQL + repo | §18 |
| AI (recs, matching, interview, CV) | Claude API via `HttpClient` | §19 |
| Deadline reminders | `BackgroundService` (or Hangfire) | §20 |
| Input validation | FluentValidation | §21 |
| Error responses | ProblemDetails middleware | §22 |
| Pagination | shared `PagedResult<T>` + query params | §23 |
| Abuse / cost control | ASP.NET rate limiter | §24 |
| Browser access | CORS policy | §25 |
| Logging | Serilog | §26 |
| Liveness/readiness | Health checks | §27 |
| Audit trail | `audit_logs` writer | §28 |
| Tests | xUnit + Testcontainers | §29 |

---

## 16. Registration via the Supabase GoTrue Admin API

Your `/register` UI collects details, then verifies via OTP. The backend creates the auth user
**server-side** with the service-role key, stashing `role`/`full_name`/`phone` in `user_metadata`
so the `handle_new_user` trigger (§17b in Part I) picks them up.

```csharp
public sealed class AuthService(IHttpClientFactory http, IConfiguration cfg, OtpService otp)
{
    private readonly string _url = cfg["Supabase:Url"]!;
    private readonly string _serviceKey = cfg["Supabase:ServiceRoleKey"]!;

    public async Task<Guid> RegisterAsync(RegisterRequest r)
    {
        var client = http.CreateClient();
        client.DefaultRequestHeaders.Add("apikey", _serviceKey);
        client.DefaultRequestHeaders.Authorization = new("Bearer", _serviceKey);

        // GoTrue admin create-user; email_confirm=false so we run our own OTP step
        var body = new
        {
            email = r.Email,
            password = r.Password,
            email_confirm = false,
            user_metadata = new { role = "student", full_name = r.FullName, phone = r.Phone }
        };
        var resp = await client.PostAsJsonAsync($"{_url}/auth/v1/admin/users", body);
        resp.EnsureSuccessStatusCode();
        var created = await resp.Content.ReadFromJsonAsync<GoTrueUser>();

        // Fire the OTP (email or SMS) — see §17
        await otp.IssueAsync(created!.Id, r.Channel == "sms" ? r.Phone! : r.Email, r.Channel);
        return created.Id;
    }
}

public record RegisterRequest(string FullName, string Email, string? Phone, string Password, string Channel);
public record GoTrueUser(Guid Id, string Email);
```

> The frontend still logs in through Supabase Auth (GoTrue) to obtain a JWT after verification —
> the backend only *creates* and *verifies*. Alternatively, use GoTrue's native `signInWithOtp`
> and skip the custom OTP table entirely.

---

## 17. Email & SMS providers

The `IEmailSender` / `ISmsSender` interfaces from Part I §7, implemented:

```csharp
public interface IEmailSender { Task SendAsync(string to, string subject, string body); }
public interface ISmsSender   { Task SendAsync(string to, string body); }

public sealed class SendGridEmail(IConfiguration cfg) : IEmailSender
{
    public async Task SendAsync(string to, string subject, string body)
    {
        var client = new SendGrid.SendGridClient(cfg["Email:SendGridKey"]);
        var msg = SendGrid.Helpers.Mail.MailHelper.CreateSingleEmail(
            new(cfg["Email:From"], "Varsity Hub"), new(to), subject, body, body);
        var resp = await client.SendEmailAsync(msg);
        if ((int)resp.StatusCode >= 400) throw new InvalidOperationException("Email send failed");
    }
}

public sealed class TwilioSms(IConfiguration cfg) : ISmsSender
{
    public Task SendAsync(string to, string body)
    {
        Twilio.TwilioClient.Init(cfg["Sms:TwilioSid"], cfg["Sms:TwilioToken"]);
        return Twilio.Rest.Api.V2010.Account.MessageResource.CreateAsync(
            to: new Twilio.Types.PhoneNumber(to),
            from: new Twilio.Types.PhoneNumber(cfg["Sms:TwilioFrom"]),
            body: body);
    }
}
```

Register: `builder.Services.AddScoped<IEmailSender, SendGridEmail>();` and the SMS equivalent.

---

## 18. APS eligibility matching

The core "System calculates APS → eligible courses displayed" flow. It joins the student's
`student_aps` (view) and per-subject levels against each programme's `min_aps` and
`programme_requirements`.

```csharp
public sealed class EligibilityRepo(SupabaseDb db, IUserContext me)
{
    public Task<IEnumerable<Programme>> EligibleProgrammesAsync() =>
        db.AsUserAsync(me.UserId!, me.Email, async (c, tx) =>
            await c.QueryAsync<Programme>(new CommandDefinition("""
                with my as (
                  select coalesce((select aps from public.student_aps where student_id = auth.uid()), 0) as aps
                )
                select p.id, p.name, p.min_aps as MinAps, u.name as University, u.short_code as ShortCode
                from public.programmes p
                join public.universities u on u.id = p.university_id
                cross join my
                where p.is_active
                  and my.aps >= p.min_aps
                  -- every subject requirement met by the student's captured levels
                  and not exists (
                    select 1 from public.programme_requirements r
                    where r.programme_id = p.id
                      and not exists (
                        select 1 from public.student_results sr
                        where sr.student_id = auth.uid()
                          and sr.subject_name = r.subject_name
                          and sr.level >= r.min_level))
                order by p.min_aps desc
            """, transaction: tx)));
}
public record Programme(Guid Id, string Name, int MinAps, string University, string ShortCode);
```

Expose as `GET /api/me/eligible-programmes`. This is pure SQL — no AI needed, and it's the
authoritative eligibility source. The AI layer (§19) *ranks/recommends* on top of it.

---

## 19. AI services (Claude API)

Powers the requirements' **AI job recommendations**, **AI bursary matching**, **interview feedback**,
and **CV parsing**. Calls `POST /v1/messages` directly with `HttpClient` — robust and
version-independent. (The official `Anthropic` NuGet SDK is an alternative; check its repo for exact
bindings before using it.)

**Model:** default `claude-opus-4-8` (most capable). For high-volume/latency-sensitive calls you may
switch to `claude-sonnet-5` (cheaper/faster) or `claude-haiku-4-5` — that's your cost decision.

```csharp
public sealed class ClaudeClient(IHttpClientFactory http, IConfiguration cfg)
{
    private const string Model = "claude-opus-4-8";

    public async Task<string> CompleteAsync(string system, string userPrompt, int maxTokens = 2048)
    {
        var client = http.CreateClient("claude");
        client.DefaultRequestHeaders.Add("x-api-key", cfg["Claude:ApiKey"]);
        client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var body = new
        {
            model = Model,
            max_tokens = maxTokens,
            system,
            messages = new[] { new { role = "user", content = userPrompt } }
        };
        var resp = await client.PostAsJsonAsync("https://api.anthropic.com/v1/messages", body);
        resp.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStreamAsync());
        // response.content[0].text
        return doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
    }
}
```

Register a named client with retry (transient 429/5xx):

```csharp
builder.Services.AddHttpClient("claude").AddStandardResilienceHandler();
builder.Services.AddScoped<ClaudeClient>();
```

### 19a. Job recommendations & bursary matching

Feed the student's profile + candidate rows, ask Claude to rank and return JSON:

```csharp
public sealed class RecommendationService(ClaudeClient claude, SupabaseDb db, IUserContext me)
{
    public async Task<List<RankedJob>> RecommendJobsAsync()
    {
        // 1. Pull student profile + APS + open jobs (as the user; RLS applies)
        var (profileJson, jobsJson) = await db.AsUserAsync(me.UserId!, me.Email, async (c, tx) =>
        {
            var profile = await c.QueryFirstAsync<string>(new CommandDefinition("""
                select coalesce(json_build_object(
                  'aps', (select aps from public.student_aps where student_id = auth.uid()),
                  'subjects', (select json_agg(subject_name) from public.student_results where student_id = auth.uid())
                )::text, '{}')
            """, transaction: tx));
            var jobs = await c.QueryFirstAsync<string>(new CommandDefinition("""
                select coalesce(json_agg(json_build_object(
                  'id', id, 'title', title, 'company', company, 'type', type, 'tags', tags))::text, '[]')
                from public.jobs where is_active limit 50
            """, transaction: tx));
            return (profile, jobs);
        });

        // 2. Ask Claude to rank
        var system = "You are a career-matching assistant for South African students. " +
                     "Return ONLY a JSON array of {id, matchScore (0-100), reason}, best first, max 10.";
        var prompt = $"Student profile:\n{profileJson}\n\nAvailable jobs:\n{jobsJson}";
        var json = await claude.CompleteAsync(system, prompt);

        return JsonSerializer.Deserialize<List<RankedJob>>(json) ?? new();
    }
}
public record RankedJob(Guid Id, int MatchScore, string Reason);
```

Bursary matching is the identical shape against `bursaries` + the student's APS/field. Persist the
scores if you want them queryable, or return them live.

### 19b. Interview feedback

```csharp
public Task<string> ScoreAnswerAsync(string question, string answer) =>
    claude.CompleteAsync(
        system: "You are an interview coach. Given a question and a candidate answer, return JSON " +
                "{clarity, confidence, relevance, structure (each 0-100), strengths[], improvements[]}.",
        userPrompt: $"Question: {question}\n\nAnswer: {answer}");
```

Store the result in `interview_feedback` (Part I schema) via `AsUserAsync`.

### 19c. CV parsing (for job matching)

Download the uploaded CV text from Storage, then:

```csharp
public Task<string> ParseCvAsync(string cvText) =>
    claude.CompleteAsync(
        system: "Extract from this CV as JSON: {skills[], qualifications[], yearsExperience, fields[]}.",
        userPrompt: cvText, maxTokens: 1024);
```

> For richer control you can use Claude's **structured outputs** (`output_config.format` with a JSON
> schema) instead of asking for JSON in the prompt — more reliable parsing. Keep prompts small; cache
> is per-request here.

---

## 20. Scheduled deadline reminders

"Funding reminders" and application-deadline reminders. A hosted `BackgroundService` runs daily,
finds bursaries/applications closing soon, and inserts notifications (service path → RLS bypassed).

```csharp
public sealed class DeadlineReminderService(IServiceProvider sp, ILogger<DeadlineReminderService> log)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SupabaseDb>();

                await db.AsServiceAsync(async (c, tx) =>
                {
                    // Notify students who bookmarked a bursary closing in 3 days and haven't been told
                    await c.ExecuteAsync(new CommandDefinition("""
                        insert into public.notifications (user_id, category, title, body, action_url)
                        select bb.student_id, 'bursary',
                               'Bursary deadline in 3 days',
                               b.name || ' closes on ' || to_char(b.closes_on, 'DD Mon YYYY'),
                               '/bursaries'
                        from public.bursary_bookmarks bb
                        join public.bursaries b on b.id = bb.bursary_id
                        where b.closes_on = current_date + 3
                    """, transaction: tx));
                    return 0;
                });
            }
            catch (Exception ex) { log.LogError(ex, "Reminder sweep failed"); }

            await Task.Delay(TimeSpan.FromHours(24), ct);
        }
    }
}
```

Register: `builder.Services.AddHostedService<DeadlineReminderService>();`

> For horizontal scaling (multiple API instances), a naïve `BackgroundService` runs on *every*
> instance → duplicate notifications. Either run reminders in a single-instance worker, add a
> Postgres advisory lock around the sweep, or use **Hangfire** with its Postgres store (which
> dedupes recurring jobs cluster-wide).

---

## 21. Input validation (FluentValidation)

```csharp
public sealed class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).MinimumLength(8);
        RuleFor(x => x.Channel).Must(c => c is "email" or "sms");
        RuleFor(x => x.Phone).NotEmpty().When(x => x.Channel == "sms");
    }
}
```

Register: `builder.Services.AddValidatorsFromAssemblyContaining<RegisterValidator>();` and add a
filter/middleware that returns 400 + ProblemDetails on failure (or call `Validate` in the endpoint).

---

## 22. Global error handling (ProblemDetails)

```csharp
builder.Services.AddProblemDetails();

// Program.cs — one place turns exceptions into RFC-7807 responses
app.UseExceptionHandler(a => a.Run(async ctx =>
{
    var ex = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, title) = ex switch
    {
        InvalidOperationException => (StatusCodes.Status409Conflict, ex.Message),
        UnauthorizedAccessException => (StatusCodes.Status403Forbidden, "Forbidden"),
        _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
    };
    ctx.Response.StatusCode = status;
    await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title });
}));
```

Never leak Npgsql/stack details to the client — log them (§26), return a generic 500.

---

## 23. Pagination, filtering, sorting

List endpoints must page or they'll return whole tables. A shared shape + keyset/offset paging:

```csharp
public record PageQuery(int Page = 1, int PageSize = 20, string? Sort = null);
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, long Total);

// In a repo:
public Task<PagedResult<University>> SearchAsync(string? q, string? province, PageQuery pg) =>
    db.AsUserAsync(me.UserId ?? "", me.Email, async (c, tx) =>
    {
        var offset = (Math.Max(1, pg.Page) - 1) * pg.PageSize;
        var rows = (await c.QueryAsync<University>(new CommandDefinition("""
            select id, name, short_code as ShortCode, province, min_aps as MinAps, tuition_from as TuitionFrom,
                   programmes_count as ProgrammesCount, faculties_count as FacultiesCount
            from public.universities
            where (@q is null or name ilike '%' || @q || '%')
              and (@province is null or @province = 'All' or province = @province)
            order by name
            limit @PageSize offset @offset
        """, new { q, province, pg.PageSize, offset }, tx))).ToList();
        var total = await c.ExecuteScalarAsync<long>(new CommandDefinition("""
            select count(*) from public.universities
            where (@q is null or name ilike '%' || @q || '%')
              and (@province is null or @province = 'All' or province = @province)
        """, new { q, province }, tx));
        return new PagedResult<University>(rows, pg.Page, pg.PageSize, total);
    });
```

Cap `PageSize` (e.g. `Math.Min(pg.PageSize, 100)`) so a client can't request a million rows.

---

## 24. Rate limiting (built-in, .NET 8)

Critical for the OTP endpoints (SMS costs money; brute force). Use the built-in limiter:

```csharp
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    // Tight bucket for OTP issue/verify, keyed by IP
    o.AddPolicy("otp", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(15) }));
    // General API bucket
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            ctx.User.FindFirst("sub")?.Value ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 120, Window = TimeSpan.FromMinutes(1) }));
});
app.UseRateLimiter();
// then: app.MapPost("/api/auth/otp/verify", ...).RequireRateLimiting("otp");
```

Also enforce per-user OTP attempt limits in the DB (`otp_verifications.attempts`, Part I).

---

## 25. CORS

```csharp
builder.Services.AddCors(o => o.AddPolicy("frontend", p => p
    .WithOrigins(builder.Configuration["Cors:Origins"]!.Split(','))  // e.g. https://app.varsityhub.co.za
    .AllowAnyHeader()
    .AllowAnyMethod()));
app.UseCors("frontend");
```

Lock to your real frontend origin(s) — never `AllowAnyOrigin()` with credentials.

---

## 26. Logging (Serilog)

```csharp
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());
app.UseSerilogRequestLogging();   // one structured log line per request
```

Never log JWTs, the service-role key, OTP codes, or payment card data.

---

## 27. Health checks

```csharp
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Supabase")!, name: "db");
app.MapHealthChecks("/health");        // liveness
app.MapHealthChecks("/health/ready");  // wire readiness deps as needed
```

---

## 28. Audit logging

Write to `audit_logs` (Part I) on sensitive actions — application status changes, payments, admin
edits, role changes. Do it on the service path so it can't be blocked by RLS:

```csharp
public Task AuditAsync(SupabaseDb db, Guid? actor, string action, string entityType, Guid entityId, object? meta = null) =>
    db.AsServiceAsync(async (c, tx) =>
    {
        await c.ExecuteAsync(new CommandDefinition("""
            insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
            values (@actor, @action, @entityType, @entityId, @meta::jsonb)
        """, new { actor, action, entityType, entityId, meta = JsonSerializer.Serialize(meta ?? new{}) }, tx));
        return 0;
    });
```

Call it from a university admin approving an application, the payment webhook, admin user edits, etc.

---

## 29. Testing

Integration tests are the high-value ones here because the security lives in RLS. Use
**Testcontainers** to spin up a real Postgres, apply the schema, and assert that a student *cannot*
read another student's data.

```csharp
// Sketch — xUnit + Testcontainers.PostgreSql
[Fact]
public async Task Student_cannot_read_another_students_applications()
{
    await using var pg = new PostgreSqlBuilder().Build();
    await pg.StartAsync();
    await ApplySchema(pg.GetConnectionString());          // run the .sql (stub auth.* schema)
    // seed two students + an application, then query AsUser(studentB) and assert 0 rows
}
```

Unit-test the pure logic too: `aps_points`, eligibility SQL, OTP hash/verify, recommendation JSON
parsing. Mock `ClaudeClient` so AI tests don't hit the network.

---

## 30. Full `Program.cs` (wiring it together)

```csharp
var builder = WebApplication.CreateBuilder(args);

// Logging
builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration).WriteTo.Console());

// Core
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddHttpContextAccessor();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Auth (Part I §4)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(/* … */);
builder.Services.AddAuthorization(/* Admin/UniAdmin/Counsellor policies */);

// Data + domain services
builder.Services.AddSingleton<SupabaseDb>();
builder.Services.AddScoped<IUserContext>(/* … */);
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<OtpService>();
builder.Services.AddScoped<RecommendationService>();
builder.Services.AddScoped<EligibilityRepo>();
builder.Services.AddScoped<ClaudeClient>();
builder.Services.AddScoped<IEmailSender, SendGridEmail>();
builder.Services.AddScoped<ISmsSender, TwilioSms>();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterValidator>();

// Outbound HTTP with resilience
builder.Services.AddHttpClient("claude").AddStandardResilienceHandler();
builder.Services.AddHttpClient();

// Cross-cutting
builder.Services.AddCors(/* frontend policy */);
builder.Services.AddRateLimiter(/* otp + global */);
builder.Services.AddHealthChecks().AddNpgSql(builder.Configuration.GetConnectionString("Supabase")!);
builder.Services.AddHostedService<DeadlineReminderService>();

var app = builder.Build();

app.UseExceptionHandler(/* ProblemDetails */);
app.UseSerilogRequestLogging();
app.UseCors("frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

app.Run();
```

---

## 31. Complete environment / configuration reference

Everything the backend reads (env vars in prod, user-secrets locally):

| Key | Purpose |
|---|---|
| `ConnectionStrings__Supabase` | Postgres (session pooler, `app_backend` role) |
| `Supabase__Url` | `https://<ref>.supabase.co` |
| `Supabase__ServiceRoleKey` | Server-side admin (GoTrue create-user, notifications, Storage) — **secret** |
| `Jwt__Issuer` / `Jwt__Audience` | Validate Supabase JWTs |
| `Claude__ApiKey` | Anthropic API key for AI features — **secret** |
| `Email__SendGridKey` / `Email__From` | Transactional email |
| `Sms__TwilioSid` / `Sms__TwilioToken` / `Sms__TwilioFrom` | OTP SMS — **secret** |
| `Payments__*` | Gateway keys + webhook signing secret — **secret** |
| `Cors__Origins` | Comma-separated allowed frontend origins |

---

## What's now covered

Part I (plumbing + RLS-safe data access, auth, OTP, payments, storage, endpoint map) **plus** Part II
(GoTrue registration, email/SMS, APS eligibility, the full AI feature set, scheduled reminders,
validation, error handling, pagination, rate limiting, CORS, logging, health checks, audit logging,
tests, the assembled `Program.cs`, and the complete config reference). That's the full set a
production backend for this system needs — build the modules against it in the order that unblocks
your frontend.
```
