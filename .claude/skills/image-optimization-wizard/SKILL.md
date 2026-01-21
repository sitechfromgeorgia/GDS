## SKILL 15: Image Optimization Wizard

### Metadata
- **Name:** Image Optimization Wizard
- **Category:** Performance & Media
- **Priority:** P2 (UX & Bandwidth)
- **Domain:** Next/Image, Supabase Storage, WebP/AVIF, CDN
- **Owner Role:** Frontend Engineer
- **Complexity:** Low-Medium
- **Skills Required:** Image formats, Responsive loading, CDN caching

### Mission
Deliver visually stunning, high-performance images. Automatically optimize product photos, user avatars, and UI assets. Serve modern formats (WebP/AVIF) sized correctly for the device. Manage raw uploads to Supabase Storage and transformations.

### Key Directives

1. **Delivery Strategy**
   - Use `next/image` (`<Image />`) for all static and CMS images
   - Props: `sizes` (responsive breakdown), `priority` (for LCP images), `placeholder="blur"`
   - Loader: Use Supabase Image Transformation (or default Next.js loader)
   - Do NOT use standard `<img>` tag unless absolutely necessary (e.g., SVG icons)

2. **Storage Architecture**
   - Buckets: `products`, `avatars`, `documents`
   - Path structure: `{bucket}/{userId}/{timestamp}-{filename}`
   - RLS: Public read (usually), Authenticated write
   - Upload: Client-side upload using Supabase JS SDK (not passing through Next.js server) to save bandwidth

3. **Optimization Pipeline**
   - Upload: Resize/compress on client before upload using `browser-image-compression` (max 2MB)
   - Serving: Request specific width/quality via URL params (if supported) or rely on `<Image>` optimization
   - Format: Prefer AVIF > WebP > JPG/PNG

4. **UX & Loading States**
   - Show skeleton or blurred hash while loading
   - Prevent layout shift (CLS): Always define aspect ratio or width/height
   - Fallback: Default avatar or "No Image" placeholder on error

### Workflows

**Workflow: Next.js Image Component**
```typescript
// components/ui/ProductImage.tsx
import Image from 'next/image';

// Use a loader if using external CDN (Supabase) to optimize requests
const supabaseLoader = ({ src, width, quality }) => {
  return `${src}?width=${width}&quality=${quality || 75}&format=origin`;
  // Or Supabase Transformation: 
  // return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/${src}?width=${width}...`
};

export function ProductImage({ url, alt }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
      <Image
        src={url}
        alt={alt}
        fill
        className="object-cover transition-transform hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={false} // true if hero image
      />
    </div>
  );
}
```

**Workflow: Client-Side Compression & Upload**
```typescript
// app/settings/AvatarUpload.tsx
'use client';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';

async function handleUpload(file: File) {
  // 1. Compress
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };
  const compressedFile = await imageCompression(file, options);

  // 2. Upload to Supabase
  const supabase = createClient();
  const filename = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase
    .storage
    .from('avatars')
    .upload(filename, compressedFile);

  if (error) throw error;
  
  // 3. Get Public URL
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filename);
  return publicUrl;
}
```

### Tooling

**Core**
- `next/image`
- Supabase Storage

**Utilities**
- `browser-image-compression` (NPM)
- `blurhash` (optional) for fancy placeholders

**Monitoring**
- Lighthouse Performance score (LCP)
- Bandwidth usage in Supabase dashboard
