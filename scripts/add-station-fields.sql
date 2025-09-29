-- Add missing fields to model_stations table to match the setup page interface

-- Add the missing columns
ALTER TABLE model_stations
ADD COLUMN IF NOT EXISTS station_id text,
ADD COLUMN IF NOT EXISTS station_type text,
ADD COLUMN IF NOT EXISTS activity_description text,
ADD COLUMN IF NOT EXISTS props_needed text[];

-- Update type column to station_type for any existing data
UPDATE model_stations SET station_type = type WHERE station_type IS NULL;