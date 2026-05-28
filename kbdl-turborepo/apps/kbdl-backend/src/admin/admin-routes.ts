// import { Router } from 'express';
// import { authenticate } from '../middleware/auth-middleware'; // Protects endpoints
// import { ROLES } from '../utils/constants';

// import {
//   cancelUserSubscription,
//   createSubscriptionPlan,
//   deleteLead,
//   getAllActiveSubscriptions,
//   getAllEmployers,
//   getAllJobs,
//   getAllLeads,
//   getAllOrders,
//   getAllShifts,
//   getAllSubscriptionPlans,
//   getAllTransactions,
//   getAllWorkers,
//   getApplicationsForJob,
//   getEmployerById,
//   getEmployerJobs,
//   getEmployerShifts,
//   getEmployerTransactions,
//   getEmployerWorkforce,
//   getJobById,
//   getLeadById,
//   getShiftById,
//   getTransactionById,
//   getWorkerApplications,
//   getWorkerById,
//   getWorkerRatings,
//   getWorkerShiftHistory,
//   matchShiftManually,
//   resolveNoShow,
//   togglePlanStatus,
//   updateApplicationStatus,
//   updateEmployerProfile,
//   updateEmployerSubscription,
//   updateJobStatus,
//   updateLeadStatus,
//   updateOrderStatus,
//   updateShiftStatus,
//   updateSubscriptionPlan,
//   updateWorkerProfile,
//   updateWorkerVerification,
//   verifyEmployer
// } from './admin-controller';

// const adminRouter: Router = Router();

// // Apply administrative guard checking across all operations globally
// adminRouter.use(authenticate([ROLES.ADMIN]));

// // ==========================================
// // 👷 WORKERS MANAGEMENT ROUTES
// // ==========================================
// const adminWorkerRouter: Router = Router();

// // --- Core Data & Search Management ---
// // Supports pagination, text search (?q=phone/name/karigari_id), and filters (?city=&extra_shift=)
// adminWorkerRouter.get('/', getAllWorkers);

// // Fetches deep-dive telemetry profile info for a single user item
// adminWorkerRouter.get('/:id', getWorkerById);

// // --- Profile Overrides & Approvals (Mutations) ---
// // Modifies baseline operational constraints (skills, city, extra_shift flag)
// adminWorkerRouter.patch('/:id/profile', updateWorkerProfile);

// // Explicitly updates verification_level based on physical document vetting
// adminWorkerRouter.patch('/:id/verify', updateWorkerVerification);

// // --- Sub-Resource Audits & Analytics ---
// // Fetches chronological timelines of both Original and Replacement shifts
// adminWorkerRouter.get('/:id/shifts', getWorkerShiftHistory);

// // Monitors historical or current job tracking (applied, shortlisted, hired, rejected)
// adminWorkerRouter.get('/:id/applications', getWorkerApplications);

// // Compares given vs received scores along with flagged disputes
// adminWorkerRouter.get('/:id/ratings', getWorkerRatings);

// adminRouter.use('/workers', adminWorkerRouter);


// // ==========================================
// // 🏢 EMPLOYERS MANAGEMENT ROUTES
// // ==========================================
// const adminEmployerRouter: Router = Router();

// // --- Core Data & Search Management ---
// adminEmployerRouter.get('/', getAllEmployers);

// // Fetches deep-dive profile details for a single employer
// adminEmployerRouter.get('/:id', getEmployerById);

// // --- Profile Overrides & Approvals (Mutations) ---
// // Modifies baseline info (name, address, email, phone)
// adminEmployerRouter.patch('/:id/profile', updateEmployerProfile);

// // Toggles is_verified status based on GST or document verification by admin
// adminEmployerRouter.patch('/:id/verify', verifyEmployer);

// // Manually overrides the string-based subscription_tier 
// adminEmployerRouter.patch('/:id/subscription', updateEmployerSubscription);

// // --- Sub-Resource Audits & Analytics ---
// // Fetches the 'EmployeeEmployment' records to see the active/past workforce for this client
// adminEmployerRouter.get('/:id/workforce', getEmployerWorkforce);

// // Retrieves all Jobs posted by this employer (can filter by JobStatus)
// adminEmployerRouter.get('/:id/jobs', getEmployerJobs);

// // Retrieves all Shifts created by this employer (can filter by ShiftStatus)
// adminEmployerRouter.get('/:id/shifts', getEmployerShifts);

// // Financial audit log: Fetches Transactions and Orders tied to this employer's id
// adminEmployerRouter.get('/:id/transactions', getEmployerTransactions);

// adminRouter.use('/employers', adminEmployerRouter);


// // ==========================================
// // ⚙️ OPERATIONS MANAGEMENT ROUTES
// // ==========================================
// const adminOperationsRouter: Router = Router();

// // --- Shifts ---
// // List shifts with filters (?status=open&date=YYYY-MM-DD)
// adminOperationsRouter.get('/shifts', getAllShifts);

// // Deep dive into a single shift
// adminOperationsRouter.get('/shifts/:id', getShiftById);

// // Admin manually assigns a worker to an unfulfilled shift
// adminOperationsRouter.patch('/shifts/:id/match', matchShiftManually);

// // Generic status updates (e.g., forcing a completion or cancellation)
// adminOperationsRouter.patch('/shifts/:id/status', updateShiftStatus);

// // Specialized route to handle disputes where no_show_reported is true
// adminOperationsRouter.post('/shifts/:id/resolve-dispute', resolveNoShow);

// // --- Job Board ---
// // List jobs with filters (?status=open&employer_id=...)
// adminOperationsRouter.get('/jobs', getAllJobs);

// // View specific job details
// adminOperationsRouter.get('/jobs/:id', getJobById);

// // Pause or close a job (moderation)
// adminOperationsRouter.patch('/jobs/:id/status', updateJobStatus);

// // --- Job Applications ---
// // Get all applications for a specific job
// adminOperationsRouter.get('/jobs/:jobId/applications', getApplicationsForJob);

// // Admin overrides an application status (e.g., pushing from shortlisted to hired)
// adminOperationsRouter.patch('/applications/:appId/status', updateApplicationStatus);

// adminRouter.use('/operations', adminOperationsRouter);


// // ==========================================
// // 💸 FINANCE & SUBSCRIPTIONS ROUTES
// // ==========================================
// const adminFinanceRouter: Router = Router();

// // --- Master Ledger (Transactions) ---
// // List all transactions with filters (?type=payment&status=success&mode=upi)
// adminFinanceRouter.get('/transactions', getAllTransactions);

// // View Razorpay details and relations for a single transaction
// adminFinanceRouter.get('/transactions/:id', getTransactionById);

// // --- Subscription Plans ---
// // Get all plans (both active and inactive)
// adminFinanceRouter.get('/plans', getAllSubscriptionPlans);

// // Create a new pricing tier
// adminFinanceRouter.post('/plans', createSubscriptionPlan);

// // Edit pricing, billing cycle, or feature list of a plan
// adminFinanceRouter.patch('/plans/:id', updateSubscriptionPlan);

// // Soft-delete: toggle `is_active` so users can no longer buy it
// adminFinanceRouter.patch('/plans/:id/status', togglePlanStatus);

// // --- Active Subscriptions ---
// // See who is currently paying for what (?status=active)
// adminFinanceRouter.get('/subscriptions', getAllActiveSubscriptions);

// // Admin manually cancels a subscription (due to dispute or terms violation)
// adminFinanceRouter.patch('/subscriptions/:id/cancel', cancelUserSubscription);

// // --- Orders Management ---
// // View physical/service orders 
// adminFinanceRouter.get('/orders', getAllOrders);

// // Manually override payment_status (e.g., if paid via cash offline)
// adminFinanceRouter.patch('/orders/:id/payment-status', updateOrderStatus);

// adminRouter.use('/finance', adminFinanceRouter);


// // ==========================================
// // 📥 LEADS CRM ROUTES
// // ==========================================
// const adminLeadsRouter: Router = Router();

// // List all leads with filters (?resolved=true/false&search=xyz)
// adminLeadsRouter.get('/', getAllLeads);

// // Fetch a single lead (useful if the message is too large for the initial list payload)
// adminLeadsRouter.get('/:id', getLeadById);

// // Toggle the isResolved boolean
// adminLeadsRouter.patch('/:id/status', updateLeadStatus);

// // Delete spam or junk submissions
// adminLeadsRouter.delete('/:id', deleteLead);

// adminRouter.use('/leads', adminLeadsRouter);

// export default adminRouter;