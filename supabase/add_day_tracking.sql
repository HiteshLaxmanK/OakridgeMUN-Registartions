alter table delegates add column if not exists day1_present boolean not null default false;
alter table delegates add column if not exists day1_present_at timestamptz;
alter table delegates add column if not exists day2_present boolean not null default false;
alter table delegates add column if not exists day2_present_at timestamptz;
alter table delegates add column if not exists day3_present boolean not null default false;
alter table delegates add column if not exists day3_present_at timestamptz;
