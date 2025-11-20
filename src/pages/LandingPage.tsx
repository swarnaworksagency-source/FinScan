import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BarChart3, Shield, FileText, ArrowRight, Lock, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { ElevatedCard } from '@/components/ElevatedCard';
import { GradientBorderCard } from '@/components/GradientBorderCard';
import { GlassMorphismCard } from '@/components/GlassMorphismCard';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleGetStarted = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: [
        '3 analyses per month',
        'Max 5MB file size',
        'Basic M-Score calculation',
        'PDF export'
      ]
    },
    {
      name: 'Professional',
      price: '$29/month',
      popular: true,
      features: [
        '50 analyses per month',
        'Max 20MB file size',
        'Detailed fraud indicators',
        'Excel export',
        'Email support'
      ]
    },
    {
      name: 'Enterprise',
      price: '$99/month',
      features: [
        'Unlimited analyses',
        'Max 50MB file size',
        'API access',
        'Priority support',
        'Multi-user accounts'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-800 to-slate-900">
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-navy/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">FraudCheck</h1>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
            <Button
              variant="outline"
              onClick={handleGetStarted}
              className="border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white"
            >
              Login
            </Button>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 md:px-8 pt-32 pb-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">AI-Powered</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Detect Financial Statement{' '}
            <span className="gradient-text">Fraud with AI</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Automated analysis using the Beneish M-Score model to identify manipulation indicators in financial statements
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-emerald-glow hover:shadow-emerald-glow hover:-translate-y-1 transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-slate-600 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-xl"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="container mx-auto px-4 md:px-8 py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-navy">Key Features</h2>
          <p className="text-center text-slate-600 text-lg mb-16 max-w-2xl mx-auto">
            Powerful tools to detect financial fraud and protect your investments
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <ElevatedCard className="group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-semibold text-navy">Automated Analysis</h3>
                <p className="text-slate-600 leading-relaxed">
                  Upload financial data and get instant M-Score results with detailed component breakdowns
                </p>
              </div>
            </ElevatedCard>

            <ElevatedCard className="group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-semibold text-navy">Fraud Detection</h3>
                <p className="text-slate-600 leading-relaxed">
                  Identify manipulation indicators using 8 proven financial ratios and fraud risk assessment
                </p>
              </div>
            </ElevatedCard>

            <ElevatedCard className="group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-semibold text-navy">Professional Reports</h3>
                <p className="text-slate-600 leading-relaxed">
                  Download detailed PDF reports with comprehensive analysis and red flag identification
                </p>
              </div>
            </ElevatedCard>
          </div>
        </div>
      </section>

      <section id="pricing" className="container mx-auto px-4 md:px-8 py-20 bg-gradient-to-br from-navy via-navy-800 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">Simple Pricing</h2>
          <p className="text-center text-slate-300 text-lg mb-16 max-w-2xl mx-auto">
            Choose the plan that fits your needs
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className="group">
                {plan.popular ? (
                  <GradientBorderCard className="relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-block bg-gradient-to-r from-emerald-600 to-gold-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                        MOST POPULAR
                      </span>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-navy mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold text-navy font-mono">{plan.price.split('/')[0]}</span>
                          {plan.price.includes('/') && (
                            <span className="text-slate-600">/{plan.price.split('/')[1]}</span>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 rounded-xl shadow-emerald-glow"
                        onClick={handleGetStarted}
                      >
                        Get Started
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </GradientBorderCard>
                ) : (
                  <ElevatedCard>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-navy mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold text-navy font-mono">{plan.price.split('/')[0]}</span>
                          {plan.price.includes('/') && (
                            <span className="text-slate-600">/{plan.price.split('/')[1]}</span>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span className="text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold py-6 rounded-xl"
                        variant="outline"
                        onClick={handleGetStarted}
                      >
                        Get Started
                      </Button>
                    </div>
                  </ElevatedCard>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-navy py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">FraudCheck</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                AI-powered financial fraud detection using the proven Beneish M-Score model.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-slate-400 hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Contact</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Security</h4>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-400">256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-400">SOC 2 Certified</span>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">© 2024 FraudCheck. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
