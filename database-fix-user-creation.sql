-- Fix the user creation trigger to work with RLS policies
-- This should be run in Supabase SQL Editor

-- Drop the existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Create a new function that can bypass RLS
create or replace function handle_new_user()
returns trigger
security definer -- This allows the function to bypass RLS
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  -- Insert the new organization (bypassing RLS due to security definer)
  insert into public.orgs (name, owner_user_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'My Organization'),
    new.id
  )
  returning id into new_org_id;

  -- Insert the org membership (bypassing RLS due to security definer)
  insert into public.org_members (org_id, user_id, role)
  values (
    new_org_id,
    new.id,
    'owner'
  );

  return new;
exception
  when others then
    -- Log the error but don't fail the user creation
    raise log 'Error in handle_new_user trigger for user %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql;

-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();