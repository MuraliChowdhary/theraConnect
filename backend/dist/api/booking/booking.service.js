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
exports.getMyBookings = exports.createBooking = exports.getAvailableSlots = exports.markSessionCompleted = void 0;
const client_1 = require("@prisma/client");
const notification_service_1 = require("../../services/notification.service");
const prisma_1 = require("../../utils/prisma");
const markSessionCompleted = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            parent: { include: { user: true } },
            therapist: { include: { user: true } },
            child: true,
        },
    });
    if (!booking) {
        throw new Error('Booking not found');
    }
    if (booking.status !== 'SCHEDULED') {
        throw new Error('Session can only be completed if it was scheduled');
    }
    const updatedBooking = yield prisma_1.prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            isCompleted: true,
        },
        include: {
            parent: { include: { user: true } },
            therapist: { include: { user: true } },
            child: true,
        },
    });
    // Send notifications
    yield (0, notification_service_1.sendNotification)({
        userId: booking.parent.userId,
        message: `Session with ${booking.therapist.name} for ${booking.child.name} has been completed. Please provide your feedback.`,
        sendAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes later
    });
    yield (0, notification_service_1.sendNotification)({
        userId: booking.therapist.userId,
        message: `Session with ${booking.child.name} has been completed. Please create a session report.`,
        sendAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes later
    });
    return updatedBooking;
});
exports.markSessionCompleted = markSessionCompleted;
const getAvailableSlots = (therapistId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    console.log('[booking.service.getAvailableSlots] window', { startOfDay: startOfDay.toISOString(), endOfDay: endOfDay.toISOString(), therapistId });
    const slots = yield prisma_1.prisma.timeSlot.findMany({
        where: {
            therapistId,
            isBooked: false,
            isActive: true,
            startTime: { gte: startOfDay, lte: endOfDay },
            therapist: { status: client_1.TherapistStatus.ACTIVE },
        },
        // where: {
        //     therapistId,
        //     isBooked: false,
        //     ...( { isActive: true } as any ),
        //     startTime: { gte: startOfDay, lte: endOfDay },
        //     therapist: { status: TherapistStatus.ACTIVE },
        //   },
        orderBy: { startTime: 'asc' },
    });
    console.log('[booking.service.getAvailableSlots] found', slots.length);
    return slots;
});
exports.getAvailableSlots = getAvailableSlots;
const createBooking = (parentId, input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { childId, timeSlotId } = input;
    const timeSlot = yield prisma_1.prisma.timeSlot.findFirst({
        where: { id: timeSlotId, isBooked: false },
        include: { therapist: true },
    });
    if (!timeSlot)
        throw new Error('This time slot is not available.');
    if (timeSlot.therapist.status !== client_1.TherapistStatus.ACTIVE) {
        throw new Error('This therapist is not available for booking.');
    }
    const child = yield prisma_1.prisma.child.findFirst({
        where: { id: childId, parentId },
    });
    if (!child)
        throw new Error('Child not found or does not belong to this parent.');
    const parent = yield prisma_1.prisma.parentProfile.findUnique({ where: { id: parentId } });
    const finalFee = (_a = parent === null || parent === void 0 ? void 0 : parent.customFee) !== null && _a !== void 0 ? _a : timeSlot.therapist.baseCostPerSession;
    const booking = yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.timeSlot.update({ where: { id: timeSlotId }, data: { isBooked: true } });
        const newBooking = yield tx.booking.create({
            data: {
                parentId,
                childId,
                therapistId: timeSlot.therapistId,
                timeSlotId,
            },
        });
        yield tx.payment.create({
            data: {
                bookingId: newBooking.id,
                parentId,
                therapistId: timeSlot.therapistId,
                amount: finalFee,
            }
        });
        yield tx.dataAccessPermission.create({
            data: {
                bookingId: newBooking.id,
                childId,
                therapistId: timeSlot.therapistId,
                canViewDetails: false, // Default to false
                accessStartTime: timeSlot.startTime,
                accessEndTime: timeSlot.endTime,
            }
        });
        return newBooking;
    }));
    if (!parent)
        throw new Error('Parent profile not found');
    if (!parent.userId)
        throw new Error('Parent userId not found');
    const findTimeSlot = yield prisma_1.prisma.timeSlot.findUnique({
        where: {
            id: timeSlotId
        },
        select: {
            startTime: true,
            endTime: true,
            therapist: {
                select: {
                    userId: true,
                    name: true
                }
            }
        }
    });
    if (!findTimeSlot) {
        throw new Error("TimeSlot not found");
    }
    const userId = parent.userId;
    const bookingMessage = `Hi ${parent.name || 'there'},

            Your session booking has been successfully confirmed!

            Details:
            • Booking ID: ${booking.id}
            • Date & Time: ${findTimeSlot.startTime} - ${findTimeSlot.endTime}

            You can join the session via your TheraConnect dashboard when it's time.

            We look forward to helping you on your wellness journey!

            Warm regards,  
            The TheraConnect Team
            `.trim();
    const therapistBookingMessage = `
                Hi ${findTimeSlot.therapist.name || 'there'},

                Good news! A parent has booked a session with you.

                Session Details:
                • Date & Time: ${findTimeSlot.startTime.toLocaleString()} - ${findTimeSlot.endTime.toLocaleString()}
                • Booking ID: ${booking.id}

                Please make sure to prepare for the session and be ready at the scheduled time.

                Thank you for providing your expertise and support to our clients.

                Best regards,
                TheraConnect Team
                `.trim();
    yield (0, notification_service_1.sendNotificationToTherapistSessionBooked)({
        userId: timeSlot.therapist.userId,
        message: therapistBookingMessage,
        sendAt: new Date()
    });
    yield (0, notification_service_1.sendNotificationAfterAnEvent)({
        userId: parent.userId,
        message: bookingMessage,
        sendAt: new Date()
    });
    return booking;
});
exports.createBooking = createBooking;
const getMyBookings = (userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const whereClause = role === client_1.Role.PARENT
        ? { parent: { userId } }
        : { therapist: { userId, status: client_1.TherapistStatus.ACTIVE } };
    // Include child information for parents
    const includeForParent = {
        child: true,
        therapist: { select: { name: true, specialization: true } },
        parent: { select: { name: true } },
        timeSlot: true,
        SessionFeedback: true,
        sessionReport: true,
        ConsentRequest: true,
    };
    // For therapists, include child data only if consent is given
    const includeForTherapist = {
        child: {
            select: {
                id: true,
                name: true,
                age: true,
                condition: true,
                notes: true,
                address: true,
            }
        },
        therapist: { select: { name: true, specialization: true } },
        parent: { select: { name: true } },
        timeSlot: true,
        SessionFeedback: true,
        sessionReport: true,
        ConsentRequest: true,
    };
    const bookings = yield prisma_1.prisma.booking.findMany({
        where: whereClause,
        include: role === client_1.Role.PARENT ? includeForParent : includeForTherapist,
        orderBy: { timeSlot: { startTime: 'desc' } },
    });
    // For therapists, filter out child details if consent is not given
    if (role === client_1.Role.THERAPIST) {
        return bookings.map((booking) => {
            var _a, _b, _c;
            const hasConsent = ((_a = booking.ConsentRequest) === null || _a === void 0 ? void 0 : _a.status) === 'GRANTED';
            return Object.assign(Object.assign({}, booking), { child: hasConsent ? booking.child : {
                    id: (_b = booking.child) === null || _b === void 0 ? void 0 : _b.id,
                    name: (_c = booking.child) === null || _c === void 0 ? void 0 : _c.name,
                    age: undefined,
                    condition: undefined,
                    notes: undefined,
                    address: undefined,
                } });
        });
    }
    return bookings;
});
exports.getMyBookings = getMyBookings;
