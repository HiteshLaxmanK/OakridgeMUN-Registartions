-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor > New query).

create table if not exists delegates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  school text not null default '',
  committee text not null default '',
  country text not null default '',
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  note text,
  liability_form_on_file boolean not null default false,
  liability_form_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists delegates_committee_idx on delegates (committee);
create index if not exists delegates_checked_in_idx on delegates (checked_in);

-- Row Level Security stays on with no policies: every request in this app goes
-- through the Next.js server using the service_role key, which bypasses RLS.
-- The anon/public key is never used, so nothing needs to be opened up here.
alter table delegates enable row level security;

-- Storage bucket for scanned liability form PDFs. Created via the dashboard
-- (Storage > New bucket, name "liability-forms", keep it Private) or here:
insert into storage.buckets (id, name, public)
values ('liability-forms', 'liability-forms', false)
on conflict (id) do nothing;
