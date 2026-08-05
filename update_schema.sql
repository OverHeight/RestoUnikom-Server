-- Run this in the Supabase SQL Editor

-- 1. Add current_phase to sesi_makan (Default: PRE_SESSION)
ALTER TABLE public.sesi_makan 
ADD COLUMN current_phase text DEFAULT 'PRE_SESSION' NOT NULL;

-- 2. Add detailed statuses to order_course
ALTER TABLE public.order_course
ADD COLUMN chef_status text DEFAULT 'PENDING' NOT NULL,
ADD COLUMN waiter_status text DEFAULT 'PENDING' NOT NULL;

-- 3. Drop the old generic 'status' column if you want (optional, but good for cleanliness)
-- ALTER TABLE public.order_course DROP COLUMN status;

-- Note: The phases for current_phase will be:
-- 'PRE_SESSION', 'APPETIZER', 'MAIN', 'DESSERT', 'FREE_TIME', 'ENDED'

-- The statuses for chef_status: 'PENDING', 'READY'
-- The statuses for waiter_status: 'PENDING', 'SERVED', 'CLEARED'
