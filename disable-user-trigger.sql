-- Temporarily disable the problematic user creation trigger
-- Run this in Supabase SQL Editor to fix the signup issue

-- Drop the existing trigger that's causing the problem
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function as well
DROP FUNCTION IF EXISTS handle_new_user();

-- We'll handle organization creation through the application code instead
-- This allows user signup to work properly while we fix the RLS issues