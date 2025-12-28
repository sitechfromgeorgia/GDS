# Supabase Storage Configuration - Georgian Distribution System

**Document Version:** 1.0  
**Created:** November 5, 2025  
**Purpose:** Comprehensive storage configuration and usage guide for Georgian Distribution System

---

## Overview

This document outlines the complete storage configuration for the Georgian Distribution System, including bucket setup, security policies, client configurations, and usage examples. The system uses Supabase Storage with multiple specialized buckets for different types of content.

---

## Storage Buckets Overview

### Public Buckets (Accessible without authentication)

#### 1. **avatars**
- **Purpose**: User profile pictures
- **Access**: Public read, user-specific write
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 5MB
- **Structure**: `{userId}/avatar.{ext}`

#### 2. **product-images**
- **Purpose**: Product catalog images for restaurants
- **Access**: Public read, admin-only write
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 10MB
- **Structure**: `{productId}/image.{ext}`

#### 3. **restaurant-logos**
- **Purpose**: Restaurant branding and logos
- **Access**: Public read, admin and restaurant write
- **File Types**: JPEG, PNG, WebP, SVG
- **Max Size**: 5MB
- **Structure**: `{restaurantId}/logo.{ext}`

### Private Buckets (Authentication required)

#### 4. **documents**
- **Purpose**: Business documents, contracts, licenses
- **Access**: Role-based (admin, restaurant, driver)
- **File Types**: PDF, DOC, DOCX, TXT, XLS, XLSX
- **Max Size**: 25MB
- **Structure**: `{userId}/documents/{timestamp}-{filename}`

#### 5. **delivery-proofs**
- **Purpose**: Delivery confirmation photos
- **Access**: Role-based (admin, restaurant, driver)
- **File Types**: JPEG, PNG, WebP
- **Max Size**: 15MB
- **Structure**: `{orderId}/proof-{timestamp}.{ext}`

#### 6. **temp-uploads**
- **Purpose**: Temporary file processing
- **Access**: User-specific, auto-cleanup
- **File Types**: Images and PDFs
- **Max Size**: 50MB
- **Structure**: `{userId}/temp/{timestamp}-{filename}`

---

## Security Policies

### Row Level Security (RLS) Configuration

All storage objects are protected by Row Level Security policies that enforce:

#### User Role Validation
```sql
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
```

#### Admin Verification
```sql
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
```

#### File Ownership Validation
```sql
CREATE OR REPLACE FUNCTION storage.validate_ownership(file_path TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (storage.foldername(file_path))[1] = user_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Policy Examples

#### Avatar Policies
```sql
-- Public read access
CREATE POLICY "Public read access for avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- User-specific write access
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND storage.validate_ownership(name, auth.uid()));

-- Admin full access
CREATE POLICY "Admins can manage all avatars"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND storage.is_admin());
```

#### Product Image Policies
```sql
-- Public read access
CREATE POLICY "Public read access for product images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

-- Admin-only write access
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND storage.is_admin());
```

---

## Client Configuration

### Environment Setup

#### Development Environment
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Production Environment
```bash
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Storage Client Usage

#### Basic Upload
```typescript
import { storage, STORAGE_BUCKETS } from '@/lib/supabase/storage'

// Upload a file
const { data, error } = await storage.uploadFile(
  STORAGE_BUCKETS.PRODUCT_IMAGES,
  file,
  'products/product-id/image.jpg'
)

if (error) {
  console.error('Upload failed:', error)
} else {
  console.log('File uploaded:', data.publicUrl)
}
```

#### Specialized Upload Methods
```typescript
import { ProductImageUpload, UserAvatarUpload } from '@/components/upload/ImageUpload'

// Product image upload component
<ProductImageUpload 
  productId="product-123"
  onUpload={(file) => console.log('Uploaded:', file)}
  onError={(error) => console.error('Error:', error)}
/>

// User avatar upload component
<UserAvatarUpload 
  userId="user-456"
  onUpload={(file) => console.log('Avatar updated:', file)}
  onError={(error) => console.error('Error:', error)}
/>
```

---

## File Validation

### Image Validation
```typescript
import { FileValidator } from '@/lib/supabase/storage'

const validation = FileValidator.validateImage(file, 'product')
if (!validation.valid) {
  console.error('Invalid image:', validation.error)
  return
}
```

### Document Validation
```typescript
const validation = FileValidator.validateDocument(file)
if (!validation.valid) {
  console.error('Invalid document:', validation.error)
  return
}
```

### File Type Restrictions

#### Images
- **Allowed**: JPEG, JPG, PNG, WebP, SVG (logos only)
- **Max Sizes**:
  - Avatars: 5MB
  - Product images: 10MB
  - Restaurant logos: 5MB
  - Delivery proofs: 15MB

#### Documents
- **Allowed**: PDF, DOC, DOCX, TXT, XLS, XLSX
- **Max Size**: 25MB

---

## Path Structure Conventions

### User Files
```
{userId}/avatar.jpg
{userId}/documents/{timestamp}-contract.pdf
{userId}/temp/{timestamp}-processing.jpg
```

### Product Files
```
products/{productId}/image.jpg
products/{productId}/gallery/{timestamp}-photo.jpg
```

### Order Files
```
orders/{orderId}/proof-{timestamp}.jpg
orders/{orderId}/delivery-signature.png
```

### Restaurant Files
```
{restaurantId}/logo.svg
{restaurantId}/documents/{timestamp}-license.pdf
```

---

## Storage Functions

### Bucket Statistics
```typescript
const stats = await storage.getBucketStatistics()
console.log('Storage usage:', stats)
```

### Cleanup Functions
```typescript
// Clean old temporary files
await storage.cleanupTemporaryFiles()
```

### File Management
```typescript
// List files in bucket
const files = await storage.listFiles('product-images', 'products/product-123')

// Get file metadata
const metadata = await storage.getFileMetadata('avatars', 'user-id/avatar.jpg')

// Delete file
await storage.deleteFile('product-images', 'products/product-123/image.jpg')
```

---

## React Components Usage

### ImageUpload Component
```typescript
import { ImageUpload } from '@/components/upload/ImageUpload'

<ImageUpload
  bucket={STORAGE_BUCKETS.PRODUCT_IMAGES}
  path={`products/${productId}`}
  onUpload={(file) => setProductImage(file.url)}
  onError={(error) => toast.error(error)}
  maxSize={10 * 1024 * 1024}
  accept="image/*"
>
  <div className="text-center">
    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-lg font-medium">Upload Product Image</p>
    <p className="text-sm text-gray-500">Drag & drop or click to browse</p>
  </div>
</ImageUpload>
```

### Specialized Components
```typescript
// For products
<ProductImageUpload 
  productId="prod-123"
  onUpload={(file) => updateProduct({ imageUrl: file.url })}
/>

// For user profiles
<UserAvatarUpload 
  userId="user-456"
  onUpload={(file) => updateProfile({ avatarUrl: file.url })}
/>

// For restaurants
<RestaurantLogoUpload 
  restaurantId="rest-789"
  onUpload={(file) => updateRestaurant({ logoUrl: file.url })}
/>

// For deliveries
<DeliveryProofUpload 
  orderId="order-101"
  onUpload={(file) => confirmDelivery({ proofUrl: file.url })}
/>
```

---

## Error Handling

### Common Error Types
1. **File Too Large**: `File size too large. Maximum size: XMB`
2. **Invalid File Type**: `Invalid file type. Allowed types: ...`
3. **Permission Denied**: RLS policy violation
4. **Network Error**: Upload interrupted
5. **Storage Quota**: Bucket limit reached

### Error Response Format
```typescript
{
  error: {
    message: "File size too large. Maximum size: 10MB",
    code: "FILE_TOO_LARGE",
    details: {...}
  }
}
```

---

## Performance Optimization

### Cache Control Headers
- **Images**: 1 year cache (31536000 seconds)
- **Documents**: 1 day cache (86400 seconds)
- **Delivery Proofs**: 30 days cache (2592000 seconds)

### File Naming Conventions
- Use timestamps for uniqueness: `{timestamp}-{original-name}`
- Include entity ID for organization: `{entityId}/image.{ext}`
- Avoid special characters in file names

### Progressive Upload
- Validate file before upload
- Show upload progress
- Handle partial uploads gracefully
- Implement retry logic for failed uploads

---

## Security Best Practices

### File Validation
- Validate file types on both client and server
- Check file sizes before upload
- Sanitize file names
- Scan for malicious content

### Access Control
- Implement proper RLS policies
- Validate user permissions before upload
- Use signed URLs for private files
- Monitor file access patterns

### Data Protection
- Encrypt sensitive files
- Implement data retention policies
- Regular security audits
- Backup critical files

---

## Monitoring and Analytics

### Storage Metrics
- Total storage usage per bucket
- File upload/download counts
- Average file sizes
- Error rates and types

### Usage Tracking
```typescript
// Track storage usage
const trackUpload = async (bucket: string, fileSize: number) => {
  // Log upload for analytics
  analytics.track('file_upload', {
    bucket,
    fileSize,
    userId: auth.uid()
  })
}
```

---

## Migration Guide

### From Legacy Storage
1. Migrate existing files to new bucket structure
2. Update file references in database
3. Update client code to use new storage API
4. Test all upload functionality
5. Monitor for issues during rollout

### Rollback Plan
1. Keep old storage system running in parallel
2. Have database migration scripts ready
3. Test rollback procedures
4. Document any data loss scenarios

---

## Troubleshooting

### Common Issues

#### Upload Fails with Permission Error
**Solution**: Check user role and RLS policies
```sql
-- Verify user role
SELECT role FROM profiles WHERE id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

#### File Not Accessible After Upload
**Solution**: Verify bucket configuration and policies
```sql
-- Check bucket is public/private as expected
SELECT public FROM storage.buckets WHERE id = 'bucket-name';

-- Verify object exists
SELECT * FROM storage.objects WHERE bucket_id = 'bucket-name';
```

#### Large File Uploads Timeout
**Solution**: Increase timeout and implement chunked uploads
```typescript
// Implement chunked upload for large files
const uploadLargeFile = async (file: File) => {
  const chunkSize = 5 * 1024 * 1024 // 5MB chunks
  // ... implement chunking logic
}
```

---

## API Reference

### StorageManager Class
```typescript
class StorageManager {
  uploadFile(bucket: string, file: File, path: string): Promise<UploadResult>
  uploadMultipleFiles(bucket: string, files: File[], basePath: string): Promise<MultipleUploadResult>
  deleteFile(bucket: string, path: string): Promise<DeleteResult>
  listFiles(bucket: string, path?: string): Promise<ListResult>
  getFileUrl(bucket: string, path: string): string
}
```

### GeorgianDistributionStorage Class
```typescript
class GeorgianDistributionStorage extends StorageManager {
  uploadUserAvatar(userId: string, file: File): Promise<UploadResult>
  uploadProductImage(productId: string, file: File): Promise<UploadResult>
  uploadRestaurantLogo(restaurantId: string, file: File): Promise<UploadResult>
  uploadDeliveryProof(orderId: string, file: File): Promise<UploadResult>
  uploadBusinessDocument(userId: string, file: File): Promise<UploadResult>
  uploadTemporaryFile(file: File, userId: string): Promise<UploadResult>
  getBucketStatistics(): Promise<BucketStats>
  cleanupTemporaryFiles(): Promise<CleanupResult>
}
```

---

## Testing

### Unit Tests
```typescript
import { FileValidator, STORAGE_BUCKETS } from '@/lib/supabase/storage'

describe('FileValidator', () => {
  it('validates image files correctly', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const result = FileValidator.validateImage(file, 'product')
    expect(result.valid).toBe(true)
  })
})
```

### Integration Tests
```typescript
describe('Storage Integration', () => {
  it('uploads product image successfully', async () => {
    const storage = new GeorgianDistributionStorage()
    const file = createTestImageFile()
    
    const result = await storage.uploadProductImage('test-product-id', file)
    expect(result.error).toBeUndefined()
    expect(result.data?.publicUrl).toBeDefined()
  })
})
```

### E2E Tests
```typescript
// Test full upload workflow
describe('Upload Workflow E2E', () => {
  it('completes full upload flow', async () => {
    // 1. Login as admin
    // 2. Navigate to product form
    // 3. Upload image
    // 4. Verify image appears in product
    // 5. Verify public access to image
  })
})
```

---

## Maintenance

### Regular Tasks
- Clean temporary files (daily)
- Monitor storage usage (weekly)
- Review access logs (monthly)
- Update security policies (as needed)

### Backup Strategy
- Daily automated backups
- Cross-region replication for critical files
- Regular backup restoration tests
- Document recovery procedures

---

**Last Updated:** November 5, 2025  
**Next Review:** December 5, 2025  
**Owner:** Development Team