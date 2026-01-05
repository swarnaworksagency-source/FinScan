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
        enabled_payments: ['gopay', 'shopeepay', 'bri_va', 'bni_va']
    };

    try {
        const transaction = await snap.createTransaction(parameter);
        return transaction;
    } catch (error) {
        throw error;
    }
};
