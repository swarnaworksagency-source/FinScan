import { supabase } from './supabase';

export const PLANS = {
    FREE: {
        id: 'free',
        name: 'Free Starter',
        price: 0,
        limit: 3, // strict limit for free users
        features: ['3 Free Uploads', 'Basic OCR', 'Standard Support']
    },
    PRO: {
        id: 'pro',
        name: 'Professional',
        price: 299000, // IDR
        limit: null, // unlimited
        features: ['Unlimited Uploads', 'Advanced Google OCR', 'Priority Support', 'Export to PDF/Excel']
    }
};

export async function getSubscriptionStatus(userId: string) {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('usage_count, usage_limit, subscription_plan') // Assuming subscription_plan column exists or we infer from usage_limit
        .eq('id', userId)
        .single();

    if (error) throw error;

    // Infer plan from limit
    const isPro = data.usage_limit === null;

    return {
        usageCount: data.usage_count || 0,
        usageLimit: data.usage_limit,
        isPro,
        remainingUploads: data.usage_limit ? Math.max(0, data.usage_limit - (data.usage_count || 0)) : 'Unlimited'
    };
}

export async function checkUploadEligibility(userId: string) {
    const status = await getSubscriptionStatus(userId);

    if (status.isPro) return { allowed: true };

    if (status.usageLimit && status.usageCount >= status.usageLimit) {
        return {
            allowed: false,
            reason: 'limit_reached',
            message: 'You have reached your free upload limit. Please upgrade to continue.'
        };
    }

    return { allowed: true };
}

export async function incrementUploadCount(userId: string) {
    // RPC call is safer for atomic increments, but regular update works for simple cases
    // ideally validation should happen on server side (RLS or database constraints)

    // First get current
    const { data: current } = await supabase
        .from('user_profiles')
        .select('usage_count')
        .eq('id', userId)
        .single();

    if (!current) return;

    const { error } = await supabase
        .from('user_profiles')
        .update({ usage_count: (current.usage_count || 0) + 1 })
        .eq('id', userId);

    if (error) throw error;
}

// SIMULATED Payment Gateway Logic
// In a real app, this would call your backend to create a Stripe Checkout Session
// Real Midtrans Payment Logic
export async function processSubscriptionPayment(userId: string, planId: string) {
    return new Promise((resolve, reject) => {
        console.log(`Processing payment for user ${userId} plan ${planId}`);

        // 1. Call your backend to get the Snap Token
        fetch('http://localhost:5000/api/payment/subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                planId,
                amount: Object.values(PLANS).find(p => p.id === planId)?.price || 299000,
                customerDetails: {
                    // In a real app, pass actual user details here
                    first_name: "Customer",
                    email: "customer@example.com"
                }
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'success') {
                    throw new Error(data.message || 'Failed to initiate payment');
                }

                const token = data.data.token;
                console.log('Received Snap Token:', token);

                // 2. Open Snap Popup
                // @ts-ignore
                window.snap.pay(token, {
                    onSuccess: async function (result: any) {
                        console.log('Payment success:', result);

                        // Update Supabase
                        const updates = {
                            usage_limit: null, // Unlimited
                        };

                        const { error } = await supabase
                            .from('user_profiles')
                            .update(updates)
                            .eq('id', userId);

                        if (error) {
                            reject(new Error('Payment successful but failed to update profile. Please contact support.'));
                        } else {
                            resolve({ success: true, transactionId: result.transaction_id });
                        }
                    },
                    onPending: function (result: any) {
                        console.log('Payment pending:', result);
                        reject(new Error('Payment pending. Please complete the payment.'));
                    },
                    onError: function (result: any) {
                        console.log('Payment error:', result);
                        reject(new Error('Payment failed.'));
                    },
                    onClose: function () {
                        console.log('Customer closed the popup without finishing the payment');
                        reject(new Error('Payment cancelled.'));
                    }
                });
            })
            .catch(error => {
                console.error('Payment Error:', error);
                reject(error);
            });
    });
}
