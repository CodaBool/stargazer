import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/client'

// Use a global singleton in dev so Next.js hot reload
// does NOT create new PrismaClient instances
// https://www.prisma.io/docs/getting-started/prisma-postgres/quickstart/prisma-orm
const globalForPrisma = globalThis

if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.POOL_URL })
    })
}

const prisma = globalForPrisma.prisma

export default prisma
