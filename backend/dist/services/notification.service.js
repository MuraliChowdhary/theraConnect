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
Object.defineProperty(exports, "__esModule", { value: true });
exports.therapistAccountApproved = exports.sendNotificationBookingConfirmed = exports.sendNotificationAfterAnEventSessionCompleted = exports.sendNotificationBookingCancelled = exports.sendNotification = exports.sendNotificationAfterAnEvent = exports.sendNotificationToTherapistSessionBooked = exports.sendNotificationToTherapist = void 0;
const prisma_1 = require("../utils/prisma");
const client_1 = require("@prisma/client");
const sendNotificationToTherapist = (input) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.notification.create({
        data: {
            userId: input.userId,
            message: input.message,
            type: client_1.NotificationType.SESSION_COMPLETED,
            channel: 'EMAIL',
            status: "PENDING",
            sendAt: input.sendAt
        }
    });
});
exports.sendNotificationToTherapist = sendNotificationToTherapist;
const sendNotificationToTherapistSessionBooked = (input) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.notification.create({
        data: {
            userId: input.userId,
            message: input.message,
            type: client_1.NotificationType.BOOKING_CONFIRMED,
            channel: 'EMAIL',
            status: "PENDING",
            sendAt: input.sendAt
        }
    });
});
exports.sendNotificationToTherapistSessionBooked = sendNotificationToTherapistSessionBooked;
const sendNotificationAfterAnEvent = (input) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.notification.create({
        data: {
            userId: input.userId,
            message: input.message,
            type: "REGISTRATION_SUCCESSFUL",
            channel: 'EMAIL',
            status: "PENDING",
            sendAt: input.sendAt
        }
    });
});
exports.sendNotificationAfterAnEvent = sendNotificationAfterAnEvent;
const sendNotification = (input) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.notification.create({
        data: {
            userId: input.userId,
            message: input.message,
            type: client_1.NotificationType.SESSION_REMINDER,
            channel: "EMAIL",
            status: "PENDING",
            sendAt: input.sendAt
        }
    });
});
exports.sendNotification = sendNotification;
const sendNotificationBookingCancelled = (input) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.notification.create({
        data: {
            userId: input.userId,
            message: input.message,
            type: client_1.NotificationType.BOOKING_CANCELLED,
            channel: "EMAIL",
            status: "PENDING",
            sendAt: input.sendAt
        }
    });
});
exports.sendNotificationBookingCancelled = sendNotificationBookingCancelled;
const sendNotificationAfterAnEventSessionCompleted = (input) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.notification.create({
        data: {
            userId: input.userId,
            message: input.message,
            type: client_1.NotificationType.SESSION_COMPLETED,
            channel: 'EMAIL',
            status: "PENDING",
            sendAt: input.sendAt
        }
    });
});
exports.sendNotificationAfterAnEventSessionCompleted = sendNotificationAfterAnEventSessionCompleted;
const sendNotificationBookingConfirmed = (input) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.notification.create({
        data: {
            userId: input.userId,
            message: input.message,
            type: client_1.NotificationType.BOOKING_CONFIRMED,
            channel: 'EMAIL',
            status: "PENDING",
            sendAt: input.sendAt
        }
    });
});
exports.sendNotificationBookingConfirmed = sendNotificationBookingConfirmed;
const therapistAccountApproved = (input) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.notification.create({
        data: {
            userId: input.userId,
            message: input.message,
            type: client_1.NotificationType.THERAPIST_ACCOUNT_APPROVED,
            channel: 'EMAIL',
            status: "PENDING",
            sendAt: input.sendAt
        }
    });
});
exports.therapistAccountApproved = therapistAccountApproved;
