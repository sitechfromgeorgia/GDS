-- Georgian Distribution System - Storage Buckets Configuration
-- Created: November 5, 2025
-- Description: Comprehensive storage bucket setup for file management

-- ========================================
-- BUCKET CONFIGURATION
-- ========================================

-- Create main storage buckets for Georgian Distribution System
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection, owner, created_at, updated_at)
VALUES 
  -- User avatars bucket (public for profile pictures)
  (
    'avatars', 
    'avatars', 
    true, 
    '5MB'::bigint,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    true,
    null,
    NOW(),
    NOW()
  ),
  
  -- Product images bucket (public for product catalog)
  (
    'product-images', 
    'product-images', 
    true, 
    '10MB'::bigint,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    true,
    null,
    NOW(),
    NOW()
  ),
  
  -- Business documents bucket (private for sensitive documents)
  (
    'documents', 
    'documents', 
    false, 
    '25MB'::bigint,
    ARRAY[
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    false,
    null,
    NOW(),
    NOW()
  ),
  
  -- Restaurant logos bucket (public for branding)
  (
    'restaurant-logos', 
    'restaurant-logos', 
    true, 
    '5MB'::bigint,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
    true,
    null,
    NOW(),
    NOW()
  ),
  
  -- Delivery proof bucket (private for delivery confirmation photos)
  (
    'delivery-proofs', 
    'delivery-proofs', 
    false, 
    '15MB'::bigint,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    true,
    null,
    NOW(),
    NOW()
  ),
  
  -- Temporary uploads bucket (private for processing)
  (
    'temp-uploads', 
  avif_autodetection = EXCLUDED.avif_autodetection,
  updated_at = NOW();

-- ========================================
-- HELPER FUNCTIONS FOR STORAGE
-- ========================================

-- Function to get user role from storage objects
CREATE OR REPLACE FUNCTION storage.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role::TEXT 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION storage.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin') 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate file ownership for user folders
CREATE OR REPLACE FUNCTION storage.validate_ownership(file_path TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the first folder in path matches user ID
  RETURN (storage.foldername(file_path))[1] = user_id::TEXT;
END;
  TO authenticated
  USING (
    bucket_id = 'delivery-proofs' AND (
      storage.is_admin() OR
      storage.get_user_role() IN ('restaurant', 'driver')
    )
  );

-- Allow drivers to upload delivery proof photos
CREATE POLICY "Drivers can upload delivery proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'delivery-proofs' AND (
      storage.is_admin() OR 
      storage.get_user_role() = 'driver'
    )
  );

-- Allow drivers and admins to update delivery proofs
CREATE POLICY "Drivers and admins can update delivery proofs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'delivery-proofs' AND (
      storage.is_admin() OR 
      storage.get_user_role() = 'driver'
    )
  );

-- Allow admins to delete delivery proofs
CREATE POLICY "Admins can delete delivery proofs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'delivery-proofs' AND storage.is_admin()
  );

-- TEMP-UPLOADS BUCKET POLICIES (PRIVATE)
-- Allow authenticated users temporary upload access
CREATE POLICY "Authenticated users can upload temp files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'temp-uploads' AND
    storage.validate_ownership(name, auth.uid())
  );

-- Allow file owners to read their temp files
CREATE POLICY "Users can read own temp files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'temp-uploads' AND
    storage.validate_ownership(name, auth.uid())
  );

-- Allow file owners to update their temp files
CREATE POLICY "Users can update own temp files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'temp-uploads' AND
    storage.validate_ownership(name, auth.uid())
  );

-- Allow file owners to delete their temp files
CREATE POLICY "Users can delete own temp files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'temp-uploads' AND
    storage.validate_ownership(name, auth.uid())
  );

-- Allow admins to manage all temp files
CREATE POLICY "Admins can manage all temp files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'temp-uploads' AND storage.is_admin()
  );

-- ========================================
-- STORAGE OPTIMIZATION
-- ========================================

-- Create function to clean up old temp files
CREATE OR REPLACE FUNCTION storage.cleanup_temp_files()
RETURNS void AS $$
BEGIN
  -- Delete files older than 24 hours from temp-uploads bucket
  DELETE FROM storage.objects 
  WHERE bucket_id = 'temp-uploads' 
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to optimize image storage
CREATE OR REPLACE FUNCTION storage.optimize_image_storage()
RETURNS void AS $$
BEGIN
  -- This function can be extended to implement image optimization
  -- For now, it's a placeholder for future image processing
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- BUCKET COMMENTS
-- ========================================

COMMENT ON SCHEMA storage IS 'Supabase storage schema for Georgian Distribution System';

COMMENT ON FUNCTION storage.get_user_role() IS 'Helper function to get current user role for storage policies';
COMMENT ON FUNCTION storage.is_admin() IS 'Helper function to check if current user is admin';
COMMENT ON FUNCTION storage.validate_ownership(file_path, user_id) IS 'Helper function to validate file ownership by checking folder structure';
COMMENT ON FUNCTION storage.cleanup_temp_files() IS 'Removes temporary files older than 24 hours';
COMMENT ON FUNCTION storage.optimize_image_storage() IS 'Placeholder for future image optimization features';

-- ========================================
-- STORAGE STATISTICS FUNCTION
-- ========================================

-- Create function to get bucket statistics
CREATE OR REPLACE FUNCTION storage.get_bucket_stats()
RETURNS TABLE (
  bucket_name TEXT,
  total_files BIGINT,
  total_size BIGINT,
  largest_file BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    buckets.name as bucket_name,
    COUNT(objects.id) as total_files,
    COALESCE(SUM(objects.metadata->>'size'::bigint), 0) as total_size,
    COALESCE(MAX(objects.metadata->>'size'::bigint), 0) as largest_file
  FROM storage.buckets
  LEFT JOIN storage.objects ON buckets.id = objects.bucket_id
  GROUP BY buckets.id, buckets.name
  ORDER BY buckets.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION storage.get_bucket_stats() IS 'Returns storage usage statistics for all buckets';