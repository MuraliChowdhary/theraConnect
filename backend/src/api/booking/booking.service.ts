import { NotificationType, Role, TherapistStatus } from '@prisma/client';
import { z } from 'zod';
import { sendNotification, sendNotificationAfterAnEvent, sendNotificationToTherapistSessionBooked } from '../../services/notification.service';
import type { createBookingSchema } from './booking.validation';
import {prisma} from '../../utils/prisma';
type CreateBookingInput = z.infer<typeof createBookingSchema>['body'];

export const markSessionCompleted = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      parent: { include: { user: true } },
      therapist: { include: { user: true } },
      child: true,
    },
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  if (booking.status !== 'SCHEDULED') {
    throw new Error('Session can only be completed if it was scheduled')
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      isCompleted: true,
    } as any,
    include: {
      parent: { include: { user: true } },
      therapist: { include: { user: true } },
      child: true,
    },
  })

  // Send notifications
  await sendNotification({
    userId: booking.parent.userId,
    message: `Session with ${booking.therapist.name} for ${booking.child.name} has been completed. Please provide your feedback.`,
    sendAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes later
  })

  await sendNotification({
    userId: booking.therapist.userId,
    message: `Session with ${booking.child.name} has been completed. Please create a session report.`,
    sendAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes later
  })

  return updatedBooking
}

export const getAvailableSlots = async (therapistId: string, date: string) => {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    console.log('[booking.service.getAvailableSlots] window', { startOfDay: startOfDay.toISOString(), endOfDay: endOfDay.toISOString(), therapistId });
    const slots = await prisma.timeSlot.findMany({
        where: {
            therapistId,
            isBooked: false,
            isActive: true,
            startTime: { gte: startOfDay, lte: endOfDay },
            therapist: { status: TherapistStatus.ACTIVE },
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
};

export const createBooking = async (parentId: string, input: CreateBookingInput) => {
    const { childId, timeSlotId } = input;

    const timeSlot = await prisma.timeSlot.findFirst({
        where: { id: timeSlotId, isBooked: false },
        include: { therapist: true },
    });
    if (!timeSlot) throw new Error('This time slot is not available.');
    if (timeSlot.therapist.status !== TherapistStatus.ACTIVE) {
        throw new Error('This therapist is not available for booking.');
    }

    const child = await prisma.child.findFirst({
        where: { id: childId, parentId },
    });
    if (!child) throw new Error('Child not found or does not belong to this parent.');

    const parent = await prisma.parentProfile.findUnique({ where: { id: parentId } });

    const finalFee = parent?.customFee ?? timeSlot.therapist.baseCostPerSession;

    const booking = await prisma.$transaction(async (tx) => {
        await tx.timeSlot.update({ where: { id: timeSlotId }, data: { isBooked: true } });

        const newBooking = await tx.booking.create({
            data: {
                parentId,
                childId,
                therapistId: timeSlot.therapistId,
                timeSlotId,
            },
        });

        await tx.payment.create({
            data: {
                bookingId: newBooking.id,
                parentId,
                therapistId: timeSlot.therapistId,
                amount: finalFee,
            }
        });

        await tx.dataAccessPermission.create({
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
    });

    if(!parent) throw new Error('Parent profile not found');
    if(!parent.userId) throw new Error('Parent userId not found');

     const findTimeSlot = await prisma.timeSlot.findUnique({
                where:{
                    id:timeSlotId
                },
                select:{
                    startTime:true,
                    endTime:true,
                    therapist:{
                        select:{
                            userId:true,
                            name:true
                        }
                    }
                }
            })

            
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

    await sendNotificationToTherapistSessionBooked({
        userId: timeSlot.therapist.userId,
        message: therapistBookingMessage,
        sendAt: new Date()
    });
    await sendNotificationAfterAnEvent({
        userId: parent!.userId,
        message: bookingMessage,
        sendAt: new Date()
    });

    return booking;
};

export const getMyBookings = async (userId: string, role: Role) => {
    const whereClause =
        role === Role.PARENT
            ? { parent: { userId } }
            : { therapist: { userId, status: TherapistStatus.ACTIVE } };

    // Include child information for parents
    const includeForParent = {
        child: true,
        therapist: { select: { name: true, specialization: true } },
        parent: { select: { name: true } },
        timeSlot: true,
        SessionFeedback: true,
        sessionReport: true,
        ConsentRequest: true,
    } as const;

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
    } as const;

    const bookings = await prisma.booking.findMany({
        where: whereClause,
        include: role === Role.PARENT ? (includeForParent as any) : (includeForTherapist as any),
        orderBy: { timeSlot: { startTime: 'desc' } },
    });

    // For therapists, filter out child details if consent is not given
    if (role === Role.THERAPIST) {
        return bookings.map((booking: any) => {
            const hasConsent = booking.ConsentRequest?.status === 'GRANTED';
            
            return {
                ...booking,
                child: hasConsent ? booking.child : {
                    id: booking.child?.id,
                    name: booking.child?.name,
                    age: undefined,
                    condition: undefined,
                    notes: undefined,
                    address: undefined,
                }
            };
        });
    }

    return bookings;
};