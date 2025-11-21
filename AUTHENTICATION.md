# Authentication System

This application provides **TWO equal authentication methods** for all users.

## Authentication Methods

### 1. Email/Password Authentication

**Available for:** Everyone (admins and regular users)

**Features:**
- Register with email, password, full name, and user type
- Passwords stored securely with bcrypt in `user_profiles`
- Login checks `user_profiles` first
- User types: Personal, Company, Student

**Registration Flow:**
1. Click "Register here" on login page
2. Fill in:
   - Full Name
   - Email
   - Account Type (Personal/Company/Student)
   - Password (min 8 characters)
3. System creates:
   - Entry in `auth.users` (Supabase Auth)
   - Entry in `user_profiles` with bcrypt password hash
4. Auto-login and redirect to dashboard

**Login Flow:**
1. Enter email and password
2. System checks `user_profiles.password_hash`
3. Verify password with bcrypt
4. If admin role → redirect to `/admin`
5. If user role → redirect to `/dashboard`

### 2. Google OAuth Authentication

**Available for:** Everyone (quick sign-up for new users)

**Features:**
- One-click sign-in with Google account
- No password needed
- Auto-creates profile on first login

**Login Flow:**
1. Click "Continue with Google"
2. Google OAuth consent screen
3. System creates profile in `user_profiles` with:
   - auth_method: 'google'
   - password_hash: NULL
   - role: 'user'
4. Redirect to `/dashboard`

## Database Schema

### user_profiles Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | User email |
| **password_hash** | text | **Bcrypt hash (12 rounds)** |
| **full_name** | text | **User's full name** |
| **user_type** | text | **'personal', 'company', or 'student'** |
| display_name | text | Display name |
| role | text | 'admin' or 'user' |
| auth_method | text | 'email' or 'google' |
| usage_limit | integer | Usage limit (NULL for unlimited) |
| usage_count | integer | Current usage count |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Update timestamp |

## Security

### Password Storage
- **Bcrypt hashing** with 12 salt rounds
- Passwords stored ONLY in `user_profiles.password_hash`
- Google OAuth users have NULL password_hash
- No plain text passwords anywhere

### Authentication Flow
1. **Email/Password:** Check `user_profiles` → Verify bcrypt → Sign in
2. **Google OAuth:** Supabase Auth → Auto-create profile

### Functions

```sql
-- Hash password with bcrypt
hash_user_password(password text) → text

-- Verify password against bcrypt hash
verify_user_password(input_password text, stored_hash text) → boolean
```

## Admin Account

```
Email:    admin@fraud.com
Password: @Min1234
Role:     admin
Type:     personal
Method:   email
```

**Admin Features:**
- Unlimited usage (usage_limit = NULL)
- Access to `/admin` dashboard
- Full system access

## User Registration

**Required Fields:**
1. **Full Name** - User's complete name
2. **Email** - Valid email address
3. **Account Type:**
   - **Personal** - Individual users
   - **Company** - Corporate accounts
   - **Student** - Educational purposes
4. **Password** - Minimum 8 characters
5. **Confirm Password** - Must match

**Default Settings:**
- Role: 'user'
- Auth Method: 'email'
- Usage Limit: 10
- Usage Count: 0

## Login Page

### Google OAuth Section (Top)
- Blue/emerald gradient
- Text: "User Login (Google OAuth)"
- Subtitle: "For investors and general users"
- Button: "Continue with Google"

### Email Login Section (Bottom)
- Gray/slate gradient
- Text: "Email Login"
- Subtitle: "Sign in with your email and password"
- Email and password inputs
- "Sign In" button
- "Register here" link

**Both methods are equal** - no distinction between admin/user in UI

## Key Points

✅ **Both authentication methods available to everyone**
✅ **Role determined by user_profiles.role, not auth method**
✅ **Passwords encrypted with bcrypt in user_profiles**
✅ **Google OAuth users don't need passwords**
✅ **Registration collects: name, email, type, password**
✅ **Admin can login with email/password like any user**
✅ **No special "Admin Login" label - just "Email Login"**

## API Usage

### Registration
```typescript
import { registerWithEmail } from '@/lib/auth';

const result = await registerWithEmail({
  email: 'user@example.com',
  password: 'SecurePass123',
  fullName: 'John Doe',
  userType: 'personal', // or 'company', 'student'
});

if (result.success) {
  // Navigate to dashboard
}
```

### Email Login
```typescript
import { signInWithEmail } from '@/lib/auth';

const result = await signInWithEmail(email, password);

if (result.success) {
  if (result.role === 'admin') {
    navigate('/admin');
  } else {
    navigate('/dashboard');
  }
}
```

### Google OAuth
```typescript
import { supabase } from '@/lib/supabase';

await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

## Routes

- `/` - Landing page
- `/login` - Login page (both methods)
- `/register` - Registration page
- `/dashboard` - User dashboard
- `/admin` - Admin dashboard
- `/auth/callback` - OAuth callback handler

## Troubleshooting

### "Invalid email or password"
- Check if email exists in `user_profiles`
- Verify password_hash is not NULL
- Test: `SELECT verify_user_password('password', password_hash) FROM user_profiles WHERE email = 'user@example.com'`

### "This email is registered with Google"
- User registered via Google OAuth
- They must use "Continue with Google" button
- Cannot use email/password for Google accounts

### Registration fails
- Check if email already exists
- Verify password meets minimum requirements (8 chars)
- Check Supabase Auth settings allow sign-ups

### User not routing correctly
- Verify `user_profiles.role` is 'admin' or 'user'
- Check AuthContext is loading profile correctly
- Ensure user is authenticated

## Migration Notes

**Changes from Previous System:**
- ✅ Added `password_hash` column (bcrypt)
- ✅ Added `full_name` column (required)
- ✅ Added `user_type` column (personal/company/student)
- ✅ Removed `admin_credentials` table
- ✅ Removed account locking logic
- ✅ Unified authentication under `user_profiles`
- ✅ Both auth methods treated equally
