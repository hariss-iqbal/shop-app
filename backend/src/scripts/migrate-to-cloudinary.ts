/**
 * Migration Script: Migrate Product Images from Supabase Storage to Cloudinary
 *
 * This script implements Option B migration strategy:
 * - Downloads all existing images from Supabase Storage
 * - Uploads them to Cloudinary
 * - Updates the database with new Cloudinary URLs and public IDs
 *
 * Prerequisites:
 * 1. Cloudinary account with upload preset configured
 * 2. Cloudinary credentials in .env file
 * 3. Run after applying the 20260131000019_cloudinary_integration.sql migration
 *
 * Usage:
 * - npm run migrate:cloudinary
 * - Or: ts-node src/scripts/migrate-to-cloudinary.ts
 *
 * Rollback:
 * - If migration fails, restore database from backup
 * - Images in Cloudinary can be deleted manually or kept
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import fetch from 'node-fetch';

interface Environment {
  supabaseUrl: string;
  supabaseServiceKey: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
}

// Load environment variables
function loadEnv(): Environment {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });

    return {
      supabaseUrl: env.SUPABASE_URL || '',
      supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
      cloudinaryCloudName: env.CLOUDINARY_CLOUD_NAME || '',
      cloudinaryUploadPreset: env.CLOUDINARY_UPLOAD_PRESET || '',
      cloudinaryApiKey: env.CLOUDINARY_API_KEY,
      cloudinaryApiSecret: env.CLOUDINARY_API_SECRET
    };
  }

  throw new Error('.env file not found');
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

class CloudinaryMigrationService {
  private supabase: any;
  private env: Environment;
  private readonly cloudinaryUploadUrl: string;
  private readonly downloadDir = './temp_uploads';

  constructor() {
    this.env = loadEnv();

    if (!this.env.supabaseUrl || !this.env.supabaseServiceKey) {
      throw new Error('Supabase credentials not found in .env');
    }
    if (!this.env.cloudinaryCloudName || !this.env.cloudinaryUploadPreset) {
      throw new Error('Cloudinary credentials not found in .env');
    }

    this.supabase = createClient(this.env.supabaseUrl, this.env.supabaseServiceKey, {
      auth: { persistSession: false }
    });

    this.cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${this.env.cloudinaryCloudName}/image/upload`;

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * Main migration function
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting Cloudinary migration...\n');

    try {
      // Step 1: Fetch all phone images from database
      const images = await this.fetchAllProductImages();
      console.log(`📦 Found ${images.length} images to migrate\n`);

      if (images.length === 0) {
        console.log('✨ No images to migrate. Exiting.');
        return;
      }

      // Step 2: Migrate each image
      const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [] as Array<{ image: ProductImage; error: string }>
      };

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const progress = `[${i + 1}/${images.length}]`;

        try {
          console.log(`${progress} Processing: ${image.storage_path}`);

          // Check if already migrated (has public_id)
          if (image.storage_path === '' || this.isCloudinaryUrl(image.image_url)) {
            console.log(`${progress} ⏭️  Skipped (already migrated)\n`);
            results.skipped++;
            continue;
          }

          // Download from Supabase Storage
          const filePath = await this.downloadFromSupabase(image.storage_path);

          // Upload to Cloudinary
          const cloudinaryResult = await this.uploadToCloudinary(filePath, image.product_id);

          // Update database
          await this.updateImageRecord(image.id, cloudinaryResult);

          // Clean up temp file
          fs.unlinkSync(filePath);

          console.log(`${progress} ✅ Migrated successfully\n`);
          results.success++;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`${progress} ❌ Failed: ${errorMessage}\n`);
          results.failed++;
          results.errors.push({ image, error: errorMessage });
        }
      }

      // Step 3: Print summary
      this.printSummary(results);

      // Step 4: Clean up temp directory
      this.cleanup();

      if (results.failed > 0) {
        console.log('\n⚠️  Some images failed to migrate. Check the errors above.');
        process.exit(1);
      }

      console.log('\n✨ Migration completed successfully!');

    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Fetch all phone images from database
   */
  private async fetchAllProductImages(): Promise<ProductImage[]> {
    const { data, error } = await this.supabase
      .from('product_images')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch phone images: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Download an image from Supabase Storage
   */
  private async downloadFromSupabase(storagePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('phone-images')
      .download(storagePath);

    if (error) {
      throw new Error(`Failed to download from Supabase: ${error.message}`);
    }

    // Create temp file
    const fileName = path.basename(storagePath);
    const filePath = path.join(this.downloadDir, fileName);

    // Convert Blob to buffer and save
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    return filePath;
  }

  /**
   * Upload an image to Cloudinary
   */
  private async uploadToCloudinary(filePath: string, productId: string): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('upload_preset', this.env.cloudinaryUploadPreset);
    formData.append('folder', `product-images/${productId}`);

    const response = await fetch(this.cloudinaryUploadUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders() as Record<string, string>
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as CloudinaryUploadResult;
    return data;
  }

  /**
   * Update the image record in the database
   */
  private async updateImageRecord(imageId: string, cloudinaryResult: CloudinaryUploadResult): Promise<void> {
    const { error } = await this.supabase
      .from('product_images')
      .update({
        image_url: cloudinaryResult.secure_url,
        storage_path: '', // Empty for Cloudinary images
        public_id: cloudinaryResult.public_id
      })
      .eq('id', imageId);

    if (error) {
      throw new Error(`Failed to update database: ${error.message}`);
    }
  }

  /**
   * Check if a URL is a Cloudinary URL
   */
  private isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }

  /**
   * Print migration summary
   */
  private printSummary(results: {
    success: number;
    failed: number;
    skipped: number;
    errors: Array<{ image: ProductImage; error: string }>;
  }): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${results.success}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📦 Total processed: ${results.success + results.failed + results.skipped}`);
    console.log('='.repeat(50));

    if (results.errors.length > 0) {
      console.log('\n❌ Failed Images:');
      results.errors.forEach(({ image, error }) => {
        console.log(`  - ${image.storage_path}: ${error}`);
      });
    }
  }

  /**
   * Clean up temporary files
   */
  private cleanup(): void {
    if (fs.existsSync(this.downloadDir)) {
      fs.rmSync(this.downloadDir, { recursive: true, force: true });
    }
  }

  /**
   * Delete all migrated images from Supabase Storage
   * Run this after successful migration if you want to free up space
   */
  async cleanupSupabaseStorage(): Promise<void> {
    console.log('🧹 Cleaning up Supabase Storage...\n');

    try {
      // Fetch all images with non-empty storage_path (legacy Supabase images)
      const { data: images, error } = await this.supabase
        .from('product_images')
        .select('storage_path')
        .not('storage_path', 'is', null)
        .not('storage_path', 'eq', '');

      if (error) {
        throw new Error(`Failed to fetch images for cleanup: ${error.message}`);
      }

      if (!images || images.length === 0) {
        console.log('✨ No Supabase Storage images to clean up.');
        return;
      }

      const storagePaths = images.map((img: any) => img.storage_path);

      // Delete from Supabase Storage in batches (max 100 at a time)
      const batchSize = 100;
      for (let i = 0; i < storagePaths.length; i += batchSize) {
        const batch = storagePaths.slice(i, i + batchSize);
        const { error: deleteError } = await this.supabase.storage
          .from('phone-images')
          .remove(batch);

        if (deleteError) {
          console.warn(`⚠️  Batch ${Math.floor(i / batchSize) + 1} cleanup failed: ${deleteError.message}`);
        } else {
          console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} deleted (${batch.length} files)`);
        }
      }

      console.log('\n✨ Supabase Storage cleanup completed!');

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  }
}

// Run migration
async function main() {
  const service = new CloudinaryMigrationService();

  const command = process.argv[2];

  if (command === 'cleanup') {
    await service.cleanupSupabaseStorage();
  } else {
    await service.migrate();
  }
}

main().catch(console.error);
