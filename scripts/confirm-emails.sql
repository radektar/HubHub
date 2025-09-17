-- MANUAL EMAIL CONFIRMATION BYPASS
-- Execute this in Supabase SQL Editor to confirm all user emails

-- Update all users to have confirmed emails
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Also update the confirmation token to prevent issues
UPDATE auth.users 
SET confirmation_token = NULL,
    recovery_token = NULL
WHERE email_confirmed_at IS NOT NULL;

SELECT 'All user emails have been manually confirmed!' as status;


