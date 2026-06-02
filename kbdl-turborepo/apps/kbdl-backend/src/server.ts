import { prisma } from '@repo/db/server';
import { env } from '@repo/validator/server';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import http from 'http';
import morgan from 'morgan';
import { RedisStore } from 'rate-limit-redis';
import authRouter from './auth/auth-routes';
import { initializeQueues } from './config/queues/queue-bootstrap';
import redis from './config/redis';
import { initializeSocketServer } from './config/socket/socket-server';
import leadRouter from './leads/leads-routes';
import notificationRouter from './notifications/notification-routes';
import operationsRouter from './operations/operation-routes';
import profileRouter from './profile/profile-routes';
import shiftSwapRouter from './shift-swap/shift-swap-routes';
import { errorHandler } from './utils/send-error';
import { sendSuccess } from './utils/send-success';

const app = express();
app.set('trust proxy', 1); // Essential if you are behind a reverse proxy (e.g., Nginx, AWS ELB)

const PORT = env.PORT;

app.use(express.json());
app.use(cookieParser());
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.use(morgan('combined'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as any,
  }),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later.',
      },
    });
  },
});

app.use('/api', apiLimiter);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/shift-swap', shiftSwapRouter);
app.use('/api/v1/leads', leadRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/operations', operationsRouter);
app.get('/health', (_req: Request, res: Response) => {
  sendSuccess<null>(res, 'Server is running', null, 200);
});
app.use(errorHandler);

async function bootstrap() {
  try {
    await prisma.$connect();

    await prisma.$queryRaw`SELECT 1`;

    console.log('✅ Database connected');

    await redis.ping();

    /*
      Initialize BullMQ
    */

    initializeQueues();

    /*
      HTTP server
    */

    const server = http.createServer(app);

    /*
      Socket.io
    */

    initializeSocketServer(server);

    /*
      Start server
    */

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    /*
      Graceful shutdown
    */

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down...`);

      server.close(async () => {
        await prisma.$disconnect();

        console.log('✅ Database disconnected');

        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Startup error:', error);

    process.exit(1);
  }
}
bootstrap();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
