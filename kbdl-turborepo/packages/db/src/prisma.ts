import { PrismaPg } from '@prisma/adapter-pg';
import { dbEnv } from '@repo/validator/server';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';

const connectionString = dbEnv.DATABASE_URL;
console.log('connection is ', connectionString);
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 10_000,
    timeout: 30_000,
  },
});

export { prisma };
