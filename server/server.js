import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import loanRoutes from './routes/loans.js';
import transactionRoutes from './routes/transactions.js';
import userRoutes from './routes/users.js';
import connectDB from './config/database.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);

// Database connection
connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is runing at port: ${process.env.PORT}`);
    });
});