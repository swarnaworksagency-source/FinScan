import midtransClient from 'midtrans-client';
import { config } from '../config.js';

// Create Snap API instance
let snap = new midtransClient.Snap({
    isProduction: config.IS_PRODUCTION,
    serverKey: config.MIDTRANS_SERVER_KEY
});

export const createTransaction = async (orderId, amount, customerDetails) => {
    let parameter = {
        transaction_details: {
            order_id: orderId,
            gross_amount: amount
        },
        credit_card: {
            secure: true
        },
        customer_details: customerDetails,
        // Payment Methods Order:
        // 1. Credit/Debit Card
        // 2. Virtual Account (Bank Transfer)
        // 3. QRIS
        enabled_payments: [
            // 1. Credit/Debit Card (Visa, Mastercard, JCB, Amex)
            'credit_card',

            // 2. Virtual Account (Bank Transfer)
            'bca_va',
            'bni_va',
            'bri_va',
            'permata_va',

            // 3. QRIS - Universal QR Code
            'other_qris'
        ]
    };

    try {
        const transaction = await snap.createTransaction(parameter);
        return transaction;
    } catch (error) {
        throw error;
    }
};
