# Supabase Configuration Guide

This guide will help you configure the Supabase database to resolve the "Supabase not configured, using mock buildings" warning and enable real data integration.

## 🚀 Quick Setup Steps

### 1. Get Supabase Credentials

1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Log into your account (create one if you don't have it)
3. Select your project, or create a new project
4. Go to **Settings** → **API**
5. Copy the following information:
   - **Project URL** (format: `https://your-project-id.supabase.co`)
   - **anon public key** (long string starting with `eyJ`)

### 2. Configure Environment Variables

1. In the `admin-page` folder, find the `.env.local` file
2. Update the following lines:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**Example:**
```env
VITE_SUPABASE_URL=https://eesdbstrjxilpirozhjg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlc2Ric3RyanhpbHBpcm96aGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NzkxNjQsImV4cCI6MjA2ODQ1NTE2NH0.pQKbSBfMOnCp_x9_W2pjBkV85O3VJeMEwRI5bkqFvsI
```

### 3. Set Up Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy and run the following SQL script:

```sql
-- Create Buildings table
CREATE TABLE IF NOT EXISTS Buildings (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  ShortName VARCHAR(10) NOT NULL UNIQUE,
  Address TEXT,
  website VARCHAR(255),
  contacts JSONB,
  available BOOLEAN DEFAULT true,
  libcal_id INTEGER,
  lid INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create Rooms table
CREATE TABLE IF NOT EXISTS Rooms (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES Buildings(id) ON DELETE CASCADE,
  eid INTEGER NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(255),
  grouping VARCHAR(100),
  capacity INTEGER DEFAULT 6,
  gtype INTEGER,
  gBookingSelectableTime BOOLEAN DEFAULT true,
  hasInfo BOOLEAN DEFAULT false,
  thumbnail VARCHAR(255),
  filterIds INTEGER[],
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_building_id ON Rooms(building_id);
CREATE INDEX IF NOT EXISTS idx_rooms_eid ON Rooms(eid);
CREATE INDEX IF NOT EXISTS idx_buildings_lid ON Buildings(lid);
CREATE INDEX IF NOT EXISTS idx_buildings_shortname ON Buildings(ShortName);

-- Insert sample building data
INSERT INTO Buildings (Name, ShortName, Address, lid, libcal_id) VALUES
  ('Mugar Memorial Library', 'mug', '771 Commonwealth Avenue, Boston, MA 02215', 19336, 19336),
  ('Pardee Library', 'par', '771 Commonwealth Avenue, Boston, MA 02215', 19818, 19818),
  ('Pickering Educational Resources Library', 'pic', '2 Silber Way, Boston, MA 02215', 18359, 18359),
  ('Science & Engineering Library', 'sci', '38 Cummington Mall, Boston, MA 02215', 20177, 20177)
ON CONFLICT (ShortName) DO UPDATE SET
  Name = EXCLUDED.Name,
  Address = EXCLUDED.Address,
  lid = EXCLUDED.lid,
  libcal_id = EXCLUDED.libcal_id,
  updated_at = TIMEZONE('utc', NOW());
```

### 4. Restart Development Server

1. Stop the current development server in terminal (Ctrl+C)
2. Restart the server:

```bash
npm run dev
```

### 5. Verify Configuration

Check the development server console and browser console for connection status:

```bash
# Start development server
npm run dev
```

Visit http://localhost:3005 and verify:
- Connection Status component should show active connections
- Console should not display "Supabase not configured" messages
- Pages should load real data or display skeleton loading states

## 🔧 Troubleshooting

### Issue 1: Still showing "Supabase not configured"

**Solution:**
1. Ensure `.env.local` file is in the correct location (`admin-page` folder root)
2. Check environment variable names are correct (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
3. Restart development server

### Issue 2: Database connection errors

**Solution:**
1. Verify Supabase project URL and key are correct
2. Ensure Supabase project is active and healthy
3. Check network connectivity

### Issue 3: Table does not exist errors

**Solution:**
1. Ensure you've run the table creation script in Supabase SQL Editor
2. Check table name casing (`Buildings` and `Rooms`)
3. Verify table permissions

### Issue 4: Permission errors

**Solution:**
1. In Supabase Dashboard, go to **Authentication** → **Policies**
2. Ensure Row Level Security is enabled for Buildings and Rooms tables
3. Add appropriate policies to allow read access

## 📊 Verify Data

After successful configuration, you should see:

1. **LocationsPage**: Displays 4 buildings (mug, par, pic, sci)
2. **BookingsPage**: No longer shows mock data warnings
3. **DashboardPage**: Shows real statistical data

## 🔄 Sync bu-book Configuration

To ensure data consistency, also configure the same Supabase credentials for the bu-book project:

1. Update `.env.local` file in the `bu-book` folder
2. Use the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values

## 📝 Configuration Checklist

- [ ] Get Supabase project credentials
- [ ] Update `admin-page/.env.local` file
- [ ] Run database setup SQL in Supabase
- [ ] Restart development server
- [ ] Verify BookingsPage no longer shows mock data warnings
- [ ] Check LocationsPage displays real building data
- [ ] (Optional) Configure same credentials for bu-book

## 🎉 Complete!

After configuration, your admin-page will be able to:
- Read real building and room data from Supabase database
- Share the same data source with bu-book and bub-backend
- Display consistent statistics and room availability

If you encounter any issues, check browser console for error messages or refer to the troubleshooting section above.

## 🔐 Security Note

**Important**: Never commit `.env.local` files to version control. These files contain sensitive credentials and should be kept private. Always use environment variables for sensitive configuration in production deployments.
