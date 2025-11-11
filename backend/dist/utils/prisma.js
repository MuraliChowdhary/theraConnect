"use strict";
// import { PrismaClient } from '@prisma/client'
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.executeQuery = executeQuery;
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
const client_1 = require("@prisma/client");
// Create a function that ensures connection
const createPrismaClient = () => {
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        errorFormat: 'minimal',
    });
};
// Singleton pattern
const globalForPrisma = globalThis;
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : createPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
// Helper function to execute queries with auto-reconnect
function executeQuery(operation) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            return yield operation(exports.prisma);
        }
        catch (error) {
            // If connection closed, reconnect and retry once
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Closed')) || error.code === 'P1017') {
                console.log('Connection closed, reconnecting...');
                yield exports.prisma.$connect();
                return yield operation(exports.prisma);
            }
            throw error;
        }
    });
}
exports.default = exports.prisma;
