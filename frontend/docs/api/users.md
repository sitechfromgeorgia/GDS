# Users & Profiles API Documentation

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Base URL**: Database queries to `profiles` table
**Authentication**: Required (role-based access)

---

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [User Roles](#user-roles)
4. [Endpoints](#endpoints)
5. [TypeScript Types](#typescript-types)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Testing Examples](#testing-examples)

---

## Overview

The Users & Profiles API manages user accounts and profile information. It handles:

- User profile creation and updates
- Role-based access control (Admin, Restaurant, Driver)
- Profile metadata management
- User availability status
- Contact information
- Vehicle information (for drivers)
- Profile image uploads
- User statistics and metrics

### Key Features
- ✅ Automatic profile creation on user signup
- ✅ Role-based access control (RBAC)
- ✅ Profile completeness validation
- ✅ Avatar/profile image management
- ✅ Driver-specific fields (vehicle info, license)
- ✅ Restaurant-specific fields (business info)
- ✅ Availability status tracking
- ✅ Audit trail with timestamps

---

## Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  avatar_url TEXT,

  -- Role and status
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,

  -- Address
  address TEXT,
  location GEOGRAPHY(POINT),
  city VARCHAR(100),
  postal_code VARCHAR(20),

  -- Driver-specific fields
  vehicle_type VARCHAR(50),
  vehicle_number VARCHAR(50),
  vehicle_info JSONB,
  license_number VARCHAR(100),
  license_expiry DATE,

  -- Restaurant-specific fields
  business_name VARCHAR(255),
  business_type VARCHAR(100),
  tax_id VARCHAR(50),

  -- Metadata
  metadata JSONB,
  notes TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('admin', 'restaurant', 'driver')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[\d\s-()]+$')
);

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'restaurant', 'driver');

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'restaurant')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Performance Indexes
```sql
-- Profile lookups
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_is_available ON profiles(is_available) WHERE is_available = true;

-- Driver-specific indexes
CREATE INDEX idx_profiles_vehicle_type ON profiles(vehicle_type) WHERE role = 'driver';
CREATE INDEX idx_profiles_license_expiry ON profiles(license_expiry) WHERE role = 'driver';

-- Restaurant-specific indexes
CREATE INDEX idx_profiles_business_name ON profiles(business_name) WHERE role = 'restaurant';

-- Geospatial index
CREATE INDEX idx_profiles_location ON profiles USING GIST(location) WHERE location IS NOT NULL;

-- Full-text search
CREATE INDEX idx_profiles_full_name_search ON profiles USING gin(to_tsvector('simple', full_name));

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

## User Roles

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY                           │
└─────────────────────────────────────────────────────────────────┘

                           ┌───────┐
                           │ ADMIN │
                           └───┬───┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
               ┌────▼────┐          ┌────▼────┐
               │RESTAURANT│          │ DRIVER  │
               └─────────┘          └─────────┘

Admin:
- Manage all users
- View all profiles
- Assign roles
- System configuration
- Full access to all features

Restaurant:
- Manage own profile
- Create orders
- View own orders
- Manage products (future)
- Cannot access other restaurants' data

Driver:
- Manage own profile
- View assigned orders
- Update delivery status
- Track earnings (future)
- Cannot access restaurant data
```

### Role Permissions

| Action | Admin | Restaurant | Driver |
|--------|-------|------------|--------|
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| View all profiles | ✅ | ❌ | ❌ |
| Update any profile | ✅ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ |
| Deactivate users | ✅ | ❌ | ❌ |
| View driver list | ✅ | ✅ | ❌ |
| View restaurant list | ✅ | ❌ | ❌ |
| Create orders | ❌ | ✅ | ❌ |
| Assign drivers | ✅ | ❌ | ❌ |
| Update delivery status | ❌ | ❌ | ✅ |

---

## Endpoints

### 1. Get Current User Profile

**Purpose**: Get authenticated user's profile

**Method**: Supabase select with auth context

```typescript
async function getCurrentUserProfile() {
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Get profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Profile not found')
    }
    throw error
  }

  return profile
}
```

**Response**: Profile object

**Error Codes**:
- `401` - Unauthorized (not logged in)
- `404` - Profile not found

---

### 2. Update Own Profile

**Purpose**: Update authenticated user's profile

**Method**: Supabase update

```typescript
async function updateOwnProfile(updates: {
  fullName?: string
  phone?: string
  avatarUrl?: string
  address?: string
  location?: { lat: number; lng: number }
  city?: string
  postalCode?: string
  // Driver-specific
  vehicleType?: string
  vehicleNumber?: string
  vehicleInfo?: any
  licenseNumber?: string
  licenseExpiry?: string
  // Restaurant-specific
  businessName?: string
  businessType?: string
  taxId?: string
  // Common
  metadata?: any
  notes?: string
}) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Validate input
  if (updates.phone && !/^\+?[\d\s-()]+$/.test(updates.phone)) {
    throw new Error('Invalid phone number format')
  }

  if (updates.email) {
    throw new Error('Email cannot be changed through profile update')
  }

  // Prepare update data
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  // Map camelCase to snake_case
  if (updates.fullName !== undefined) updateData.full_name = updates.fullName
  if (updates.phone !== undefined) updateData.phone = updates.phone
  if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl
  if (updates.address !== undefined) updateData.address = updates.address
  if (updates.city !== undefined) updateData.city = updates.city
  if (updates.postalCode !== undefined) updateData.postal_code = updates.postalCode
  if (updates.vehicleType !== undefined) updateData.vehicle_type = updates.vehicleType
  if (updates.vehicleNumber !== undefined) updateData.vehicle_number = updates.vehicleNumber
  if (updates.vehicleInfo !== undefined) updateData.vehicle_info = updates.vehicleInfo
  if (updates.licenseNumber !== undefined) updateData.license_number = updates.licenseNumber
  if (updates.licenseExpiry !== undefined) updateData.license_expiry = updates.licenseExpiry
  if (updates.businessName !== undefined) updateData.business_name = updates.businessName
  if (updates.businessType !== undefined) updateData.business_type = updates.businessType
  if (updates.taxId !== undefined) updateData.tax_id = updates.taxId
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata
  if (updates.notes !== undefined) updateData.notes = updates.notes

  // Handle location
  if (updates.location) {
    updateData.location = `POINT(${updates.location.lng} ${updates.location.lat})`
  }

  // Update profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error

  return profile
}
```

**Request Body**:
```typescript
{
  fullName?: string
  phone?: string
  avatarUrl?: string
  address?: string
  location?: { lat: number, lng: number }
  city?: string
  postalCode?: string
  // Driver fields
  vehicleType?: string
  vehicleNumber?: string
  vehicleInfo?: {
    make?: string
    model?: string
    year?: number
    color?: string
    capacity?: string
  }
  licenseNumber?: string
  licenseExpiry?: string // ISO date
  // Restaurant fields
  businessName?: string
  businessType?: string
  taxId?: string
  // Common
  metadata?: any
  notes?: string
}
```

**Response**: Updated Profile object

---

### 3. Get User by ID

**Purpose**: Get specific user profile (Admin only or own profile)

**Method**: Supabase select with authorization

```typescript
async function getUserById(userId: string) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check authorization
  const isOwnProfile = user.id === userId

  if (!isOwnProfile) {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Forbidden: Only admins can view other profiles')
    }
  }

  // Get profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('User not found')
    }
    throw error
  }

  return profile
}
```

**Response**: Profile object

**Error Codes**:
- `401` - Unauthorized
- `403` - Forbidden (not admin, trying to view other's profile)
- `404` - User not found

---

### 4. List Users

**Purpose**: List all users with filtering (Admin only)

**Method**: Supabase select with RLS

```typescript
async function listUsers(params: {
  role?: 'admin' | 'restaurant' | 'driver'
  isActive?: boolean
  isAvailable?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'full_name' | 'email'
  sortOrder?: 'asc' | 'desc'
}) {
  const {
    role,
    isActive,
    isAvailable,
    search,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = params

  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  // Build query
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  // Apply filters
  if (role) {
    query = query.eq('role', role)
  }

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive)
  }

  if (isAvailable !== undefined) {
    query = query.eq('is_available', isAvailable)
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Pagination
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data: users, error, count } = await query

  if (error) throw error

  return {
    users,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}
```

**Query Parameters**:
- `role` - Filter by user role
- `isActive` - Filter by active status
- `isAvailable` - Filter by availability (drivers)
- `search` - Search in name, email, phone
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: created_at)
- `sortOrder` - Sort direction (default: desc)

**Response**:
```typescript
{
  users: Profile[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

---

### 5. List Available Drivers

**Purpose**: Get list of available drivers for order assignment

**Method**: Supabase select with filters

```typescript
async function listAvailableDrivers(params?: {
  location?: { lat: number; lng: number }
  maxDistance?: number // km
  vehicleType?: string
}) {
  // Verify user is admin or restaurant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'restaurant'].includes(profile.role)) {
    throw new Error('Forbidden: Only admins and restaurants can view drivers')
  }

  // Build query
  let query = supabase
    .from('profiles')
    .select('id, full_name, phone, vehicle_type, vehicle_number, location')
    .eq('role', 'driver')
    .eq('is_active', true)
    .eq('is_available', true)

  if (params?.vehicleType) {
    query = query.eq('vehicle_type', params.vehicleType)
  }

  const { data: drivers, error } = await query

  if (error) throw error

  // If location provided, filter by distance
  if (params?.location && params?.maxDistance) {
    const filtered = drivers.filter(driver => {
      if (!driver.location) return false

      const distance = calculateDistance(
        params.location!,
        driver.location
      )

      return distance <= (params.maxDistance || 10)
    })

    return filtered
  }

  return drivers
}

// Haversine formula for distance calculation
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat)
  const dLon = toRad(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
    Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
```

**Query Parameters**:
- `location` - Reference location for distance calculation
- `maxDistance` - Maximum distance in km (default: 10)
- `vehicleType` - Filter by vehicle type

**Response**: Array of available driver profiles

---

### 6. Update Driver Availability

**Purpose**: Toggle driver availability status

**Method**: Supabase update

```typescript
async function updateDriverAvailability(isAvailable: boolean) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify driver role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'driver') {
    throw new Error('Only drivers can update availability')
  }

  // Update availability
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({
      is_available: isAvailable,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error

  return updatedProfile
}
```

**Request Body**:
```typescript
{
  isAvailable: boolean
}
```

**Response**: Updated Profile object

---

### 7. Deactivate User

**Purpose**: Deactivate user account (Admin only)

**Method**: Supabase update + auth admin

```typescript
async function deactivateUser(userId: string, reason?: string) {
  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Only admins can deactivate users')
  }

  // Prevent self-deactivation
  if (userId === user.id) {
    throw new Error('Cannot deactivate your own account')
  }

  // Update profile
  const { data: deactivatedProfile, error: profileError } = await supabase
    .from('profiles')
    .update({
      is_active: false,
      is_available: false,
      deactivated_at: new Date().toISOString(),
      deactivated_by: user.id,
      deactivation_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (profileError) throw profileError

  // Optionally: Sign out the user from all sessions
  // This requires Supabase Admin API
  // await supabase.auth.admin.signOut(userId)

  return deactivatedProfile
}
```

**Request Body**:
```typescript
{
  reason?: string
}
```

**Response**: Deactivated Profile object

---

### 8. Change User Role

**Purpose**: Change user's role (Admin only)

**Method**: Supabase update

```typescript
async function changeUserRole(
  userId: string,
  newRole: 'admin' | 'restaurant' | 'driver'
) {
  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Only admins can change user roles')
  }

  // Prevent self-role change
  if (userId === user.id) {
    throw new Error('Cannot change your own role')
  }

  // Get target user
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    throw new Error('User not found')
  }

  // Update role
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      role_changed_at: new Date().toISOString(),
      role_changed_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  // Log the role change
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'role_changed',
    target_user_id: userId,
    old_value: targetUser.role,
    new_value: newRole,
    metadata: {
      target_user_name: targetUser.full_name
    }
  })

  return updatedProfile
}
```

**Request Body**:
```typescript
{
  role: 'admin' | 'restaurant' | 'driver'
}
```

**Response**: Updated Profile object

---

### 9. Upload Profile Avatar

**Purpose**: Upload and update user avatar image

**Method**: Supabase Storage + profile update

```typescript
async function uploadAvatar(file: File) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Validate file
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB')
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('profiles')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('profiles')
    .getPublicUrl(filePath)

  // Update profile with new avatar URL
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (profileError) throw profileError

  return {
    avatarUrl: publicUrl,
    profile
  }
}
```

**Request**: Multipart form data with `file` field

**Response**:
```typescript
{
  avatarUrl: string
  profile: Profile
}
```

**Error Codes**:
- `400` - Invalid file (size/type)
- `401` - Unauthorized
- `500` - Upload failed

---

## TypeScript Types

```typescript
// User roles
export type UserRole = 'admin' | 'restaurant' | 'driver'

// Profile interface
export interface Profile {
  id: string

  // Basic info
  fullName: string
  email: string
  phone?: string
  avatarUrl?: string

  // Role and status
  role: UserRole
  isActive: boolean
  isAvailable: boolean

  // Address
  address?: string
  location?: {
    lat: number
    lng: number
  }
  city?: string
  postalCode?: string

  // Driver-specific
  vehicleType?: string
  vehicleNumber?: string
  vehicleInfo?: {
    make?: string
    model?: string
    year?: number
    color?: string
    capacity?: string
  }
  licenseNumber?: string
  licenseExpiry?: string

  // Restaurant-specific
  businessName?: string
  businessType?: string
  taxId?: string

  // Metadata
  metadata?: Record<string, any>
  notes?: string
  lastSeenAt?: string

  // Timestamps
  createdAt: string
  updatedAt: string
}

// Update profile input
export interface UpdateProfileInput {
  fullName?: string
  phone?: string
  avatarUrl?: string
  address?: string
  location?: { lat: number; lng: number }
  city?: string
  postalCode?: string
  vehicleType?: string
  vehicleNumber?: string
  vehicleInfo?: any
  licenseNumber?: string
  licenseExpiry?: string
  businessName?: string
  businessType?: string
  taxId?: string
  metadata?: any
  notes?: string
}

// List users filters
export interface UserFilters {
  role?: UserRole
  isActive?: boolean
  isAvailable?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'full_name' | 'email'
  sortOrder?: 'asc' | 'desc'
}

// List response
export interface UserListResponse {
  users: Profile[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Driver location filter
export interface DriverLocationFilter {
  location?: { lat: number; lng: number }
  maxDistance?: number
  vehicleType?: string
}
```

---

## Performance Optimization

### 1. Database Indexes
All indexes from [Database Schema](#database-schema) provide:
- ✅ Fast email and phone lookups
- ✅ Role-based filtering
- ✅ Availability queries
- ✅ Full-text search on names
- ✅ Geospatial queries for nearby drivers

### 2. Query Optimization

```typescript
// ✅ GOOD: Select only needed fields
const { data } = await supabase
  .from('profiles')
  .select('id, full_name, phone, role')
  .eq('role', 'driver')
  .eq('is_available', true)

// ❌ BAD: Select all fields
const { data } = await supabase
  .from('profiles')
  .select('*')
```

### 3. Caching Strategy

```typescript
// React Query caching for profiles
const { data: profile } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => getUserById(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000 // 10 minutes retention
})

// Own profile with shorter stale time
const { data: ownProfile } = useQuery({
  queryKey: ['profile', 'me'],
  queryFn: getCurrentUserProfile,
  staleTime: 1 * 60 * 1000, // 1 minute
  gcTime: 5 * 60 * 1000
})
```

### 4. Real-time Subscriptions

```typescript
// Subscribe to own profile changes
function subscribeToProfileUpdates(userId: string, callback: (profile: Profile) => void) {
  const channel = supabase
    .channel(`profile:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Profile)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
```

---

## Error Handling

### Common Error Codes

| Error Code | Description | Example |
|-----------|-------------|---------|
| `PROFILE_NOT_FOUND` | Profile does not exist | Invalid user ID |
| `PROFILE_UNAUTHORIZED` | User not authorized | Viewing another's profile |
| `PROFILE_INVALID_INPUT` | Invalid input data | Invalid email format |
| `PROFILE_ROLE_FORBIDDEN` | Role not allowed | Restaurant trying to access driver data |
| `PROFILE_CANNOT_DEACTIVATE_SELF` | Cannot deactivate own account | Admin self-deactivation |
| `PROFILE_CANNOT_CHANGE_OWN_ROLE` | Cannot change own role | Admin self-role change |
| `PROFILE_UPLOAD_FAILED` | File upload failed | Storage error |

### Error Response Format

```typescript
interface ProfileError {
  code: string
  message: string
  details?: {
    field?: string
    value?: any
    constraint?: string
  }
}
```

---

## Security Considerations

### 1. Row Level Security (RLS)

```sql
-- Users can view own profile
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins view all profiles
CREATE POLICY "Admins view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Restaurants view drivers
CREATE POLICY "Restaurants view drivers"
  ON profiles FOR SELECT
  USING (
    role = 'driver'
    AND is_available = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'restaurant'
    )
  );
```

### 2. Input Validation

```typescript
function validateProfileInput(input: UpdateProfileInput): string | null {
  if (input.email) {
    return 'Email cannot be changed through profile update'
  }

  if (input.phone && !/^\+?[\d\s-()]+$/.test(input.phone)) {
    return 'Invalid phone number format'
  }

  if (input.fullName && input.fullName.length < 2) {
    return 'Name must be at least 2 characters'
  }

  return null // Valid
}
```

---

## Testing Examples

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'
import { validateProfileInput, calculateDistance } from './users'

describe('Profile Validation', () => {
  it('should reject email changes', () => {
    const result = validateProfileInput({ email: 'new@example.com' })
    expect(result).toContain('Email cannot be changed')
  })

  it('should validate phone format', () => {
    expect(validateProfileInput({ phone: '+995555123456' })).toBeNull()
    expect(validateProfileInput({ phone: 'invalid' })).toContain('Invalid phone')
  })
})

describe('Distance Calculation', () => {
  it('should calculate distance correctly', () => {
    const point1 = { lat: 41.7151, lng: 44.8271 } // Tbilisi
    const point2 = { lat: 42.2679, lng: 42.7194 } // Kutaisi
    const distance = calculateDistance(point1, point2)
    expect(distance).toBeCloseTo(192, 0) // ~192 km
  })
})
```

---

**End of Users & Profiles API Documentation**
