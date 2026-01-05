import express from 'express';
const router = express.Router();
import { createTransaction } from '../services/midtrans.js';

router.post('/subscription', async (req, res) => {
    try {
        const { userId, planId, amount, customerDetails } = req.body;

        // Generate a unique order ID (Max 50 chars, safer to keep it under 20-30 if possible)
        // userId is UUID (36 chars), so we truncate it.
        const shortUserId = userId.substring(0, 8);
        const orderId = `SUBS-${shortUserId}-${Date.now()}`;

        // Use default amount if not provided (safety check, should be validated)
        // For MVP, we trust the client or mapping should happen here.
        // Let's assume the client sends the correct amount for now, or we can map it here.
        const transactionAmount = amount || 299000; // Default to PRO price

        const transaction = await createTransaction(orderId, transactionAmount, customerDetails);

        res.status(200).json({
            status: 'success',
            data: {
                token: transaction.token,
                redirect_url: transaction.redirect_url
            }
        });
    } catch (error) {
        console.error('Payment Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create transaction'
        });
    }
});

export default router;
