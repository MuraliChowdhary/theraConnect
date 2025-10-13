"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getMyBookingsHandler = exports.createBookingHandler = exports.getAvailableSlotsHandler = exports.markSessionCompletedHandler = void 0;
const bookingService = __importStar(require("./booking.service"));
const prisma_1 = require("../../utils/prisma");
const notification_service_1 = require("../../services/notification.service");
const markSessionCompletedHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId } = req.params;
        const updatedBooking = yield bookingService.markSessionCompleted(bookingId);
        const parentId = yield prisma_1.prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                parentId: true
            }
        });
        if (!parentId) {
            res.json("parent not found");
            return;
        }
        const sessionCompletedMessage = `
                Hello,

                Your recent session has been successfully completed.

                We hope it was helpful and insightful. You can review session details and any recommendations in your TheraConnect account.

                Thank you for trusting us with your wellness journey.

                Best regards,  
                TheraConnect Team
                `.trim();
        yield (0, notification_service_1.sendNotificationAfterAnEvent)({
            userId: parentId.parentId,
            message: sessionCompletedMessage,
            type: 'SESSION_COMPLETED',
            sendAt: new Date()
        });
        res.status(200).json({
            message: 'Session marked as completed',
            booking: updatedBooking
        });
    }
    catch (error) {
        console.error('[booking.markSessionCompleted][ERROR]', error);
        res.status(400).json({ message: error.message || 'Failed to mark session as completed' });
    }
});
exports.markSessionCompletedHandler = markSessionCompletedHandler;
const getAvailableSlotsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { therapistId, date } = req.query;
        console.log(req.query);
        const slots = yield bookingService.getAvailableSlots(therapistId, date);
        res.status(200).json(slots);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to get slots' });
    }
});
exports.getAvailableSlotsHandler = getAvailableSlotsHandler;
const createBookingHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parentProfile = yield prisma_1.prisma.parentProfile.findUnique({ where: { userId: req.user.userId } });
        if (!parentProfile)
            return res.status(404).json({ message: 'Parent profile not found' });
        const booking = yield bookingService.createBooking(parentProfile.id, req.body);
        const parent = yield prisma_1.prisma.parentProfile.findFirst({
            where: { id: parentProfile.id },
            select: {
                userId: true,
                name: true
            },
        });
        if (!(parent === null || parent === void 0 ? void 0 : parent.userId)) {
            return res.status(404).json({
                message: "Parent does not exist in user profile",
            });
        }
        const findTimeSlot = yield prisma_1.prisma.timeSlot.findUnique({
            where: {
                id: req.body.timeSlotId
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
            return res.status(404).json({ message: "TimeSlot not found" });
        }
        // // Extract the userId string
        const userId = parent.userId;
        const bookingMessage = `
            Hi ${parent.name || 'there'},

            Your session booking has been successfully confirmed!

            Details:
            • Booking ID: ${booking.id}
            • Date & Time: ${findTimeSlot.startTime} - ${findTimeSlot.endTime}

            You can join the session via your TheraConnect dashboard when it's time.

            We look forward to helping you on your wellness journey!

            Warm regards,  
            The TheraConnect Team
            `.trim();
        yield (0, notification_service_1.sendNotificationAfterAnEvent)({
            userId: userId,
            message: bookingMessage,
            type: 'BOOKING_CONFIRMED',
            sendAt: new Date(),
        });
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
        yield (0, notification_service_1.sendNotificationToTherapist)({
            userId: findTimeSlot.therapist.userId,
            message: therapistBookingMessage,
            type: 'BOOKING_CONFIRMED',
            sendAt: new Date(),
        });
        const reminderTime = new Date(new Date(findTimeSlot.startTime).getTime() - 15 * 60 * 1000);
        yield (0, notification_service_1.sendNotification)({
            userId: parent.userId,
            message: `Reminder: Your session starts in 15 minutes.`,
            type: 'SESSION_REMINDER',
            sendAt: reminderTime
        });
        // Schedule Therapist Reminder
        yield (0, notification_service_1.sendNotification)({
            userId: findTimeSlot.therapist.userId,
            message: `Reminder: Your upcoming session starts in 15 minutes.`,
            type: 'SESSION_REMINDER',
            sendAt: reminderTime
        });
        res.status(201).json(booking);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createBookingHandler = createBookingHandler;
const getMyBookingsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield bookingService.getMyBookings(req.user.userId, req.user.role);
        res.status(200).json(bookings);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to retrieve bookings' });
    }
});
exports.getMyBookingsHandler = getMyBookingsHandler;
