import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/payment.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('Midtrans Payment Server is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});