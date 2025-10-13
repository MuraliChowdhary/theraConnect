"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// notification.worker.ts
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const email_service_1 = require("./email.service");
const prisma = new client_1.PrismaClient();
node_cron_1.default.schedule("* * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const pendingNotifications = yield prisma.notification.findMany({
        where: {
            status: "PENDING",
            sendAt: { lte: new Date() }
        }
    });
    for (const notif of pendingNotifications) {
        const user = yield prisma.user.findUnique({ where: { id: notif.userId } });
        if (!(user === null || user === void 0 ? void 0 : user.email)) {
            yield prisma.notification.update({
                where: { id: notif.id },
                data: { status: "FAILED" }
            });
            continue;
        }
        const result = yield (0, email_service_1.sendemail)(user.email, notif.message);
        yield prisma.notification.update({
            where: { id: notif.id },
            data: { status: result.success ? "SENT" : "FAILED" }
        });
    }
}));
