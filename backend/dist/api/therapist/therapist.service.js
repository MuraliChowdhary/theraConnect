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
exports.requestLeave = exports.createTimeSlots = exports.getTherapistProfile = void 0;
const client_1 = require("@prisma/client");
const notification_service_1 = require("../../services/notification.service");
const prisma = new client_1.PrismaClient();
const getTherapistProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma.therapistProfile.findUnique({ where: { userId } });
});
exports.getTherapistProfile = getTherapistProfile;
const createTimeSlots = (therapistId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const slotsData = input.slots.map(slot => ({
        therapistId,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
    }));
    return prisma.timeSlot.createMany({
        data: slotsData,
    });
});
exports.createTimeSlots = createTimeSlots;
const requestLeave = (therapistId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const therapist = yield prisma.therapistProfile.findUnique({ where: { id: therapistId } });
    if (!therapist)
        throw new Error('Therapist not found.');
    if (therapist.leavesRemainingThisMonth <= 0)
        throw new Error('No leaves remaining.');
    const leaveDate = new Date(input.date);
    const startOfDay = new Date(leaveDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(leaveDate.setUTCHours(23, 59, 59, 999));
    const affectedBookings = yield prisma.booking.findMany({
        where: {
            therapistId,
            status: 'SCHEDULED',
            timeSlot: { startTime: { gte: startOfDay, lte: endOfDay } },
        },
        include: { parent: { include: { user: true } }, timeSlot: true },
    });
    yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.therapistLeave.create({ data: { therapistId, date: startOfDay, type: input.type, reason: input.reason } });
        yield tx.therapistProfile.update({ where: { id: therapistId }, data: { leavesRemainingThisMonth: { decrement: 1 } } });
        for (const booking of affectedBookings) {
            yield tx.booking.update({ where: { id: booking.id }, data: { status: client_1.BookingStatus.CANCELLED_BY_THERAPIST } });
            yield tx.timeSlot.update({ where: { id: booking.timeSlotId }, data: { isBooked: false } });
        }
    }));
    for (const booking of affectedBookings) {
        yield (0, notification_service_1.sendNotification)({
            userId: booking.parent.userId,
            type: 'BOOKING_CANCELLED',
            message: `Your session for ${booking.timeSlot.startTime.toLocaleDateString()} has been cancelled as the therapist is unavailable.`,
            sendAt: new Date()
        });
    }
    return { message: 'Leave approved and affected bookings have been cancelled.' };
});
exports.requestLeave = requestLeave;
