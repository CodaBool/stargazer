import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/client'

const adapter = new PrismaPg({ connectionString: `${process.env.DIRECT_URL}` })
const prisma = new PrismaClient({ adapter })

export default prisma
