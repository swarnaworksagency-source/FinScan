import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, BarChart3, Shield, FileText } from 'lucide-react';
import { useEffect } from 'react';

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">FraudCheck</h1>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-slate-600 hover:text-slate-900">Features</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900">Pricing</a>
            <Button variant="outline" onClick={handleGetStarted}>Login</Button>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
          Detect Financial Statement Fraud with AI
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Automated analysis using the Beneish M-Score model to identify manipulation indicators in financial statements
        </p>
        <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
          Start Free Trial
        </Button>
      </section>

      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <BarChart3 className="w-12 h-12 mb-4 text-blue-600" />
              <CardTitle>Automated Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload financial data and get instant M-Score results with detailed component breakdowns
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-12 h-12 mb-4 text-blue-600" />
              <CardTitle>Fraud Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Identify manipulation indicators using 8 proven financial ratios and fraud risk assessment
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-12 h-12 mb-4 text-blue-600" />
              <CardTitle>Professional Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download detailed PDF reports with comprehensive analysis and red flag identification
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? 'border-blue-600 border-2' : ''}>
              <CardHeader>
                {plan.popular && (
                  <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full mb-2">
                    POPULAR
                  </span>
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-3xl font-bold mt-2">{plan.price}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={handleGetStarted}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400">© 2024 FraudCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
