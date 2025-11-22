import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Check, User, Building2, GraduationCap, Shield } from 'lucide-react';
import { toast } from 'sonner';

type UserType = 'personal' | 'company' | 'student';
type PlanType = 'free' | 'professional' | 'enterprise';

interface OnboardingData {
  fullName: string;
  userType: UserType | null;
  planType: PlanType | null;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    userType: null,
    planType: null,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  // Protection: Redirect admin and completed users
  useEffect(() => {
    if (!authLoading && profile) {
      // Admin should never see onboarding
      if (profile.role === 'admin') {
        navigate('/admin');
        return;
      }

      // User who completed onboarding goes to dashboard
      if (profile.onboarding_completed) {
        navigate('/dashboard');
      }
    }
  }, [authLoading, profile, navigate]);

  const handleNext = () => {
    if (step === 1 && !data.fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (step === 2 && !data.userType) {
      toast.error('Please select account type');
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!data.planType) {
      toast.error('Please select a plan');
      return;
    }

    setLoading(true);
    try {
      // Get plan details
      const { data: planDetails } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('plan_type', data.planType)
        .single();

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.fullName,
          display_name: data.fullName,
          user_type: data.userType,
          onboarding_completed: true,
          onboarding_step: 3,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // Create subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user!.id,
          plan_type: data.planType,
          plan_name: planDetails?.plan_name || data.planType,
          base_price: planDetails?.monthly_price || 0,
          final_price: planDetails?.monthly_price || 0,
          max_files_per_month: planDetails?.max_files_per_month || 1,
          files_used_this_month: 0,
          max_file_size_mb: planDetails?.max_file_size_mb || 5,
          features: planDetails?.features || [],
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (subError) throw subError;

      // Log onboarding event
      await supabase.from('onboarding_events').insert({
        user_id: user!.id,
        event_type: 'onboarding_completed',
        step_number: 3,
        step_name: 'Plan Selection',
        event_data: {
          fullName: data.fullName,
          userType: data.userType,
          planType: data.planType,
        },
      });

      toast.success('Welcome to FraudCheck! 🎉');
      
      // Hard redirect to refresh context
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Step {step} of {totalSteps}</span>
            <span className="text-sm font-medium text-emerald-400">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 md:p-12 shadow-2xl">
          {/* Back Button */}
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-8 text-slate-300 hover:text-white hover:bg-white/10"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-emerald-glow">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">Welcome to FraudCheck</h1>
                <p className="text-lg text-slate-300">
                  Let's get your account set up in just a few steps
                </p>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-white block">
                  What's your full name?
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 h-14 text-lg focus:border-emerald-500 focus:ring-emerald-500"
                  autoFocus
                />
                <p className="text-sm text-slate-400">
                  This will be visible to others when collaborating
                </p>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <input 
                  type="checkbox" 
                  id="subscribe" 
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-emerald-600 focus:ring-emerald-500"
                  defaultChecked 
                />
                <label htmlFor="subscribe" className="text-sm text-slate-300 leading-relaxed">
                  Send me product updates, tips, and exclusive offers. You can unsubscribe anytime.
                </label>
              </div>

              <p className="text-sm text-slate-400 text-center">
                By continuing, you agree to our{' '}
                <a href="#" className="text-emerald-400 hover:text-emerald-300 underline">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-emerald-400 hover:text-emerald-300 underline">
                  Privacy Policy
                </a>
              </p>

              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white h-14 text-lg font-semibold shadow-emerald-glow"
                disabled={!data.fullName.trim()}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: User Type */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-3">Select Account Type</h1>
                <p className="text-lg text-slate-300">
                  Choose the option that best describes your use case
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { 
                    value: 'personal', 
                    label: 'Personal Account', 
                    desc: 'For individual investors and personal financial analysis',
                    icon: User,
                    gradient: 'from-blue-500 to-blue-600'
                  },
                  { 
                    value: 'company', 
                    label: 'Business Account', 
                    desc: 'For companies, teams, and professional organizations',
                    icon: Building2,
                    gradient: 'from-emerald-500 to-emerald-600'
                  },
                  { 
                    value: 'student', 
                    label: 'Student Account', 
                    desc: 'For academic research and educational purposes',
                    icon: GraduationCap,
                    gradient: 'from-purple-500 to-purple-600'
                  },
                ].map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setData({ ...data, userType: type.value as UserType })}
                      className={`group p-6 rounded-xl border-2 transition-all text-left ${
                        data.userType === type.value
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0 ${
                            data.userType === type.value ? 'shadow-lg' : ''
                          }`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-1">{type.label}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{type.desc}</p>
                          </div>
                        </div>
                        {data.userType === type.value && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 ml-4">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white h-14 text-lg font-semibold shadow-emerald-glow"
                disabled={!data.userType}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-3">Choose Your Plan</h1>
                <p className="text-lg text-slate-300">
                  Select the plan that fits your fraud detection needs
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Free Plan */}
                <button
                  onClick={() => setData({ ...data, planType: 'free' })}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    data.planType === 'free'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Starter</h3>
                      <p className="text-slate-400">Perfect for trying out FraudCheck</p>
                    </div>
                    {data.planType === 'free' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">$0</span>
                    <span className="text-slate-400 ml-2">forever</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>1 analysis per month</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Max 5MB file size</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Basic M-Score calculation</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>PDF export</span>
                    </li>
                  </ul>
                </button>

                {/* Professional Plan */}
                <button
                  onClick={() => setData({ ...data, planType: 'professional' })}
                  className={`p-6 rounded-xl border-2 transition-all text-left relative ${
                    data.planType === 'professional'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="absolute -top-3 left-6">
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="flex items-start justify-between mb-4 mt-2">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Professional</h3>
                      <p className="text-slate-400">Best for serious investors & analysts</p>
                    </div>
                    {data.planType === 'professional' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">$29</span>
                    <span className="text-slate-400 ml-2">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>50 analyses per month</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Max 20MB file size</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Advanced fraud detection</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Excel & PDF exports</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                </button>

                {/* Enterprise Plan */}
                <button
                  onClick={() => setData({ ...data, planType: 'enterprise' })}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    data.planType === 'enterprise'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Enterprise</h3>
                      <p className="text-slate-400">Best for teams & organizations</p>
                    </div>
                    {data.planType === 'enterprise' && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">$99</span>
                    <span className="text-slate-400 ml-2">/month</span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Unlimited analyses</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Max 50MB file size</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>API access</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Multi-user collaboration</span>
                    </li>
                    <li className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>24/7 dedicated support</span>
                    </li>
                  </ul>
                </button>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white h-14 text-lg font-semibold shadow-emerald-glow"
                disabled={!data.planType || loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up your account...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-slate-400">
                <Shield className="w-4 h-4 inline mr-1" />
                30-day money-back guarantee • Cancel anytime
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}