# 🚀 Setup New Database Structure in Supabase

## ✅ Quick Start

Since you don't have access to restore the backup, we'll create a fresh database structure using the existing migrations.

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql
   ```

2. Click **"New query"** button

### Step 2: Copy and Paste SQL Script

1. Open the file: `scripts/create-new-database.sql`
2. **Copy the entire contents** (Cmd+A, Cmd+C)
3. **Paste** into the SQL Editor (Cmd+V)

### Step 3: Run the Script

1. Click **"Run"** button or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
2. Wait for execution to complete (should take a few seconds)

### Step 4: Verify Setup

After running, you should see:
- ✅ Success message in the results
- ✅ All tables created in Table Editor
- ✅ No errors in the output

## 🔍 What Gets Created

### 16 Tables:
1. `users` - User authentication and roles
2. `designer_profiles` - Main designer profiles
3. `work_experiences` - Work history
4. `educations` - Education background
5. `skills` - Skills with proficiency
6. `certifications` - Professional certifications
7. `languages` - Language skills
8. `cv_projects` - Portfolio projects
9. `awards_honors` - Awards and honors
10. `publications` - Publications
11. `professional_references` - References
12. `volunteer_experiences` - Volunteer work
13. `projects` - Client projects
14. `offers` - Project offers
15. `evaluations` - Client evaluations
16. `update_requests` - Profile update requests

### Features:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ RLS policies for role-based access (designer, client, admin)
- ✅ Profile completion validation
- ✅ Auto-update triggers for `updated_at` fields
- ✅ Auto-create user record trigger
- ✅ Indexes for performance
- ✅ Foreign key constraints

## ✅ Verification Steps

### 1. Check Tables in Dashboard

Go to: https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/editor

You should see all 16 tables listed.

### 2. Test Database Connection

```bash
cd /Users/tarhaskha/CODEing/HubHub
node scripts/test-db-connection.mjs
```

Expected output:
```
✅ Connection successful!
✅ Table 'designer_profiles': Exists
✅ Table 'skills': Exists
...
```

### 3. Verify RLS is Enabled

Run this in SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

## 🎯 Next Steps

After database setup:

1. **Configure Environment Variables** (if not done):
   ```bash
   # Make sure .env.local has Supabase credentials
   cp .env.example .env.local
   # Then fill in your Supabase URL and keys
   ```

2. **Test the Application**:
   ```bash
   npm run dev
   ```

3. **Test Registration**:
   - Go to `/auth/register`
   - Register a test user
   - Verify user record is created

4. **Test CV Upload**:
   - Go to `/designer/cv-upload`
   - Upload a test CV
   - Verify profile is created

## 🚨 Troubleshooting

### Error: "relation already exists"

**Solution**: Some tables might already exist. The script uses `CREATE TABLE IF NOT EXISTS`, so this is safe to ignore.

### Error: "type already exists"

**Solution**: Custom types might already exist. The script handles this with `DO $$ BEGIN ... EXCEPTION` blocks.

### Error: "permission denied"

**Solution**: Make sure you're running the script in SQL Editor (not through API). SQL Editor has full permissions.

### Tables not showing in Table Editor

**Solution**: 
1. Refresh the page
2. Check if you're in the correct project
3. Verify the script ran without errors

## 📝 Notes

- The script is **idempotent** - you can run it multiple times safely
- It uses `IF NOT EXISTS` and `DROP IF EXISTS` to avoid conflicts
- All RLS policies are created fresh (old ones are dropped first)
- The script creates a trigger to auto-create user records when someone registers

## 🔗 Useful Links

- [Supabase SQL Editor](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/sql)
- [Table Editor](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/editor)
- [API Settings](https://supabase.com/dashboard/project/dgoldafbrkemdprtezxo/settings/api)

---

**Ready to go! 🚀**
