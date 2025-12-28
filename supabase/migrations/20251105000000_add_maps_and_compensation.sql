-- Migration: Add Google Maps Link and Driver Compensation Fields
-- Date: 2025-11-05
-- Description: Adds google_maps_link for restaurants and compensation fields for drivers

-- Add google_maps_link to profiles table (for restaurants/hotels)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Add driver compensation fields to profiles table (for drivers)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS per_delivery_rate DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_amount DECIMAL(10, 2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN profiles.google_maps_link IS 'Google Maps location link for restaurants/hotels';
COMMENT ON COLUMN profiles.base_salary IS 'Base monthly/hourly salary for drivers';
COMMENT ON COLUMN profiles.per_delivery_rate IS 'Payment per delivery for drivers';
COMMENT ON COLUMN profiles.bonus_amount IS 'Performance bonus for drivers';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_active ON profiles(role, is_active) WHERE is_active = true;
