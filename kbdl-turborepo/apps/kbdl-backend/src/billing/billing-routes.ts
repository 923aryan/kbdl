// import { Router } from 'express';
// import { authenticate } from '../middleware/auth-middleware';
// import { ROLES } from '../utils/constants';
// import {
//   createRazorpayOrder,
//   getCurrentSubscription,
//   getSubscriptionPlans,
//   getTransactionHistory,
//   verifyRazorpayPayment
// } from './billing-controllers';

// const billingRouter: Router = Router();

// // --- Queries ---

// // GET /api/billing/plans
// // Fetches active SubscriptionPlan records where target = 'employer'
// billingRouter.get('/plans', authenticate([ROLES.EMPLOYER]), getSubscriptionPlans);

// // GET /api/billing/subscription
// // Fetches the active Subscriptions record for the logged-in employer
// billingRouter.get('/subscription', authenticate([ROLES.EMPLOYER]), getCurrentSubscription);

// // GET /api/billing/transactions?status=success
// // Fetches Transaction and joined Order records for the employer's ledger
// billingRouter.get('/transactions', authenticate([ROLES.EMPLOYER]), getTransactionHistory);

// // --- Payment Processing (Razorpay Workflow) ---

// // POST /api/billing/create-order
// // Body: { plan_id: "uuid" }
// // Logic: Talks to Razorpay API to create an order, creates a 'pending' Transaction in DB, returns razorpay_order_id
// billingRouter.post('/create-order', authenticate([ROLES.EMPLOYER]), createRazorpayOrder);

// // POST /api/billing/verify-payment
// // Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
// // Logic: Validates crypto signature using your webhook secret.
// // If valid -> marks Transaction as 'success', updates Subscriptions status to 'active'
// billingRouter.post('/verify-payment', authenticate([ROLES.EMPLOYER]), verifyRazorpayPayment);

// export default billingRouter;
