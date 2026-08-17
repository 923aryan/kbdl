import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';

loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const companies = await prisma.$queryRaw`
  SELECT c.id, c.company_name,
    COUNT(ee.id)::int AS total,
    COUNT(ee.id) FILTER (WHERE ee.is_active)::int AS active
  FROM companies c
  LEFT JOIN employee_employments ee ON ee.company_id = c.id
  GROUP BY c.id, c.company_name
  ORDER BY active DESC
  LIMIT 10
`;

console.log('Companies:', JSON.stringify(companies, null, 2));
console.log('workforce_persons:', await prisma.workforcePerson.count());
console.log('employments:', await prisma.employeeEmployment.count());

const cols = await prisma.$queryRaw`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'employee_employments' AND column_name IN ('workforce_person_id', 'user_id')
`;
console.log('employment columns:', cols);

await prisma.$disconnect();
