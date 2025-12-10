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
export async function processSubscriptionPayment(userId: string, planId: string) {
    return new Promise((resolve, reject) => {
        console.log(`Processing payment for user ${userId} plan ${planId}`);

        // Simulate network delay
        setTimeout(async () => {
            // 90% success rate simulation
            if (Math.random() < 0.1) {
                reject(new Error('Payment failed. Please try again.'));
                return;
            }

            // On success, update the user profile
            const updates = {
                usage_limit: null, // Unlimited
                // We could store subscription_id, etc.
            };

            const { error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', userId);

            if (error) {
                reject(error);
            } else {
                resolve({ success: true, transactionId: 'TXN_' + Math.floor(Math.random() * 1000000) });
            }
        }, 2000);
    });
}
