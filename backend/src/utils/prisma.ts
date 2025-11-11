// import { PrismaClient } from '@prisma/client'

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log:
//       process.env.NODE_ENV === 'development'
//         ? ['error', 'warn']
//         : ['error'],
//     errorFormat: 'minimal',
//   })

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prisma
// }

// export default prisma

import { PrismaClient } from '@prisma/client'

// Create a function that ensures connection
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  })
}

// Singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper function to execute queries with auto-reconnect
export async function executeQuery<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await operation(prisma)
  } catch (error: any) {
    // If connection closed, reconnect and retry once
    if (error.message?.includes('Closed') || error.code === 'P1017') {
      console.log('Connection closed, reconnecting...')
      await prisma.$connect()
      return await operation(prisma)
    }
    throw error
  }
}

export default prisma