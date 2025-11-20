import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword, validatePassword, getPasswordStrength } from '@/lib/auth-sso';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, refreshProfile } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('SecureAdmin123!');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isFirstLogin = location.state?.isFirstLogin || false;

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }
  }, [newPassword]);

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      setLoading(false);
      return;
    }

    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword(user.id, currentPassword, newPassword);

      if (!result.success) {
        setError(result.error || 'Failed to change password');
        setLoading(false);
        return;
      }

      await refreshProfile();

      toast.success('Password changed successfully!');

      setTimeout(() => {
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 1000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
      console.error('Password change error:', err);
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
    }
  };

  const getStrengthWidth = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak':
        return 'w-1/3';
      case 'medium':
        return 'w-2/3';
      case 'strong':
        return 'w-full';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {isFirstLogin ? 'Welcome! Change Your Password' : 'Change Password'}
              </CardTitle>
              <CardDescription>
                {isFirstLogin
                  ? 'For security reasons, you must change your password before continuing'
                  : 'Update your password to keep your account secure'}
              </CardDescription>
            </div>
          </div>

          {isFirstLogin && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This is your first login. Please create a new strong password.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isFirstLogin && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Your current password is: <strong>SecureAdmin123!</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {passwordStrength && newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium capitalize ${
                      passwordStrength === 'weak' ? 'text-red-600' :
                      passwordStrength === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)} ${getStrengthWidth(passwordStrength)}`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-900 mb-3">Password requirements:</p>
              <div className="space-y-2">
                {[
                  { text: 'At least 8 characters', check: newPassword.length >= 8 },
                  { text: 'One uppercase letter', check: /[A-Z]/.test(newPassword) },
                  { text: 'One lowercase letter', check: /[a-z]/.test(newPassword) },
                  { text: 'One number', check: /\d/.test(newPassword) },
                  { text: 'One special character (!@#$%^&*)', check: /[!@#$%^&*]/.test(newPassword) },
                ].map((req, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm">
                    {req.check ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={req.check ? 'text-green-600' : 'text-gray-600'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              {!isFirstLogin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading || validationErrors.length > 0 || !newPassword || !confirmPassword}
                className={`bg-blue-600 hover:bg-blue-700 ${isFirstLogin ? 'w-full' : 'flex-1'}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
