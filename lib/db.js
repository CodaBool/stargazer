import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/client'

// Use a global singleton in dev so Next.js hot reload
// does NOT create new PrismaClient instances
const globalForPrisma = globalThis

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg({ connectionString: process.env.POOL_URL })
  globalForPrisma.prisma = new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma

export default prisma
