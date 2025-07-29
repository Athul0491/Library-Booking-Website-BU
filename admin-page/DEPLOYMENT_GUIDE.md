# Admin Page Deployment Guide

## 🎯 Overview

The admin-page has been successfully migrated to use Supabase directly, eliminating the need for the Python backend server. This guide will help you deploy the admin dashboard.

## 📋 Prerequisites

1. **Supabase Project**: You need a Supabase project set up
2. **Environment Variables**: Supabase URL and anonymous key
3. **Database Schema**: Deploy the database schema to Supabase

## 🚀 Quick Deployment Steps

### 1. Set Up Supabase Project

Follow the main `SUPABASE_MIGRATION_GUIDE.md` to:
- Create Supabase project
- Deploy database schema
- Configure security policies

### 2. Configure Environment Variables

Create `.env` file in `admin-page/` directory:

```bash
# Copy from .env.example and fill in your values
cp .env.example .env
```

Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_DEBUG=false
VITE_APP_NAME=BU Library Admin Dashboard
VITE_APP_VERSION=2.0.0
```

### 3. Install Dependencies & Build

```bash
cd admin-page
npm install
npm run build
```

### 4. Deploy to Static Hosting

The admin-page is now a static React application that can be deployed to:

- **Vercel**: 
  ```bash
  npm install -g vercel
  vercel --prod
  ```

- **Netlify**:
  - Drag `dist/` folder to Netlify dashboard
  - Or connect GitHub repository

- **GitHub Pages**:
  - Push `dist/` contents to `gh-pages` branch

- **Any Static Host**:
  - Upload `dist/` folder contents

### 5. Configure Environment Variables in Hosting

For production deployment, set environment variables in your hosting provider:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🧪 Testing the Deployment

1. **Test Connection**:
   ```bash
   npm run dev
   ```
   Navigate to dashboard and check connection status

2. **Validate API Calls**:
   ```bash
   node test/test-supabase-migration.js
   ```

3. **Check Browser Console**:
   - No backend URL errors
   - Supabase connection successful
   - API calls working

## 🔧 Troubleshooting

### Common Issues:

1. **Environment Variables Not Loaded**:
   - Ensure `.env` file is in correct location
   - Check variable names start with `VITE_`
   - Restart development server

2. **Supabase Connection Failed**:
   - Verify URL and key are correct
   - Check Supabase project is active
   - Verify database schema is deployed

3. **API Calls Failing**:
   - Check browser network tab for errors
   - Verify RLS policies are configured
   - Check database tables exist

### Debug Mode:

Set `VITE_DEBUG=true` to enable detailed console logging.

## 📊 Monitoring

The admin dashboard includes built-in monitoring:
- Connection status indicator
- API response times
- Error tracking and reporting

## 🔄 Rollback Plan

If needed, you can temporarily revert to the old backend by:
1. Switching to a previous git commit
2. Starting the Python backend server
3. Using `VITE_BACKEND_URL` environment variable

## 📝 Notes

- The old `bub-backend` Python server is no longer needed
- All functionality has been migrated to direct Supabase calls
- The API interface remains the same for frontend compatibility
- This is a serverless deployment - no backend infrastructure needed

## 🎉 Next Steps

1. Deploy database schema to Supabase
2. Set up production environment variables
3. Deploy to your preferred hosting provider
4. Configure domain and SSL if needed
5. Set up monitoring and analytics
