-- ============================================================
-- Lead Gen App — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- LEADS table
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  niche         text,
  city          text,
  address       text,
  phone         text,
  website       text,
  email         text,
  rating        numeric(3,1),
  reviews       int,
  category      text,
  source_url    text,

  -- Audit data
  mobile_score      int,
  desktop_score     int,
  has_ssl           boolean,
  is_mobile_responsive boolean,
  cms               text,

  -- Lead intelligence
  lead_score    int default 0,
  status        text default 'new'
                check (status in ('new','draft','emailed','replied','booked','won','archived')),

  scraped_at    timestamptz,
  last_contacted timestamptz,
  created_at    timestamptz default now(),

  -- Prevent duplicates from re-scraping the same area
  unique (name, city)
);

-- EMAILS table
create table if not exists emails (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid unique references leads(id) on delete cascade,
  subject       text,
  body          text,
  status        text default 'draft'
                check (status in ('draft','sent','opened','clicked','replied','bounced')),
  sequence_step int default 1,      -- 1=initial, 2=followup1, 3=followup2, 4=breakup

  generated_at  timestamptz,
  sent_at       timestamptz,
  opened_at     timestamptz,
  replied_at    timestamptz,
  resend_id     text,

  created_at    timestamptz default now()
);

-- Indexes for common queries
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_score_idx  on leads(lead_score desc);
create unique index if not exists emails_lead_idx on emails(lead_id);
create index if not exists emails_status_idx on emails(status);

-- Row Level Security (disable for internal tool — you are the only user)
alter table leads disable row level security;
alter table emails disable row level security;
