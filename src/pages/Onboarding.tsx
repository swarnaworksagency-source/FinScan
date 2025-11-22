import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Check } from 'lucide-react';
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
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    userType: null,
    planType: null,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

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
      // Get plan details from pricing_plans table
      const { data: planDetails } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('plan_type', data.planType)
        .single();

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user!.id,
          email: user!.email,
          full_name: data.fullName,
          display_name: data.fullName,
          role: 'user',
          auth_method: 'google',
          user_type: data.userType,
          onboarding_completed: true,
          onboarding_step: 3,
          usage_limit: planDetails?.max_files_per_month || 1,
          usage_count: 0,
        }, {
          onConflict: 'id'
        });

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
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (subError) throw subError;

      // Log onboarding completion
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
      
      // Refresh auth context to load new profile
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-slate-400">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-8">
          {/* Back Button */}
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-6 text-slate-400 hover:text-white"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">What's your name?</h1>
                <p className="text-slate-400">
                  This is what others see when you join files, send invites, and more.
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  className="bg-slate-700 border-slate-600 text-white h-12 text-lg"
                  autoFocus
                />
              </div>

              <div className="flex items-start space-x-2">
                <input 
                  type="checkbox" 
                  id="subscribe" 
                  className="mt-1"
                  defaultChecked 
                />
                <label htmlFor="subscribe" className="text-sm text-slate-400">
                  Subscribe to FraudCheck tips and updates. You can unsubscribe at any time.
                </label>
              </div>

              <p className="text-sm text-slate-400">
                By continuing you agree to the{' '}
                <a href="#" className="text-blue-400 hover:underline">
                  Terms of Service
                </a>
                .
              </p>

              <Button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                disabled={!data.fullName.trim()}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: User Type */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Select Account Type</h1>
                <p className="text-slate-400">Choose the type that best describes you.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { 
                    value: 'personal', 
                    label: 'Personal', 
                    desc: 'For individual investors & personal use',
                    icon: '👤'
                  },
                  { 
                    value: 'company', 
                    label: 'Company', 
                    desc: 'For businesses & organizations',
                    icon: '🏢'
                  },
                  { 
                    value: 'student', 
                    label: 'Student', 
                    desc: 'For learning & academic purposes',
                    icon: '🎓'
                  },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setData({ ...data, userType: type.value as UserType })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      data.userType === type.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{type.icon}</span>
                        <div>
                          <h3 className="text-white font-semibold">{type.label}</h3>
                          <p className="text-slate-400 text-sm">{type.desc}</p>
                        </div>
                      </div>
                      {data.userType === type.value && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                disabled={!data.userType}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Which plan would you like?</h1>
                <p className="text-slate-400">Choose the plan that fits your needs.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Free Plan */}
                <button
                  onClick={() => setData({ ...data, planType: 'free' })}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    data.planType === 'free'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Starter</h3>
                      <p className="text-slate-400 text-sm">Best for trying out FraudCheck</p>
                    </div>
                    {data.planType === 'free' && <Check className="w-5 h-5 text-blue-500" />}
                  </div>
                  <p className="text-white text-2xl font-bold mb-4">Free</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      1 analysis per month
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Basic M-Score calculation
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      PDF export
                    </li>
                  </ul>
                </button>

                {/* Professional Plan */}
                <button
                  onClick={() => setData({ ...data, planType: 'professional' })}
                  className={`p-6 rounded-lg border-2 transition-all text-left relative ${
                    data.planType === 'professional'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="absolute -top-3 left-6">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Professional</h3>
                      <p className="text-slate-400 text-sm">Best for serious investors & analysts</p>
                    </div>
                    {data.planType === 'professional' && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-white text-2xl font-bold mb-2">
                    $29<span className="text-sm text-slate-400">/month</span>
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      50 analyses per month
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Advanced fraud detection
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Excel & PDF exports
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Priority support
                    </li>
                  </ul>
                </button>

                {/* Enterprise Plan */}
                <button
                  onClick={() => setData({ ...data, planType: 'enterprise' })}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    data.planType === 'enterprise'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Enterprise</h3>
                      <p className="text-slate-400 text-sm">Best for teams & organizations</p>
                    </div>
                    {data.planType === 'enterprise' && <Check className="w-5 h-5 text-blue-500" />}
                  </div>
                  <p className="text-white text-2xl font-bold mb-2">
                    $99<span className="text-sm text-slate-400">/month</span>
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Unlimited analyses
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      API access
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Multi-user support
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      Dedicated account manager
                    </li>
                  </ul>
                </button>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                disabled={!data.planType || loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up your account...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}