# Cloudinary Integration Setup Guide

This guide covers the setup and usage of Cloudinary for image storage in the Phone Shop application.

## Overview

The Phone Shop app now uses **Cloudinary** for image storage while keeping **Supabase** for database and authentication. This hybrid approach provides:

- **25GB/month free bandwidth** (Cloudinary) vs 1GB (Supabase)
- Built-in image optimization and transformations
- CDN delivery for faster image loading
- WebP format support with automatic fallback

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Angular)                       │
├─────────────────────────────────────────────────────────────┤
│  CloudinaryService     │  PhoneImageService  │ ImageOptimization
│  - uploadImage()       │  - uploadImage()    │  - getCardImageUrl()
│  - deleteImage()       │  - deleteImage()    │  - getDetailImageUrl()
│  - getTransformedUrl() │  - getImagesByPhoneId()│  - getSrcSet()
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Services                              │
├─────────────────────────────────────────────────────────────┤
│  Cloudinary (Image Storage)    │    Supabase (Database)     │
│  - Upload/Download             │    - phone_images table    │
│  - Transformations             │    - public_id column      │
│  - CDN Delivery                │    - image_url column      │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Cloudinary Account Setup

### 1.1 Create Cloudinary Account

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier)
2. Navigate to Dashboard → Settings
3. Note your **Cloud Name** from the dashboard

### 1.2 Create Upload Preset (Unsigned)

1. Go to Settings → Upload
2. Click "Add upload preset"
3. Configure:
   - **Preset Name**: e.g., `phone-shop-unsigned`
   - **Signing Mode**: Unsigned
   - **Folder**: `phone-images`
   - **Incoming Transformation** (optional):
     - Format: WebP
     - Quality: Auto
     - Resize: Limit max width to 2000px
4. Save and note the **Upload Preset Name**

## Phase 2: Environment Configuration

### 2.1 Frontend Configuration

Update environment files with your Cloudinary credentials:

**frontend/src/environments/environment.ts** (Development):
```typescript
cloudinary: {
  cloudName: 'your-cloudinary-cloud-name',
  uploadPreset: 'your-unsigned-upload-preset'
}
```

**frontend/src/environments/environment.prod.ts** (Production):
```typescript
cloudinary: {
  cloudName: 'your-cloudinary-cloud-name',
  uploadPreset: 'your-unsigned-upload-preset'
}
```

### 2.2 Backend Configuration

Create/update `backend/.env`:

```bash
# Supabase (existing)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary (new)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
# Optional: For server-side deletion (requires API secret)
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Phase 3: Database Migration

### 3.1 Apply Schema Changes

Run the Cloudinary integration migration:

```bash
# From backend directory
cd backend
supabase migration up
```

Or manually apply:
```sql
-- File: 20260131000019_cloudinary_integration.sql
ALTER TABLE phone_images ADD COLUMN public_id TEXT;
CREATE INDEX idx_phone_images_public_id ON phone_images(public_id);
ALTER TABLE phone_images ALTER COLUMN storage_path DROP NOT NULL;
```

### 3.2 Migrate Existing Images (Option B)

If you have existing images in Supabase Storage and want to migrate them to Cloudinary:

```bash
# From backend directory
npm install
npm run migrate:cloudinary
```

This will:
1. Download all images from Supabase Storage
2. Upload them to Cloudinary
3. Update database with new Cloudinary URLs and public IDs

### 3.3 Clean Up Supabase Storage (Optional)

After successful migration, free up space by removing old images:

```bash
npm run migrate:cloudinary:cleanup
```

## Phase 4: Install Dependencies

### Frontend
```bash
cd frontend
npm install
# No additional Cloudinary SDK needed - using fetch API
```

### Backend
```bash
cd backend
npm install
```

## Usage

### Uploading Images

The `PhoneImageService` now automatically uses Cloudinary:

```typescript
constructor(private phoneImageService: PhoneImageService) {}

async uploadPhoneImage(phoneId: string, file: File) {
  const image = await this.phoneImageService.uploadImage(
    phoneId,
    file,
    (progress) => {
      console.log(`${progress.fileName}: ${progress.progress}%`);
    }
  );
  return image;
}
```

### Displaying Optimized Images

The `ImageOptimizationService` automatically detects Cloudinary URLs and applies transformations:

```typescript
constructor(private imageOptimization: ImageOptimizationService) {}

// Card view (300x200, WebP)
const cardUrl = this.imageOptimization.getCardImageUrl(image.publicId || image.imageUrl);

// Detail view (800px wide, WebP)
const detailUrl = this.imageOptimization.getDetailImageUrl(image.publicId || image.imageUrl);

// With srcset for responsive images
const srcset = this.imageOptimization.getCardSrcSet(image.publicId || image.imageUrl);
```

### Deleting Images

```typescript
await this.phoneImageService.deleteImage(imageId);
```

**Note**: Client-side deletion currently only removes the database record. To delete from Cloudinary, implement a backend endpoint using the Cloudinary Admin API.

## Cloudinary URL Format

Cloudinary transformations are applied via URL parameters:

```
https://res.cloudinary.com/<cloud_name>/image/upload/
  c_fill,w_300,h_200,q_80,f_webp/<public_id>
```

Parameters:
- `c_fill` - Crop mode (fill)
- `w_300` - Width 300px
- `h_200` - Height 200px
- `q_80` - Quality 80%
- `f_webp` - Format WebP

## Verification Steps

### 1. Test Upload
- Create a new phone record
- Upload an image via PhoneImageUploadComponent
- Verify image appears in Cloudinary dashboard under `phone-images/<phoneId>/`

### 2. Test Display
- Check images load correctly in:
  - Card view (catalog)
  - List view
  - Detail view
- Verify WebP format is used (check browser DevTools Network tab)

### 3. Test Deletion
- Delete an image record
- Verify database record is removed
- Note: Files remain in Cloudinary until backend deletion is implemented

### 4. Test Reordering
- Drag to reorder images
- Verify `display_order` updates in database

## Migration Script Details

The migration script (`migrate-to-cloudinary.ts`) performs:

1. **Fetch all images**: Queries `phone_images` table
2. **Download each image**: From Supabase Storage
3. **Upload to Cloudinary**: With proper folder structure
4. **Update database**: Sets `image_url`, `public_id`, clears `storage_path`
5. **Cleanup**: Removes temporary files

### Migration Output

```
🚀 Starting Cloudinary migration...

📦 Found 25 images to migrate

[1/25] Processing: abc123/image1.jpg
[1/25] ✅ Migrated successfully

[2/25] Processing: abc123/image2.jpg
[2/25] ✅ Migrated successfully

...

==================================================
📊 MIGRATION SUMMARY
==================================================
✅ Successfully migrated: 25
⏭️  Skipped: 0
❌ Failed: 0
📦 Total processed: 25
==================================================

✨ Migration completed successfully!
```

## Troubleshooting

### Upload fails with "Invalid preset"
- Verify `CLOUDINARY_UPLOAD_PRESET` in environment files
- Check upload preset exists in Cloudinary dashboard
- Ensure preset is set to "Unsigned" mode

### Images not displaying
- Check browser console for errors
- Verify `cloudName` is correct
- Check image `public_id` is stored in database

### Transformation URLs not working
- Verify URL format: `res.cloudinary.com/<cloud_name>/image/upload/...`
- Check for special characters in `public_id`

### Migration script fails
- Verify `.env` file exists with correct credentials
- Check Supabase service role key has storage permissions
- Ensure sufficient disk space for temporary downloads

## API Reference

### CloudinaryService

```typescript
uploadImage(file: File, folder?: string, onProgress?: (progress) => void): Promise<CloudinaryUploadResult>
deleteImage(publicId: string): Promise<void>  // Requires backend
getTransformedUrl(publicId: string, options: TransformOptions): string
getCardImageUrl(publicId: string): string
getDetailImageUrl(publicId: string): string
getCardSrcSet(publicId: string): string
getDetailSrcSet(publicId: string): string
isCloudinaryUrl(url: string): boolean
getPublicIdFromUrl(url: string): string | null
```

### TransformOptions

```typescript
interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  crop?: 'fill' | 'fit' | 'crop' | 'scale' | 'limit' | 'pad' | 'thumb';
  fetchFormat?: boolean;
}
```

## Security Notes

1. **Upload Preset**: Uses unsigned preset for client-side uploads. Configure allowed formats and file size limits in Cloudinary dashboard.

2. **API Secret**: Never include Cloudinary API secret in frontend code. Use backend for deletion operations.

3. **RLS Policies**: Database RLS policies remain unchanged. Images are publicly accessible via Cloudinary CDN URLs.

## Future Enhancements

- [ ] Backend endpoint for secure image deletion
- [ ] Automatic format detection (AVIF support)
- [ ] Lazy loading with blur placeholders
- [ ] Video upload support
- [ ] Image moderation/content filtering
