-- Atrium Supabase schema (PRD v8 Section 9, Data Model).
-- Run against a Supabase Postgres project (SQL Editor, or `supabase db push`
-- once a Supabase CLI project is linked -- not yet linked as of Sprint 4).
--
-- Supabase is the single source of truth for leads, targets, runs, and
-- artifacts across the funnel, console, crew, and engine (PRD v8 Section 9,
-- "System shape"). The crew and engine additionally keep file-based,
-- auditable, re-runnable state in their own workspace directories --
-- this schema is the shared read/write surface, not a replacement for that.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- leads: one row per lead, inbound or outbound, at any stage.
-- ---------------------------------------------------------------------------
create table if not exists leads (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    source text not null check (source in ('inbound', 'list-import', 'google-places', 'serp', 'claude-web')),
    source_detail text,

    company text not null,
    company_url text,
    contact_name text,
    contact_email text,
    email_status text not null default 'not-found' check (email_status in ('valid', 'risky', 'invalid', 'not-found')),

    role text,
    challenge text,
    timeline text,
    budget_band text,

    stage text not null default 'sourced' check (
        stage in ('sourced', 'new', 'researched', 'qualified', 'review', 'contacted', 'prepped', 'consulted', 'proposal', 'won', 'lost')
    ),

    fit_score numeric,
    admitted boolean not null default false,

    prospect_score numeric,
    grade text check (grade in ('A+', 'A', 'B', 'C', 'D')),
    category_scores jsonb,
    qualification text,

    review_state text not null default 'pending' check (review_state in ('pending', 'approved', 'edited', 'rejected', 'held')),

    icp_profile_id text,
    tenant_id text not null default 'altolumo',

    dedupe_key text not null unique,

    booking_id text,
    scheduled_at timestamptz
);

create index if not exists leads_stage_idx on leads (stage);
create index if not exists leads_tenant_idx on leads (tenant_id);
create index if not exists leads_source_idx on leads (source);

-- ---------------------------------------------------------------------------
-- lead_signals: buying signals attached to a lead (Meta Ad Library, Google
-- Ads Transparency, hiring -- PRD v8 Section 9's LeadSignal, Sprint 6+).
-- ---------------------------------------------------------------------------
create table if not exists lead_signals (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references leads (id) on delete cascade,
    kind text not null check (kind in ('meta-ads', 'google-ads', 'hiring')),
    value text not null,
    source text not null,
    weight numeric not null default 1,
    observed_at timestamptz not null default now()
);

create index if not exists lead_signals_lead_idx on lead_signals (lead_id);

-- ---------------------------------------------------------------------------
-- artifacts: crew/funnel output files linked to a lead.
-- ---------------------------------------------------------------------------
create table if not exists artifacts (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references leads (id) on delete cascade,
    kind text not null,
    path text not null,
    created_at timestamptz not null default now()
);

create index if not exists artifacts_lead_idx on artifacts (lead_id);

-- ---------------------------------------------------------------------------
-- runs: history of crew command invocations against a lead.
-- ---------------------------------------------------------------------------
create table if not exists runs (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references leads (id) on delete cascade,
    command text not null,
    status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
    started_at timestamptz not null default now(),
    finished_at timestamptz
);

create index if not exists runs_lead_idx on runs (lead_id);
create index if not exists runs_status_idx on runs (status);

-- ---------------------------------------------------------------------------
-- icp_profiles: mirrors crew/config/icp.config.json for the console's ICP
-- editor (Sprint 5+); crew/engine read the JSON file directly as the
-- single source of truth until the console needs to edit profiles live.
-- ---------------------------------------------------------------------------
create table if not exists icp_profiles (
    id text primary key,
    tenant_id text not null default 'altolumo',
    name text not null,
    offer text not null,
    ai_engagement boolean not null default false,
    preloaded boolean not null default false,
    is_primary boolean not null default false,
    firmographics jsonb,
    buyer_titles text[],
    triggers text[],
    source_weights jsonb,
    admission_threshold numeric not null default 60
);

-- ---------------------------------------------------------------------------
-- campaigns: one row per engine run against one or more ICP profiles
-- (PRD v8 Section 9's Campaign interface, cost metering -- Sprint 5).
-- ---------------------------------------------------------------------------
create table if not exists campaigns (
    id uuid primary key default gen_random_uuid(),
    tenant_id text not null default 'altolumo',
    profile_ids text[] not null,
    sourced_count integer not null default 0,
    qualified_count integer not null default 0,
    cost_usd numeric not null default 0,
    started_at timestamptz not null default now(),
    status text not null default 'running' check (status in ('running', 'done', 'failed'))
);
