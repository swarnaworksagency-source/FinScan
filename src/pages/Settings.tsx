import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const planDetails: Record<string, { name: string; price: string; features: string[] }> = {
  free: {
    name: 'Free',
    price: '$0',
    features: ['3 analyses per month', 'Max 5MB file size', 'Basic M-Score calculation', 'PDF export']
  },
  professional: {
    name: 'Professional',
    price: '$29/month',
    features: [
      '50 analyses per month',
      'Max 20MB file size',
      'Detailed fraud indicators',
      'Excel export',
      'Email support'
    ]
  },
  enterprise: {
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
};

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and subscription</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <p className="font-semibold">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-slate-600">Account ID</label>
            <p className="font-semibold font-mono text-sm">{user?.id}</p>
          </div>
          <div>
            <label className="text-sm text-slate-600">Member since</label>
            <p className="font-semibold">{new Date(user?.created_at || '').toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Upgrade or downgrade your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(planDetails).map(([key, plan]) => (
              <div
                key={key}
                className="border rounded-lg p-6"
              >
                <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                <p className="text-2xl font-bold mb-4">{plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">
                  Select Plan
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
