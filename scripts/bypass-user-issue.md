# Bypass User Creation Issues

Since the database RLS policies are preventing manual user creation, let's use the app's registration flow instead:

## Quick Solution: Use Registration

1. **Go to**: http://localhost:3001/auth/register
2. **Fill in registration form**:
   - Email: `test-designer@example.com`
   - Password: `TestPassword123!`
   - Role: **Designer** (select from dropdown)
3. **Click Register**
4. **Login with those credentials**
5. **Test the CV upload and database saving**

## Why This Works

The registration flow:
- Creates the auth user properly
- Automatically creates the users table entry
- Handles all the RLS policies correctly
- Sets up proper authentication cookies

## Test Database Saving

After registering and logging in:
1. Go to: http://localhost:3001/designer/cv-upload
2. Upload your test CV
3. Look for the "Save to Database" button
4. Click it and check for success message
5. Verify data in Supabase dashboard

This bypasses all the manual user creation issues and tests the actual user flow.


