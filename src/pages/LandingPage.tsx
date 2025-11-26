import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  CheckCircle2, BarChart3, Shield, FileText, ArrowRight, Lock, Zap,
  Users, TrendingUp, DollarSign, AlertTriangle, Download, Database,
  Link2, Play, Star, Award, CheckCircle, X, UserPlus, Activity, Menu
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ElevatedCard } from '@/components/ElevatedCard';
import { GradientBorderCard } from '@/components/GradientBorderCard';
import { GlassMorphismCard } from '@/components/GlassMorphismCard';
import { MetricCard } from '@/components/MetricCard';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [activeFeatureTab, setActiveFeatureTab] = useState('portfolio');
  const [authError, setAuthError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }

    const error = searchParams.get('error');
    if (error) {
      if (error === 'auth_failed') {
        setAuthError('Authentication failed. Please try again or check your Google OAuth configuration.');
      } else if (error === 'unexpected') {
        setAuthError('An unexpected error occurred. Please try again later.');
      }
    }
  }, [user, loading, navigate, searchParams]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '3 analyses per month',
        'Max 5MB file size',
        'Basic M-Score calculation',
        'PDF export',
        'Email support'
      ]
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'month',
      popular: true,
      description: 'For serious investors',
      features: [
        '50 analyses per month',
        'Max 20MB file size',
        'Detailed fraud indicators',
        'Excel & PDF export',
        'Advanced analytics',
        'Priority email support',
        'Custom reports'
      ]
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'month',
      description: 'For teams & advisors',
      features: [
        'Unlimited analyses',
        'Max 50MB file size',
        'API access',
        'Multi-user accounts (up to 10)',
        'White-label reports',
        'Dedicated account manager',
        '24/7 phone support'
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      title: 'CFO',
      company: 'TechVentures Inc',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 5,
      quote: 'FraudCheck saved us from a major investment mistake. The M-Score analysis revealed red flags we completely missed.',
      metric: '$2M saved from risky investment'
    },
    {
      name: 'Michael Chen',
      title: 'Investment Analyst',
      company: 'Capital Growth Partners',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 5,
      quote: 'The automated analysis is incredibly accurate. What used to take me hours now takes minutes.',
      metric: '85% time saved on due diligence'
    },
    {
      name: 'Emily Rodriguez',
      title: 'Forensic Accountant',
      company: 'Audit Excellence LLC',
      image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 5,
      quote: 'As a professional auditor, I rely on FraudCheck for preliminary screening. The accuracy is impressive.',
      metric: '95% accuracy in fraud detection'
    }
  ];

  const faqs = [
    {
      question: 'Is my financial data secure?',
      answer: 'Absolutely. We use bank-level 256-bit encryption for all data transmission and storage. Your data is encrypted at rest and in transit, and we never share your information with third parties. We are SOC 2 Type II certified and undergo regular security audits.'
    },
    {
      question: 'How accurate is the Beneish M-Score model?',
      answer: 'The Beneish M-Score model has been academically validated and shows approximately 76% accuracy in detecting earnings manipulation. Our AI-enhanced version improves on this with additional indicators and pattern recognition, achieving over 85% accuracy in our testing.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time with no penalties or fees. If you cancel, you\'ll continue to have access until the end of your billing period. We also offer a 30-day money-back guarantee if you\'re not satisfied.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We support Excel (.xlsx, .xls), CSV, and PDF formats. For PDFs, we use advanced OCR technology to extract financial data. We recommend using structured Excel or CSV files for the most accurate results.'
    },
    {
      question: 'Do you offer API access?',
      answer: 'Yes! API access is available on our Professional and Enterprise plans. Our RESTful API allows you to integrate fraud detection directly into your existing workflows and applications. Full documentation is provided.'
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'We offer email support for all plans, with response times of 24-48 hours for Free, 12 hours for Professional, and 4 hours for Enterprise. Enterprise customers also get 24/7 phone support and a dedicated account manager.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {authError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert variant="destructive" className="shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="w-full py-3">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-navy flex-shrink-0">FinCheck</h1>

            {/* Desktop Navigation */}
            <nav className="hidden min-[1150px]:flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <a
                href="#features"
                className="text-slate-700 hover:text-navy transition-colors font-medium whitespace-nowrap flex-shrink-0 px-2 py-1"
                style={{ fontSize: 'clamp(0.813rem, 0.75rem + 0.2vw, 0.938rem)' }}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-slate-700 hover:text-navy transition-colors font-medium whitespace-nowrap flex-shrink-0 px-2 py-1"
                style={{ fontSize: 'clamp(0.813rem, 0.75rem + 0.2vw, 0.938rem)' }}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="text-slate-700 hover:text-navy transition-colors font-medium whitespace-nowrap flex-shrink-0 px-2 py-1"
                style={{ fontSize: 'clamp(0.813rem, 0.75rem + 0.2vw, 0.938rem)' }}
              >
                Pricing
              </a>
              <Button
                variant="outline"
                onClick={handleGetStarted}
                size="sm"
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 ml-1 flex-shrink-0 whitespace-nowrap px-3 py-1 h-8 text-xs"
              >
                Login
              </Button>
              <Button
                onClick={handleGetStarted}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-glow flex-shrink-0 whitespace-nowrap px-3 py-1 h-8 text-xs"
              >
                Start Free Trial
              </Button>
            </nav>

            {/* Mobile Navigation */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="min-[1150px]:hidden flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[340px]">
                <nav className="flex flex-col gap-5 mt-8">
                  <a
                    href="#features"
                    className="text-base font-medium text-slate-700 hover:text-navy transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    className="text-base font-medium text-slate-700 hover:text-navy transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </a>
                  <a
                    href="#pricing"
                    className="text-base font-medium text-slate-700 hover:text-navy transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleGetStarted();
                      setMobileMenuOpen(false);
                    }}
                    className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-full mt-2"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      handleGetStarted();
                      setMobileMenuOpen(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-glow w-full"
                  >
                    Start Free Trial
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-navy via-navy-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-repeat"></div>
        </div>

        <div className="w-full relative">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6 sm:space-y-8 fade-in-up">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">AI-Powered</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
              Detect Financial Statement{' '}
              <span className="gradient-text">Fraud based on M-Score</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Professional-grade fraud detection using the proven Beneish M-Score model. Trusted by 50,000+ investors and analysts worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-4 sm:pt-6 w-full max-w-2xl mx-auto">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="w-full sm:flex-1 sm:max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 text-base sm:text-lg font-semibold rounded-xl shadow-emerald-glow hover:-translate-y-1 transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:flex-1 sm:max-w-xs border-2 border-white text-white hover:bg-white/10 px-6 sm:px-8 md:px-10 py-5 sm:py-6 md:py-7 text-base sm:text-lg rounded-xl"
              >
                <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 pt-4 text-slate-400 text-xs sm:text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Bar */}
      <section className="py-8 sm:py-12 bg-slate-50 border-b border-slate-200">
        <div className="w-full">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-center text-slate-600 mb-6 sm:mb-8 font-medium text-sm sm:text-base">Trusted by leading companies</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 items-center justify-items-center">
            <MetricCard
              label="Assets Protected"
              value={10}
              prefix="$"
              suffix="B+"
              animate={false}
              className="bg-transparent shadow-none"
            />
            <MetricCard
              label="Active Users"
              value={50000}
              suffix="+"
              animate={false}
              className="bg-transparent shadow-none"
            />
            <MetricCard
              label="Fraud Detected"
              value={95}
              suffix="%"
              decimals={0}
              animate={false}
              className="bg-transparent shadow-none"
            />
            <MetricCard
              label="Uptime"
              value={99.99}
              suffix="%"
              decimals={2}
              animate={false}
              className="bg-transparent shadow-none"
            />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="w-full">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-3 sm:mb-4">
                Financial Fraud Shouldn't Be This Hard to Detect
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                Traditional analysis methods are time-consuming, error-prone, and often miss critical warning signs
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <ElevatedCard className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Time-Consuming Manual Analysis</h3>
                <p className="text-slate-600 leading-relaxed">
                  Spending hours analyzing financial statements manually, with high risk of human error
                </p>
              </ElevatedCard>

              <ElevatedCard className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Missing Critical Red Flags</h3>
                <p className="text-slate-600 leading-relaxed">
                  Overlooking subtle manipulation indicators that could signal major fraud
                </p>
              </ElevatedCard>

              <ElevatedCard className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-red-600 rotate-180" />
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Costly Investment Mistakes</h3>
                <p className="text-slate-600 leading-relaxed">
                  Making decisions based on manipulated financials leads to significant losses
                </p>
              </ElevatedCard>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-emerald-50 to-slate-50">
        <div className="w-full">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
              <div className="space-y-4 sm:space-y-6">
                <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs sm:text-sm">
                  The Solution
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-navy">
                  One Platform, Complete Fraud Detection
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed">
                  Automated AI-powered analysis using the academically-proven Beneish M-Score model delivers instant, accurate fraud detection.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold text-navy">Instant Analysis</span>
                      <p className="text-slate-600">Get results in seconds, not hours</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold text-navy">85%+ Accuracy</span>
                      <p className="text-slate-600">AI-enhanced detection of manipulation indicators</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-semibold text-navy">Professional Reports</span>
                      <p className="text-slate-600">Detailed PDF reports ready to share</p>
                    </div>
                  </li>
                </ul>
                <Button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
                >
                  See How It Works
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              <div className="relative order-first md:order-last">
                <GlassMorphismCard className="p-4 sm:p-6 md:p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">M-Score Analysis</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                        Low Risk
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">DSRI</span>
                          <span className="text-sm font-mono font-bold text-navy">1.02</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[20%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">GMI</span>
                          <span className="text-sm font-mono font-bold text-navy">0.98</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[18%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">AQI</span>
                          <span className="text-sm font-mono font-bold text-navy">1.05</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[25%]"></div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-navy">Final M-Score</span>
                          <span className="text-3xl font-mono font-bold text-emerald-600">-2.87</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassMorphismCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase - Tab Based */}
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="w-full">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-3 sm:mb-4">
                Powerful Features for Fraud Detection
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                Everything you need to analyze financial statements and detect manipulation
              </p>
            </div>

            <Tabs value={activeFeatureTab} onValueChange={setActiveFeatureTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 sm:mb-12 bg-slate-100 p-1.5 sm:p-2 rounded-xl gap-1">
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm py-2">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Analysis</span>
                  <span className="sm:hidden">Analyze</span>
                </TabsTrigger>
                <TabsTrigger value="tracking" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm py-2">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Detection</span>
                  <span className="sm:hidden">Detect</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm py-2">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs sm:text-sm py-2">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="space-y-6 sm:space-y-8">
                <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-navy">Automated Financial Analysis</h3>
                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                      Upload your financial statements and get instant, comprehensive analysis using the Beneish M-Score model with AI enhancements.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">8 key financial ratio calculations</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">Real-time M-Score computation</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">Historical trend analysis</span>
                      </li>
                    </ul>
                    <div className="flex gap-4">
                      <span className="text-4xl font-bold text-navy">3 sec</span>
                      <div>
                        <p className="font-semibold text-navy">Average Analysis Time</p>
                        <p className="text-sm text-slate-600">From upload to results</p>
                      </div>
                    </div>
                  </div>
                  <ElevatedCard className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Database className="w-6 h-6 text-emerald-600" />
                        <span className="font-semibold text-navy">Supported Formats</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 border-2 border-slate-200 rounded-lg text-center">
                          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <span className="text-sm font-medium text-slate-700">Excel</span>
                        </div>
                        <div className="p-4 border-2 border-slate-200 rounded-lg text-center">
                          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <span className="text-sm font-medium text-slate-700">CSV</span>
                        </div>
                        <div className="p-4 border-2 border-slate-200 rounded-lg text-center">
                          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <span className="text-sm font-medium text-slate-700">PDF</span>
                        </div>
                      </div>
                    </div>
                  </ElevatedCard>
                </div>
              </TabsContent>

              <TabsContent value="tracking" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-bold text-navy">Advanced Fraud Detection</h3>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Identify manipulation indicators using proven financial ratios and AI-powered pattern recognition.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">8 Beneish M-Score components</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">Red flag identification system</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">Risk level classification</span>
                      </li>
                    </ul>
                    <div className="flex gap-4">
                      <span className="text-4xl font-bold text-emerald-600">85%+</span>
                      <div>
                        <p className="font-semibold text-navy">Detection Accuracy</p>
                        <p className="text-sm text-slate-600">Validated across thousands of cases</p>
                      </div>
                    </div>
                  </div>
                  <ElevatedCard className="p-8">
                    <h4 className="font-semibold text-navy mb-4">M-Score Components</h4>
                    <div className="space-y-3">
                      {['DSRI', 'GMI', 'AQI', 'SGI', 'DEPI', 'SGAI', 'LVGI', 'TATA'].map((component) => (
                        <div key={component} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="font-mono text-sm font-semibold text-navy">{component}</span>
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                      ))}
                    </div>
                  </ElevatedCard>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-bold text-navy">Professional Reports</h3>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Generate comprehensive PDF and Excel reports with detailed analysis, charts, and actionable insights.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">Detailed M-Score breakdown</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">Visual charts and graphs</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">Executive summary section</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">White-label customization</span>
                      </li>
                    </ul>
                  </div>
                  <ElevatedCard className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <span className="font-medium text-navy">PDF Export</span>
                        <Download className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <span className="font-medium text-navy">Excel Export</span>
                        <Download className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <span className="font-medium text-navy">Share via Email</span>
                        <ArrowRight className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                  </ElevatedCard>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-bold text-navy">Bank-Level Security</h3>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Your financial data is protected with enterprise-grade security measures and compliance certifications.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">256-bit AES encryption</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">SOC 2 Type II certified</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">GDPR compliant</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">Regular security audits</span>
                      </li>
                    </ul>
                  </div>
                  <ElevatedCard className="p-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <Lock className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-navy">Encrypted</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-navy">Protected</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-navy">Certified</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-navy">Compliant</p>
                      </div>
                    </div>
                  </ElevatedCard>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="w-full">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
                Get Started in Minutes, Not Hours
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Four simple steps to detect financial fraud
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="relative">
                <ElevatedCard className="text-center h-full">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    1
                  </div>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 mt-6">
                    <UserPlus className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-3">Sign Up</h3>
                  <p className="text-slate-600">
                    Create your account in 30 seconds with Google or email
                  </p>
                </ElevatedCard>
              </div>

              <div className="relative">
                <ElevatedCard className="text-center h-full">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    2
                  </div>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 mt-6">
                    <FileText className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-3">Upload Files</h3>
                  <p className="text-slate-600">
                    Upload financial statements in Excel, CSV, or PDF format
                  </p>
                </ElevatedCard>
              </div>

              <div className="relative">
                <ElevatedCard className="text-center h-full">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    3
                  </div>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 mt-6">
                    <Activity className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-3">Analyze</h3>
                  <p className="text-slate-600">
                    AI analyzes the data and calculates the M-Score instantly
                  </p>
                </ElevatedCard>
              </div>

              <div className="relative">
                <ElevatedCard className="text-center h-full">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    4
                  </div>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 mt-6">
                    <Download className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-3">Get Results</h3>
                  <p className="text-slate-600">
                    Review insights and download professional reports
                  </p>
                </ElevatedCard>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-6"
              >
                Try It Free Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="w-full">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
                Trusted by Financial Professionals Worldwide
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                See what our users are saying about their experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <ElevatedCard key={index} className="flex flex-col">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-gold-500 text-gold-500" />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-6 flex-grow">
                    "{testimonial.quote}"
                  </p>
                  <div className="p-4 bg-emerald-50 rounded-lg mb-4">
                    <p className="text-sm font-semibold text-emerald-700">
                      {testimonial.metric}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-navy">{testimonial.name}</p>
                      <p className="text-sm text-slate-600">
                        {testimonial.title} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </ElevatedCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 bg-gradient-to-br from-navy via-navy-800 to-slate-900">
        <div className="w-full">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Your Security is Our Priority
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Enterprise-grade security and compliance you can trust
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <GlassMorphismCard variant="dark" className="text-center">
                <Lock className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">256-bit Encryption</h3>
                <p className="text-slate-300 text-sm">
                  Bank-level encryption protects your data
                </p>
              </GlassMorphismCard>

              <GlassMorphismCard variant="dark" className="text-center">
                <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">SOC 2 Certified</h3>
                <p className="text-slate-300 text-sm">
                  Third-party audited quarterly
                </p>
              </GlassMorphismCard>

              <GlassMorphismCard variant="dark" className="text-center">
                <Award className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">GDPR Compliant</h3>
                <p className="text-slate-300 text-sm">
                  Full data privacy compliance
                </p>
              </GlassMorphismCard>

              <GlassMorphismCard variant="dark" className="text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Regular Audits</h3>
                <p className="text-slate-300 text-sm">
                  Continuous security monitoring
                </p>
              </GlassMorphismCard>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="w-full">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
                Choose the plan that fits your needs. All plans include 14-day free trial.
              </p>
              <div className="inline-flex items-center gap-3 p-1 bg-white rounded-lg border border-slate-200">
                <span className="px-4 py-2 bg-emerald-600 text-white rounded-md font-medium">
                  Monthly
                </span>
                <span className="px-4 py-2 text-slate-600 font-medium">
                  Annual
                  <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    Save 20%
                  </span>
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div key={plan.name}>
                  {plan.popular ? (
                    <GradientBorderCard className="relative h-full">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <span className="inline-block bg-gradient-to-r from-emerald-600 to-gold-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                          MOST POPULAR
                        </span>
                      </div>
                      <div className="space-y-6 h-full flex flex-col">
                        <div>
                          <h3 className="text-2xl font-bold text-navy mb-2">{plan.name}</h3>
                          <p className="text-slate-600 mb-4">{plan.description}</p>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-bold text-navy font-mono">{plan.price}</span>
                            <span className="text-slate-600">/{plan.period}</span>
                          </div>
                        </div>
                        <ul className="space-y-3 flex-grow">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span className="text-slate-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 rounded-xl shadow-emerald-glow"
                          onClick={handleGetStarted}
                        >
                          Start Free Trial
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                        <p className="text-center text-sm text-slate-600">
                          No credit card required
                        </p>
                      </div>
                    </GradientBorderCard>
                  ) : (
                    <ElevatedCard className="h-full">
                      <div className="space-y-6 h-full flex flex-col">
                        <div>
                          <h3 className="text-2xl font-bold text-navy mb-2">{plan.name}</h3>
                          <p className="text-slate-600 mb-4">{plan.description}</p>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-bold text-navy font-mono">{plan.price}</span>
                            <span className="text-slate-600">/{plan.period}</span>
                          </div>
                        </div>
                        <ul className="space-y-3 flex-grow">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
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

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 p-4 bg-white rounded-xl border-2 border-emerald-200 shadow-lg">
                <Shield className="w-6 h-6 text-emerald-600" />
                <span className="font-semibold text-navy">30-Day Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="w-full">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
                Common Questions Answered
              </h2>
              <p className="text-xl text-slate-600">
                Everything you need to know about FraudCheck
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-slate-50 rounded-xl border-2 border-slate-200 px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-navy hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center">
              <p className="text-slate-600 mb-4">Still have questions?</p>
              <Button
                variant="outline"
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-10"></div>

        <div className="w-full relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Start Detecting Fraud Today
            </h2>
            <p className="text-xl text-emerald-100">
              Join 50,000+ investors who trust FraudCheck to protect their investments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-white hover:bg-slate-100 text-emerald-600 px-10 py-7 text-lg font-semibold rounded-xl shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 px-10 py-7 text-lg rounded-xl"
              >
                Contact Sales
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-white text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-navy py-16">
        <div className="w-full">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">FraudCheck</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                AI-powered financial fraud detection using the proven Beneish M-Score model. Trusted by financial professionals worldwide.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-slate-400 hover:text-emerald-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-emerald-400 transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">API Documentation</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Press</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Community</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Webinars</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Status</a></li>
                <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-sm">© 2024 FraudCheck. All rights reserved.</p>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Privacy Policy</a>
                <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Terms of Service</a>
                <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
