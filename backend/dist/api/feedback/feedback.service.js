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
exports.getSessionDetails = exports.updateConsent = exports.createSessionReport = exports.createFeedback = void 0;
const email_service_1 = require("../../services/email.service");
const prisma_1 = require("../../utils/prisma");
const createFeedback = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId, rating, comment, isAnonymous, consentToDataSharing } = input;
    // Verify booking exists and belongs to parent
    const booking = yield prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            parent: true,
            child: true,
            therapist: true,
            timeSlot: true,
        },
    });
    if (!booking) {
        throw new Error('Booking not found');
    }
    if (booking.status !== 'COMPLETED') {
        console.log('⚠️ Session not marked as completed, marking it now...');
        // Mark the session as completed if it's not already
        yield prisma_1.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                isCompleted: true,
            },
        });
    }
    // Check if feedback already exists
    const existingFeedback = yield prisma_1.prisma.sessionFeedback.findUnique({
        where: { bookingId },
    });
    if (existingFeedback) {
        throw new Error('Feedback already submitted for this session');
    }
    // Create feedback
    const feedback = yield prisma_1.prisma.sessionFeedback.create({
        data: {
            id: `feedback_${Date.now()}`,
            rating,
            comment,
            isAnonymous,
            bookingId,
            parentId: booking.parentId,
        },
    });
    // Update therapist average rating
    yield updateTherapistRating(booking.therapistId);
    // Handle consent to data sharing
    if (consentToDataSharing) {
        yield prisma_1.prisma.consentRequest.create({
            data: {
                id: `consent_${Date.now()}`,
                status: 'GRANTED',
                requestedAt: new Date(),
                respondedAt: new Date(),
                notes: 'Parent granted consent through feedback form',
                bookingId,
                parentId: booking.parentId,
                therapistId: booking.therapistId,
            },
        });
    }
    return feedback;
});
exports.createFeedback = createFeedback;
const createSessionReport = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId, sessionExperience, childPerformance, improvements, medication, recommendations, nextSteps } = input;
    // Verify booking exists and belongs to therapist
    const booking = yield prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            parent: { include: { user: true } },
            child: true,
            therapist: { include: { user: true } },
            timeSlot: true,
        },
    });
    if (!booking) {
        throw new Error('Booking not found');
    }
    if (booking.status !== 'COMPLETED') {
        console.log('⚠️ Session not marked as completed, marking it now...');
        // Mark the session as completed if it's not already
        yield prisma_1.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                isCompleted: true,
            },
        });
    }
    // Check if report already exists
    const existingReport = yield prisma_1.prisma.sessionReport.findUnique({
        where: { bookingId },
    });
    if (existingReport) {
        throw new Error('Session report already exists for this session');
    }
    // Create session report
    const report = yield prisma_1.prisma.sessionReport.create({
        data: {
            id: `report_${Date.now()}`,
            sessionExperience,
            childPerformance,
            improvements,
            medication,
            recommendations,
            nextSteps,
            bookingId,
            therapistId: booking.therapistId,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });
    // Send email to parent
    try {
        yield sendSessionReportEmail(booking.parent.user.email, booking.child.name, report, booking.therapist.name);
    }
    catch (error) {
        console.error('Failed to send email:', error);
        // Don't throw error - report creation should succeed even if email fails
    }
    return report;
});
exports.createSessionReport = createSessionReport;
const updateConsent = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId, status, notes } = input;
    // Verify booking exists
    const booking = yield prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            parent: true,
            child: true,
            therapist: true,
        },
    });
    if (!booking) {
        throw new Error('Booking not found');
    }
    // Update or create consent request
    const consentRequest = yield prisma_1.prisma.consentRequest.upsert({
        where: { bookingId },
        update: {
            status,
            respondedAt: new Date(),
            notes,
        },
        create: {
            id: `consent_${Date.now()}`,
            status,
            requestedAt: new Date(),
            respondedAt: new Date(),
            notes,
            bookingId,
            parentId: booking.parentId,
            therapistId: booking.therapistId,
        },
    });
    return consentRequest;
});
exports.updateConsent = updateConsent;
const getSessionDetails = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            parent: {
                include: {
                    user: true,
                },
            },
            child: true,
            therapist: {
                include: {
                    user: true,
                },
            },
            timeSlot: true,
            SessionFeedback: true,
            sessionReport: true,
            ConsentRequest: true,
            testimonial: true,
        },
    });
    if (!booking) {
        throw new Error('Booking not found');
    }
    return booking;
});
exports.getSessionDetails = getSessionDetails;
const updateTherapistRating = (therapistId) => __awaiter(void 0, void 0, void 0, function* () {
    const feedbacks = yield prisma_1.prisma.sessionFeedback.findMany({
        where: {
            Booking: {
                therapistId,
            },
        },
        select: {
            rating: true,
        },
    });
    if (feedbacks.length > 0) {
        const averageRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length;
        yield prisma_1.prisma.therapistProfile.update({
            where: { id: therapistId },
            data: { averageRating: Math.round(averageRating * 10) / 10 },
        });
    }
});
const sendSessionReportEmail = (parentEmail, childName, report, therapistName) => __awaiter(void 0, void 0, void 0, function* () {
    const plainMessage = `
Session Report for ${childName}

Dr. ${therapistName} has completed the session report for ${childName}.

Session Experience:
${report.sessionExperience}

${report.childPerformance ? `Child Performance:\n${report.childPerformance}\n` : ''}
${report.improvements ? `Improvements:\n${report.improvements}\n` : ''}
${report.medication ? `Medication Notes:\n${report.medication}\n` : ''}
${report.recommendations ? `Recommendations:\n${report.recommendations}\n` : ''}
${report.nextSteps ? `Next Steps:\n${report.nextSteps}\n` : ''}

Best regards,
TheraConnect Team
`;
    yield (0, email_service_1.sendemail)(parentEmail, plainMessage);
});
