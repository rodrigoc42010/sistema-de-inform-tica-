-- Enable Row Level Security (RLS) on public tables to secure them
-- This prevents unauthorized access via PostgREST API (Supabase Data API)
-- The backend (Node.js) connects as 'postgres' user which bypasses RLS, so it won't be affected.

-- 1. Enable RLS on tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on plans table
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 5. Enable RLS on payment_logs table
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- 6. Enable RLS on blacklisted_tokens table
ALTER TABLE public.blacklisted_tokens ENABLE ROW LEVEL SECURITY;

-- 7. Enable RLS on analytics_events table
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Note: By default, enabling RLS without creating policies denies all access 
-- to roles that are not table owners or do not have BYPASSRLS attribute (like 'anon' and 'authenticated').
-- This effectively secures these tables from public API access while allowing the backend to work.
