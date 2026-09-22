-- Lets a user stop the weekly recap email. Required for a lawful marketing
-- email: CAN-SPAM wants a working opt-out in every message, and PECR/GDPR
-- want withdrawing consent to be as easy as giving it.

alter table public.profiles
  add column if not exists email_opt_out boolean not null default false;
