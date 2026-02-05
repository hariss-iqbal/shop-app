# Production Deployment Guide

## Prerequisites
- ✅ Database migrations already applied to production
- ✅ Frontend deployed on Vercel: https://shop-app-phi-wine.vercel.app
- ✅ Supabase backend: https://dgatqyxfpvocoyinpshg.supabase.co

## Backend API Server Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Note the deployment URL** (e.g., `https://shop-app-api.vercel.app`)

4. **Update Frontend Environment:**
   - Edit `frontend/src/environments/environment.prod.ts`
   - Update `apiServer.url` to your Vercel deployment URL
   - Rebuild and redeploy frontend

### Option 2: Deploy to Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   cd backend
   railway up
   ```

3. **Get the deployment URL and update frontend environment**

## Frontend Deployment

1. **Update API Server URL in production environment:**
   ```typescript
   // frontend/src/environments/environment.prod.ts
   apiServer: {
     url: 'https://your-actual-api-server-url.vercel.app'
   }
   ```

2. **Build for production:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

## Post-Deployment Verification

### 1. Check API Server Health
```bash
curl https://your-api-server-url.vercel.app/health
```
Expected response: `{"status":"ok","service":"phone-specs-api"}`

### 2. Check Database Migrations
```bash
cd backend
supabase migration list --linked
```

Verify these migrations are applied:
- ✅ 20260207000001_condition_and_pta_changes.sql
- ✅ 20260207000002_condition_pta_columns.sql

### 3. Test User Creation

1. Go to Supabase Studio: https://supabase.com/dashboard/project/dgatqyxfpvocoyinpshg/auth/users
2. Create a test user
3. First user should automatically become admin
4. Verify in user_roles table

### 4. Test Phone Specs Fetch

1. Go to: https://shop-app-phi-wine.vercel.app/admin/inventory/new
2. Enter brand and model
3. Click "Fetch Info" button
4. Should load specs from GSMArena

## Troubleshooting

### API Server Issues
- Check Vercel logs: `vercel logs`
- Verify CORS is enabled
- Check API server is accessible from frontend domain

### Database Issues
- Verify RLS policies are correct
- Check user_roles table has service_role policy
- Verify trigger function has `SET search_path = public`

### Migration Issues
If migrations need to be applied:
```bash
supabase db push --linked
```

**⚠️ IMPORTANT:** Never use `supabase db reset` on production!

## Environment Variables

### Backend (Vercel)
No environment variables needed - API server is stateless

### Frontend (Vercel)
All configuration is in `environment.prod.ts`

## URLs Summary

| Service | URL |
|---------|-----|
| Frontend | https://shop-app-phi-wine.vercel.app |
| Supabase | https://dgatqyxfpvocoyinpshg.supabase.co |
| API Server | https://shop-app-api.vercel.app (after deployment) |
| Supabase Studio | https://supabase.com/dashboard/project/dgatqyxfpvocoyinpshg |
