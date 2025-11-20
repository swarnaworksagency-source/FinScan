# Authentication Methods

This application supports two distinct authentication methods:

## 1. Google OAuth (For Regular Users)

**Purpose:** For investors and general users who want to analyze financial statements.

**How it works:**
- Users click "Continue with Google" button
- Redirected to Google OAuth consent screen
- Upon approval, redirected back to application
- User profile created automatically in `user_profiles` table
- Auth method: `google`

**Database Tables:**
- `auth.users` (Supabase managed)
- `user_profiles` (application managed)

**Features:**
- Usage limits (configurable per user)
- Usage count tracking
- Automatic profile creation
- No password management needed

**User Flow:**
1. Click "Continue with Google"
2. Authenticate with Google account
3. Redirect to `/dashboard`
4. Start analyzing financial statements

## 2. SSO (For Administrators)

**Purpose:** For system administrators who manage the platform.

**How it works:**
- Admin enters email and password in "Admin Login (SSO)" section
- Password verified against `admin_credentials` table
- If valid, sign in to Supabase Auth using same password
- Mandatory password change on first login
- Redirect to admin dashboard

**Database Tables:**
- `auth.users` (Supabase managed)
- `user_profiles` (application managed)
- `admin_credentials` (custom table for SSO)

**Features:**
- Unlimited usage (no limits)
- Password-based authentication
- Account lockout after 5 failed attempts (15 minutes)
- Mandatory password change on first login
- Bcrypt password hashing (12 rounds)
- Failed login attempt tracking

**User Flow:**
1. Enter email and password in "Admin Login (SSO)" section
2. System verifies password
3. If first login, redirect to `/change-password`
4. After password change, redirect to `/admin`

## Current Admin Credentials

**Email:** `admin@fraud.com`
**Password:** `admin123`

**IMPORTANT:** Change password on first login!

## Key Differences

| Feature | Google OAuth | SSO |
|---------|-------------|-----|
| **Users** | Investors, general users | Administrators only |
| **Auth Method** | Google Account | Email + Password |
| **Password** | Not required | Required |
| **Storage** | auth.users + user_profiles | auth.users + user_profiles + admin_credentials |
| **Dashboard** | /dashboard | /admin |
| **Usage Limit** | Yes (configurable) | No (unlimited) |
| **First Login** | Direct access | Must change password |
| **Account Lock** | No | Yes (5 failed attempts) |

## Security Features

### Google OAuth
- Managed by Google's OAuth 2.0
- No password storage in our database
- Automatic session management
- Secure token-based authentication

### SSO
- Bcrypt password hashing (12 salt rounds)
- Password stored in both `auth.users.encrypted_password` and `admin_credentials.password_hash`
- Account lockout after 5 failed attempts
- Lock duration: 15 minutes
- Automatic unlock after lock expiration
- Failed login attempt tracking
- Row Level Security (RLS) policies

## Login Page UI

The login page clearly separates the two authentication methods:

### User Login (Google OAuth)
- Located at the top
- Blue/emerald gradient background
- Text: "For investors and general users"
- Button: "Continue with Google"

### Admin Login (SSO)
- Located at the bottom
- Slate gradient background
- Shield icon
- Text: "For system administrators only"
- Email and password input fields
- Button: "Sign In"

## Technical Implementation

### Google OAuth Flow
```typescript
// Initiate Google OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### SSO Flow
```typescript
// 1. Check if account is locked
const { data: isLocked } = await supabase.rpc('is_account_locked', { user_email: email });

// 2. Verify password against admin_credentials
const { data: passwordValid } = await supabase.rpc('verify_password', {
  password,
  password_hash: credentials.password_hash,
});

// 3. Sign in to Supabase Auth
const { data: authData } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// 4. Check if must change password
if (credentials.must_change_password) {
  navigate('/change-password');
}
```

## Password Synchronization

**CRITICAL:** For SSO to work, the password must be synchronized in BOTH:
1. `auth.users.encrypted_password` (for Supabase Auth)
2. `admin_credentials.password_hash` (for our verification)

When changing admin password:
```sql
-- Update both tables
UPDATE auth.users
SET encrypted_password = crypt('new_password', gen_salt('bf'))
WHERE email = 'admin@fraud.com';

UPDATE admin_credentials
SET password_hash = crypt('new_password', gen_salt('bf', 12))
WHERE email = 'admin@fraud.com';
```

## Troubleshooting

### "Invalid email or password" error
- Check if password is synced in both `auth.users` and `admin_credentials`
- Verify email is correct in all tables
- Check if account is locked

### "Account is locked" error
- Wait 15 minutes for automatic unlock
- Or manually unlock: `UPDATE admin_credentials SET locked_until = NULL, failed_login_attempts = 0 WHERE email = 'admin@fraud.com'`

### Google OAuth not working
- Verify Google OAuth is configured in Supabase dashboard
- Check redirect URLs are correct
- Ensure Google Cloud Console has correct authorized origins

## Database Functions

### `is_account_locked(user_email text)`
Checks if SSO account is locked. Auto-clears expired locks.

### `increment_failed_login_attempts(user_email text)`
Increments failed login attempts. Locks account after 5 attempts.

### `reset_failed_login_attempts(user_email text)`
Resets failed attempts after successful login.

### `verify_password(password text, password_hash text)`
Verifies password against bcrypt hash.

### `hash_password(password text)`
Hashes password using bcrypt with 12 salt rounds.
