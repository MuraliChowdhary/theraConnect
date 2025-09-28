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
exports.bookSlot = exports.generateAndGetAvailableSlots = void 0;
const client_1 = require("@prisma/client");
const notification_service_1 = require("../../services/notification.service");
const prisma = new client_1.PrismaClient();
/**
 * Checks if a given time falls within any of the therapist's breaks.
 */
function isTimeInBreak(time, breaks, date) {
    for (const breakItem of breaks) {
        const breakStart = new Date(`${date}T${breakItem.startTime}:00.000Z`);
        const breakEnd = new Date(`${date}T${breakItem.endTime}:00.000Z`);
        if (time >= breakStart && time < breakEnd) {
            return true;
        }
    }
    return false;
}
/**
 * Generate slots for a day if not exists, then return available ones.
 */
const generateAndGetAvailableSlots = (therapistId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const therapist = yield prisma.therapistProfile.findUnique({
        where: { id: therapistId },
        include: { breaks: true },
    });
    if (!therapist)
        throw new Error('Therapist not found');
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const existingSlotsCount = yield prisma.timeSlot.count({
        where: { therapistId, startTime: { gte: dayStart, lte: dayEnd } },
    });
    if (existingSlotsCount === 0) {
        const slotsToCreate = [];
        let currentSlotTime = new Date(`${date}T${therapist.scheduleStartTime}:00.000Z`);
        const { slotDurationInMinutes, breaks, maxSlotsPerDay } = therapist;
        while (slotsToCreate.length < maxSlotsPerDay) {
            const slotEndTime = new Date(currentSlotTime.getTime() + slotDurationInMinutes * 60000);
            if (!isTimeInBreak(currentSlotTime, breaks, date)) {
                slotsToCreate.push({
                    therapistId,
                    startTime: new Date(currentSlotTime),
                    endTime: slotEndTime,
                });
            }
            currentSlotTime = slotEndTime;
        }
        if (slotsToCreate.length > 0) {
            yield prisma.timeSlot.createMany({ data: slotsToCreate });
        }
    }
    return prisma.timeSlot.findMany({
        where: {
            therapistId,
            isBooked: false,
            startTime: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { startTime: 'asc' },
    });
});
exports.generateAndGetAvailableSlots = generateAndGetAvailableSlots;
/**
 * Book a slot for a child and queue notifications asynchronously.
 */
const bookSlot = (parentId, childId, timeSlotId) => __awaiter(void 0, void 0, void 0, function* () {
    let slot;
    let child;
    let newBooking;
    yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        slot = yield tx.timeSlot.findFirstOrThrow({
            where: { id: timeSlotId, isBooked: false },
            include: { therapist: { include: { user: true } } },
        });
        yield tx.timeSlot.update({
            where: { id: timeSlotId },
            data: { isBooked: true },
        });
        child = yield tx.child.findFirstOrThrow({
            where: { id: childId, parentId },
            include: { parent: { include: { user: true } } },
        });
        newBooking = yield tx.booking.create({
            data: {
                parentId,
                childId,
                therapistId: slot.therapistId,
                timeSlotId: slot.id,
            },
        });
    }));
    // Queue notifications outside transaction (non-blocking)
    const notificationsToQueue = [
        {
            userId: slot.therapist.user.id,
            type: 'BOOKING_CONFIRMED',
            channel: 'EMAIL', // Use NotificationChannel properly
            message: `New booking confirmed with ${child.name} on ${slot.startTime.toLocaleDateString()}.`,
            sendAt: new Date(Date.now() + 5 * 60 * 1000),
        },
        {
            userId: child.parent.user.id,
            type: 'BOOKING_CONFIRMED',
            channel: 'EMAIL',
            message: `Your booking for ${child.name} is confirmed for ${slot.startTime.toLocaleString()}.`,
            sendAt: new Date(Date.now() + 5 * 60 * 1000),
        },
    ];
    yield Promise.all(notificationsToQueue.map((notif) => (0, notification_service_1.sendNotification)(notif)));
    return newBooking;
});
exports.bookSlot = bookSlot;
