-- Migration: Make to_station_id nullable in model_missions table
-- Reason: Stations are now assigned at event level, not model level

ALTER TABLE model_missions ALTER COLUMN to_station_id DROP NOT NULL;