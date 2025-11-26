import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, BarChart3, Shield, FileText, ArrowRight, Lock, Zap,
  Users, TrendingUp, DollarSign, AlertTriangle, Download, Database,
  Link2, Play, Star, Award, CheckCircle, X, UserPlus, Activity, Menu
} from 'lucide-react';

// --- Mocking Auth Context ---
const AuthContext = createContext({ user: null, loading: false });
const useAuth = () => useContext(AuthContext);

// --- Mocking UI Components ---
const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-emerald-600 text-emerald-600 hover:bg-emerald-50 bg-transparent",
    ghost: "hover:bg-slate-100 text-slate-700",
    destructive: "bg-red-500 text-white hover:bg-red-600",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-8 text-lg",
    icon: "h-9 w-9",
  };
  
  return (
    <button 
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Alert = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-slate-100 text-slate-900",
    destructive: "bg-red-100 text-red-900 border border-red-200",
  };
  return (
    <div className={`p-4 rounded-lg flex items-start gap-3 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const AlertDescription = ({ children }) => <div className="text-sm">{children}</div>;

// --- Custom Cards ---
const ElevatedCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-xl border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

const GradientBorderCard = ({ children, className = '' }) => (
  <div className={`relative p-[1px] rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 ${className}`}>
    <div className="bg-white rounded-[11px] p-6 h-full">
      {children}
    </div>
  </div>
);

const GlassMorphismCard = ({ children, variant = 'light', className = '' }) => {
  const variants = {
    light: "bg-white/70 border-white/20 text-slate-800",
    dark: "bg-slate-900/40 border-slate-700/30 text-white",
  };
  return (
    <div className={`backdrop-blur-md border rounded-xl shadow-lg ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const MetricCard = ({ label, value, prefix = '', suffix = '', decimals = 0, className = '' }) => (
  <div className={`text-center p-4 ${className}`}>
    <div className="text-sm text-slate-500 font-medium mb-1">{label}</div>
    <div className="text-3xl font-bold text-navy">
      {prefix}{Number(value).toFixed(decimals)}{suffix}
    </div>
  </div>
);

// --- Sheet/Mobile Menu Mock ---
const Sheet = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      {/* Content */}
      <div className="relative w-[300px] h-full bg-white shadow-2xl p-6 animate-in slide-in-from-right duration-200">
        <button className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full" onClick={() => onOpenChange(false)}>
          <X className="w-5 h-5 text-slate-500" />
        </button>
        {children}
      </div>
    </div>
  );
};
// Sheet Components (Simplified structure for this file)
const SheetTrigger = ({ asChild, children, onClick }) => (
  <div onClick={onClick} className="cursor-pointer">{children}</div>
);
const SheetContent = ({ children }) => <>{children}</>;


// --- Tabs Components ---
const Tabs = ({ value, onValueChange, children, className = '' }) => {
  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, className = '', value, onValueChange }) => (
  <div className={className}>
    {React.Children.map(children, child => {
      return React.cloneElement(child, { 
        isActive: child.props.value === value, 
        onClick: () => onValueChange(child.props.value) 
      });
    })}
  </div>
);

const TabsTrigger = ({ children, isActive, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`${className} ${isActive ? 'data-[state=active]:bg-emerald-600 data-[state=active]:text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'}`}
    data-state={isActive ? 'active' : 'inactive'}
  >
    {children}
  </button>
);

const TabsContent = ({ value: activeValue, value: contentValue, children, className = '' }) => {
  if (activeValue !== contentValue) return null;
  return <div className={`animate-in fade-in zoom-in-95 duration-200 ${className}`}>{children}</div>;
};

// --- Accordion Components ---
const Accordion = ({ type, collapsible, children, className = '' }) => {
  const [openItem, setOpenItem] = useState(null);

  const handleToggle = (value) => {
    setOpenItem(openItem === value ? null : value);
  };

  return (
    <div className={className}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { openItem, onToggle: handleToggle })
      )}
    </div>
  );
};

const AccordionItem = ({ value, openItem, onToggle, children, className = '' }) => (
  <div className={className}>
    {React.Children.map(children, child => 
      React.cloneElement(child, { isOpen: openItem === value, onClick: () => onToggle(value) })
    )}
  </div>
);

const AccordionTrigger = ({ children, isOpen, onClick, className = '' }) => (
  <button onClick={onClick} className={`flex flex-1 items-center justify-between w-full font-medium transition-all [&[data-state=open]>svg]:rotate-180 ${className}`}>
    {children}
    <Activity className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
  </button>
);

const AccordionContent = ({ children, isOpen, className = '' }) => (
  <div className={`overflow-hidden text-sm transition-all ${isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'} ${className}`}>
    {children}
  </div>
);


// --- Main Page Component ---
function LandingPageContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [activeFeatureTab, setActiveFeatureTab] = useState('portfolio');
  const [authError, setAuthError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initial Check
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }

    const error = searchParams.get('error');
    if (error) {
      if (error === 'auth_failed') {
        setAuthError('Authentication failed. Please try again.');
      } else if (error === 'unexpected') {
        setAuthError('An unexpected error occurred.');
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
      period: 'month',
      description: 'Perfect for getting started',
      features: ['3 analyses per month', 'Max 5MB file size', 'Basic M-Score calculation', 'PDF export', 'Email support']
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'month',
      popular: true,
      description: 'For serious investors',
      features: ['50 analyses per month', 'Max 20MB file size', 'Detailed fraud indicators', 'Excel & PDF export', 'Priority email support']
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'month',
      description: 'For teams & advisors',
      features: ['Unlimited analyses', 'Max 50MB file size', 'API access', 'Multi-user accounts', 'Dedicated account manager']
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      title: 'CFO',
      company: 'TechVentures Inc',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 5,
      quote: 'TruReport saved us from a major investment mistake. The M-Score analysis revealed red flags we completely missed.',
      metric: '$2M saved'
    },
    {
      name: 'Michael Chen',
      title: 'Investment Analyst',
      company: 'Capital Growth Partners',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 5,
      quote: 'The automated analysis is incredibly accurate. What used to take me hours now takes minutes.',
      metric: '85% time saved'
    },
    {
      name: 'Emily Rodriguez',
      title: 'Forensic Accountant',
      company: 'Audit Excellence LLC',
      image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200',
      rating: 5,
      quote: 'As a professional auditor, I rely on TruReport for preliminary screening. The accuracy is impressive.',
      metric: '95% accuracy'
    }
  ];

  const faqs = [
    {
      question: 'Is my financial data secure?',
      answer: 'Absolutely. We use bank-level 256-bit encryption for all data transmission and storage. Your data is encrypted at rest and in transit.'
    },
    {
      question: 'How accurate is the Beneish M-Score model?',
      answer: 'The Beneish M-Score model has been academically validated. Our AI-enhanced version improves on this with additional indicators, achieving over 85% accuracy.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time with no penalties. We also offer a 30-day money-back guarantee.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We support Excel (.xlsx, .xls), CSV, and PDF formats. For PDFs, we use advanced OCR technology to extract financial data.'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
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
            
            <div className="flex-shrink-0 cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
               <img 
                 src="/asset/logo.png" 
                 alt="TruReport Logo" 
                 className="h-8 md:h-10 w-auto object-contain"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   document.getElementById('logo-fallback').style.display = 'block';
                 }}
               />
               <h1 id="logo-fallback" style={{display: 'none'}} className="text-xl md:text-2xl font-bold text-navy">TruReport</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden min-[1150px]:flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <a href="#features" className="text-slate-700 hover:text-navy transition-colors font-medium px-4 py-2">Features</a>
              <a href="#how-it-works" className="text-slate-700 hover:text-navy transition-colors font-medium px-4 py-2">How It Works</a>
              <a href="#pricing" className="text-slate-700 hover:text-navy transition-colors font-medium px-4 py-2">Pricing</a>
              <Button variant="outline" onClick={handleGetStarted} size="sm" className="ml-2">Login</Button>
              <Button onClick={handleGetStarted} size="sm">Start Free Trial</Button>
            </nav>

            {/* Mobile Navigation */}
            <div className="min-[1150px]:hidden">
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                  <Menu className="h-6 w-6" />
                </Button>
            </div>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <nav className="flex flex-col gap-6 mt-12">
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-800">Features</a>
                  <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-800">How It Works</a>
                  <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-slate-800">Pricing</a>
                  <div className="flex flex-col gap-3 mt-4">
                    <Button variant="outline" className="w-full justify-center" onClick={() => { handleGetStarted(); setMobileMenuOpen(false); }}>Login</Button>
                    <Button className="w-full justify-center" onClick={() => { handleGetStarted(); setMobileMenuOpen(false); }}>Start Free Trial</Button>
                  </div>
                </nav>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-slate-900/40 to-slate-900"></div>

        <div className="w-full relative z-10">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-8 fade-in-up">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">256-bit Encryption</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Detect Financial Statement<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Fraud based on M-Score</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Professional-grade fraud detection using the proven Beneish M-Score model. Trusted by 50,000+ investors and analysts worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button size="lg" onClick={handleGetStarted} className="w-full sm:w-auto px-8 py-6 text-lg shadow-emerald-500/25 shadow-lg">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white">
                <Play className="mr-2 w-5 h-5" /> Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 pt-8 text-slate-400 text-sm">
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> No credit card required</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 14-day free trial</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-slate-600 mb-8 font-medium">Trusted by leading companies</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <MetricCard label="Assets Protected" value={10} prefix="$" suffix="B+" className="bg-transparent" />
            <MetricCard label="Active Users" value={50000} suffix="+" className="bg-transparent" />
            <MetricCard label="Fraud Detected" value={95} suffix="%" className="bg-transparent" />
            <MetricCard label="Uptime" value={99.99} suffix="%" decimals={2} className="bg-transparent" />
          </div>
        </div>
      </section>

      {/* Feature Tabs Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Everything you need to analyze financial statements and detect manipulation.</p>
          </div>

          <Tabs value={activeFeatureTab} onValueChange={setActiveFeatureTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-12 bg-slate-100 p-2 rounded-xl gap-2">
              <TabsTrigger value="portfolio" className="rounded-lg py-3"><BarChart3 className="w-4 h-4 mr-2 inline" /> Analysis</TabsTrigger>
              <TabsTrigger value="tracking" className="rounded-lg py-3"><Shield className="w-4 h-4 mr-2 inline" /> Detection</TabsTrigger>
              <TabsTrigger value="reports" className="rounded-lg py-3"><FileText className="w-4 h-4 mr-2 inline" /> Reports</TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg py-3"><Lock className="w-4 h-4 mr-2 inline" /> Security</TabsTrigger>
            </TabsList>

            {/* Analysis Tab */}
            <TabsContent value="portfolio" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900">Automated Financial Analysis</h3>
                  <p className="text-slate-600 leading-relaxed">Upload financial statements and get instant, comprehensive analysis using the Beneish M-Score model with OCR Technology.</p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> <span>8 key financial ratio calculations</span></li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> <span>Real-time M-Score computation</span></li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> <span>Historical trend analysis</span></li>
                  </ul>
                </div>
                <ElevatedCard>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <Database className="w-6 h-6 text-emerald-600" />
                      <span className="font-semibold text-slate-900">Supported Formats</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {['Excel', 'CSV', 'PDF'].map(fmt => (
                        <div key={fmt} className="p-4 border border-slate-200 rounded-lg text-center hover:border-emerald-500 transition-colors cursor-default">
                          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <span className="text-sm font-medium text-slate-700">{fmt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ElevatedCard>
              </div>
            </TabsContent>

            {/* Detection Tab */}
            <TabsContent value="tracking" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900">Advanced Fraud Detection</h3>
                  <p className="text-slate-600 leading-relaxed">Identify manipulation indicators using proven financial ratios.</p>
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-3xl font-bold text-emerald-600">85%+</span>
                    <div className="text-sm text-slate-700"><strong>Detection Accuracy</strong><br/>Validated across thousands of cases</div>
                  </div>
                </div>
                <ElevatedCard>
                  <h4 className="font-semibold text-slate-900 mb-4">M-Score Components</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['DSRI', 'GMI', 'AQI', 'SGI', 'DEPI', 'SGAI', 'LVGI', 'TATA'].map((component) => (
                      <div key={component} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-mono text-sm font-semibold text-slate-900">{component}</span>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                    ))}
                  </div>
                </ElevatedCard>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900">Professional Reports</h3>
                  <p className="text-slate-600">Generate comprehensive PDF and Excel reports with detailed analysis.</p>
                  <Button className="mt-4">View Sample Report</Button>
                </div>
                <ElevatedCard>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <span className="font-medium text-slate-900">PDF Export</span>
                      <Download className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <span className="font-medium text-slate-900">Excel Export</span>
                      <Download className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </ElevatedCard>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-slate-900">Bank-Level Security</h3>
                  <p className="text-slate-600">Your financial data is protected with enterprise-grade security measures.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3"><Lock className="w-5 h-5 text-emerald-600" /> 256-bit AES encryption</li>
                    <li className="flex items-center gap-3"><Shield className="w-5 h-5 text-emerald-600" /> SOC 2 Type II certified</li>
                  </ul>
                </div>
                <ElevatedCard>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg"><Lock className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-sm font-semibold">Encrypted</p></div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg"><Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-sm font-semibold">Protected</p></div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg"><Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-sm font-semibold">Certified</p></div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg"><CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" /><p className="text-sm font-semibold">Compliant</p></div>
                  </div>
                </ElevatedCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Simple Pricing</h2>
            <p className="text-slate-600">Choose the plan that fits your needs.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className="flex">
                {plan.popular ? (
                  <GradientBorderCard className="w-full">
                    <div className="space-y-6">
                      <div>
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Popular</span>
                        <h3 className="text-2xl font-bold text-slate-900 mt-2">{plan.name}</h3>
                        <p className="text-slate-500">{plan.description}</p>
                      </div>
                      <div className="text-4xl font-bold text-slate-900">{plan.price}<span className="text-lg font-normal text-slate-500">/{plan.period}</span></div>
                      <ul className="space-y-3">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {f}</li>
                        ))}
                      </ul>
                      <Button className="w-full" onClick={handleGetStarted}>Start Free Trial</Button>
                    </div>
                  </GradientBorderCard>
                ) : (
                  <ElevatedCard className="w-full flex flex-col justify-between">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                        <p className="text-slate-500">{plan.description}</p>
                      </div>
                      <div className="text-4xl font-bold text-slate-900">{plan.price}<span className="text-lg font-normal text-slate-500">/{plan.period}</span></div>
                      <ul className="space-y-3">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {f}</li>
                        ))}
                      </ul>
                    </div>
                    <Button variant="outline" className="w-full mt-6" onClick={handleGetStarted}>Get Started</Button>
                  </ElevatedCard>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">FAQ</h2>
          <Accordion className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-slate-50 rounded-lg px-6 border border-slate-200">
                <AccordionTrigger className="py-4 text-left font-medium text-slate-900">{faq.question}</AccordionTrigger>
                <AccordionContent className="pb-4 text-slate-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-700 text-white text-center relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-8">
          <h2 className="text-4xl font-bold">Start Detecting Fraud Today</h2>
          <p className="text-emerald-100 text-xl">Join 50,000+ investors who trust TruReport.</p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50" onClick={handleGetStarted}>Get Started Free</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-white font-bold text-xl mb-4">TruReport</h3>
            <p className="text-sm">Advanced fraud detection for modern investors.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400">Features</a></li>
              <li><a href="#" className="hover:text-emerald-400">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400">About</a></li>
              <li><a href="#" className="hover:text-emerald-400">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400">Privacy</a></li>
              <li><a href="#" className="hover:text-emerald-400">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-sm border-t border-slate-800 pt-8">
          © 2024 TruReport. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// --- Main App Export ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageContent />} />
        <Route path="*" element={<LandingPageContent />} />
      </Routes>
    </BrowserRouter>
  );
}