import { supabase } from './supabase';

export const PLANS = {
    FREE: {
        id: 'free',
        name: 'Free Starter',
        price: 0,
        limit: 3, // 3 free uploads per month
        features: ['3 Free Uploads/Month', 'GPT-4o AI Analysis', 'Basic Support', 'Standard Report']
    },
    PRO: {
        id: 'pro',
        name: 'Professional',
        price: 155000, // IDR (~$9.99 USD)
        limit: 50, // 50 uploads per month
        features: ['50 Uploads/Month', 'GPT-4o Premium Analysis', 'Priority Support', 'Export to PDF/Excel', 'Advanced Analytics Dashboard']
    }
};

export async function getSubscriptionStatus(userId: string) {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('usage_count, usage_limit, role')
        .eq('id', userId)
        .single();

    if (error) throw error;

    // Admin always has unlimited access
    const isAdmin = data.role === 'admin';
    // Pro = usage_limit is null (unlimited) OR admin
    const isPro = data.usage_limit === null || isAdmin;

    return {
        usageCount: data.usage_count || 0,
        usageLimit: data.usage_limit,
        isPro,
        isAdmin,
        remainingUploads: isPro ? 'Unlimited' : Math.max(0, (data.usage_limit || 0) - (data.usage_count || 0))
    };
}

export async function checkUploadEligibility(userId: string) {
    const status = await getSubscriptionStatus(userId);

    // Admin or Pro users always allowed
    if (status.isAdmin || status.isPro) {
        return { allowed: true };
    }

    // Free user - check limits
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

// Real Midtrans Payment Logic
export async function processSubscriptionPayment(userId: string, planId: string) {
    return new Promise((resolve, reject) => {
        // Call backend to get the Snap Token
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

                // Open Snap Popup
                // @ts-ignore
                window.snap.pay(token, {
                    onSuccess: async function (result: any) {
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
                    onPending: function (_result: any) {
                        reject(new Error('Payment pending. Please complete the payment.'));
                    },
                    onError: function (_result: any) {
                        reject(new Error('Payment failed.'));
                    },
                    onClose: function () {
                        // Payment cancelled by user - resolve with cancelled status (not an error)
                        resolve({ success: false, cancelled: true });
                    }
                });
            })
            .catch(error => {
                reject(error);
            });
    });
}
