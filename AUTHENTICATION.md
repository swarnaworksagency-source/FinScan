# Authentication System

This application uses a **SIMPLE** authentication system powered entirely by Supabase Auth.

## Architecture

**ONE TABLE:** `user_profiles` (stores role and user info)
**ONE AUTH SYSTEM:** Supabase Auth (handles ALL passwords)
**ONE CHECK:** `user_profiles.role` determines admin vs user

## Authentication Methods

### 1. Google OAuth (For Regular Users)

**For:** Investors and general users

**How it works:**
1. Click "Continue with Google"
2. Google OAuth flow
3. Auto-create profile in `user_profiles` with role = 'user'
4. Redirect to `/dashboard`

**Database:**
- `auth.users` (managed by Supabase)
- `user_profiles` (role: 'user', auth_method: 'google')

### 2. Email/Password (For Admins)

**For:** System administrators

**How it works:**
1. Enter email and password
2. Supabase Auth validates credentials
3. Check `user_profiles.role`
4. If role = 'admin', redirect to `/admin`
5. If role = 'user', redirect to `/dashboard`

**Database:**
- `auth.users` (managed by Supabase)
- `user_profiles` (role: 'admin', auth_method: 'email')

## Admin Credentials

```
Email:    admin@fraud.com
Password: @Min1234
```

## Login Code (Simple!)

```typescript
import { supabase } from './supabase';

// Login function
const { data: authData, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Check role
const { data: profile } = await supabase
  .from('user_profiles')
  .select('role')
  .eq('id', authData.user.id)
  .maybeSingle();

// Route based on role
if (profile.role === 'admin') {
  navigate('/admin');
} else {
  navigate('/dashboard');
}
```

## Database Schema

### user_profiles

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (foreign key to auth.users.id) |
| email | text | User email |
| display_name | text | Display name |
| **role** | text | **'admin' or 'user'** |
| auth_method | text | 'google' or 'email' |
| usage_limit | integer | Usage limit (NULL for admin = unlimited) |
| usage_count | integer | Current usage count |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Update timestamp |

## Key Features

✅ **Simple:** One auth system, one role check
✅ **Secure:** Supabase handles all password hashing
✅ **Clean:** No duplicate password storage
✅ **Maintainable:** Standard Supabase Auth patterns

## NO MORE:

❌ NO admin_credentials table
❌ NO custom password hashing
❌ NO account locking logic
❌ NO password sync issues
❌ NO complex SSO flow

## Password Management

**For Users:**
- Managed by Google OAuth (no password needed)

**For Admins:**
- Managed by Supabase Auth
- Change password: Use Supabase dashboard or Auth API
- Reset password: Use Supabase password reset flow

## Creating New Admin

```sql
-- 1. Create user in Supabase Auth
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  role
) VALUES (
  gen_random_uuid(),
  'newadmin@example.com',
  crypt('SecurePassword123!', gen_salt('bf')),
  now(),
  'authenticated'
);

-- 2. Create profile with admin role
INSERT INTO user_profiles (
  id,
  email,
  display_name,
  role,
  auth_method,
  usage_limit
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'newadmin@example.com'),
  'newadmin@example.com',
  'New Admin',
  'admin',
  'email',
  NULL
);
```

## Login Flow Diagram

```
User enters credentials
         ↓
supabase.auth.signInWithPassword()
         ↓
   Success? ──No──→ Show error
         ↓ Yes
Get role from user_profiles
         ↓
role === 'admin'? ──Yes──→ /admin
         ↓ No
      /dashboard
```

## Troubleshooting

### "Invalid email or password"
- Verify email exists in `auth.users`
- Verify password is correct
- Check `email_confirmed_at` is not NULL

### User not routing to admin
- Check `user_profiles.role` = 'admin'
- Verify `user_profiles.id` matches `auth.users.id`

### Google OAuth not working
- Check Google OAuth configured in Supabase dashboard
- Verify redirect URLs
- Ensure callback handler exists at `/auth/callback`

## Security

- All passwords hashed with bcrypt by Supabase
- Row Level Security (RLS) enabled on `user_profiles`
- Role-based access control (RBAC) via `user_profiles.role`
- No sensitive data in client-side code
- Secure session management by Supabase

## Migration Notes

If upgrading from old system:
- ✅ Dropped `admin_credentials` table
- ✅ Dropped custom password functions
- ✅ Removed account locking logic
- ✅ Simplified to native Supabase Auth
- ✅ All passwords now in `auth.users` only
