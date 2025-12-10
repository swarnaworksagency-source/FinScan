import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Shield, Crown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS, processSubscriptionPayment } from '@/lib/subscription';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Pricing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // Simulate Stripe/Gateway popup
            await processSubscriptionPayment(user.id, PLANS.PRO.id);

            toast({
                title: "Subscription Active!",
                description: "You have successfully upgraded to the Professional plan.",
                variant: "default",
                className: "bg-green-50 border-green-200 text-green-800"
            });

            // Give user a moment to see the success state
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error: any) {
            toast({
                title: "Payment Failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="text-center mb-16">
                    <h2 className="text-base font-semibold text-emerald-600 tracking-wide uppercase">Pricing</h2>
                    <p className="mt-2 text-4xl font-extrabold text-slate-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Choose the right plan for you
                    </p>
                    <p className="max-w-xl mt-5 mx-auto text-xl text-slate-500">
                        Start for free, upgrade for unlimited power. No hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <Card className="relative flex flex-col p-2 shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-slate-900">{PLANS.FREE.name}</CardTitle>
                            <CardDescription>Perfect for trying out the platform</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-slate-900">Free</span>
                            </div>
                            <ul className="space-y-4">
                                {PLANS.FREE.features.map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <Check className="h-6 w-6 text-green-500" />
                                        </div>
                                        <p className="ml-3 text-base text-slate-600">{feature}</p>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button disabled variant="outline" className="w-full text-lg h-12">
                                Current Plan
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Pro Plan */}
                    <Card className="relative flex flex-col p-2 shadow-xl border-emerald-500 transform scale-105 z-10 bg-white">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-4 py-1 text-sm font-semibold shadow-sm">
                                Recommended
                            </Badge>
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-2xl font-bold text-slate-900">{PLANS.PRO.name}</CardTitle>
                                <Crown className="w-8 h-8 text-amber-400 fill-amber-400" />
                            </div>
                            <CardDescription>For power users who need serious tools</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="mb-6 flex items-baseline">
                                <span className="text-4xl font-bold text-slate-900">IDR {PLANS.PRO.price.toLocaleString()}</span>
                                <span className="ml-2 text-xl text-slate-500">/lifetime</span>
                            </div>
                            <ul className="space-y-4">
                                {PLANS.PRO.features.map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100">
                                                <Check className="h-4 w-4 text-emerald-600" />
                                            </div>
                                        </div>
                                        <p className="ml-3 text-base text-slate-600">{feature}</p>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className="w-full text-lg h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <Zap className="animate-pulse w-5 h-5 mr-2" />
                                        Processing Payment...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        Upgrade Now
                                        <Shield className="w-5 h-5 ml-2" />
                                    </span>
                                )}
                            </Button>
                        </CardFooter>
                        <div className="mt-4 text-xs text-center text-slate-400">
                            Secured by Stripe / Midtrans Payment Gateway
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
