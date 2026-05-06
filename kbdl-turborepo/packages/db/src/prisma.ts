import { PrismaPg } from "@prisma/adapter-pg";
import { dbEnv } from "@repo/validator/server";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";

const connectionString = dbEnv.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
