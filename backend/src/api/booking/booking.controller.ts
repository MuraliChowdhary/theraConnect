import type { Request, Response } from 'express';
import * as bookingService from './booking.service';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { sendNotification, sendNotificationAfterAnEvent, sendNotificationToTherapist } from '../../services/notification.service';



export const markSessionCompletedHandler = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params
    const updatedBooking = await bookingService.markSessionCompleted(bookingId);

    const parentId = await prisma.booking.findUnique({
        where:{id:bookingId},
        select:{
            parentId:true
        }
    })

    if(!parentId){
        res.json("parent not found")
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
            await sendNotificationAfterAnEvent({
                userId: parentId.parentId,
                message: sessionCompletedMessage,
                type: 'SESSION_COMPLETED',
                sendAt: new Date()
            });
    res.status(200).json({ 
      message: 'Session marked as completed', 
      booking: updatedBooking 
    })
  } catch (error: any) {
    console.error('[booking.markSessionCompleted][ERROR]', error)
    res.status(400).json({ message: error.message || 'Failed to mark session as completed' })
  }
}

export const getAvailableSlotsHandler = async (req: Request, res: Response) => {
    try {
        const { therapistId, date } = req.query as { therapistId: string; date: string };
        console.log(req.query)
        const slots = await bookingService.getAvailableSlots(therapistId, date);
        res.status(200).json(slots);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to get slots' });
    }
};


export const createBookingHandler = async (req: Request, res: Response) => {
    try {
        const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: req.user!.userId } });
        if (!parentProfile) return res.status(404).json({ message: 'Parent profile not found' });

        const booking = await bookingService.createBooking(parentProfile.id, req.body);

            const parent = await prisma.parentProfile.findFirst({
                    where: { id: parentProfile.id },
                    select: { 
                        userId: true,
                        name:true
                    },
                    });

            if (!parent?.userId) {
            return res.status(404).json({
                message: "Parent does not exist in user profile",
            });
            }
            

            const findTimeSlot = await prisma.timeSlot.findUnique({
                where:{
                    id:req.body.timeSlotId
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

            await sendNotificationAfterAnEvent({
            userId:userId,
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

            await sendNotificationToTherapist({
            userId:findTimeSlot.therapist.userId,
            message: therapistBookingMessage,
            type: 'BOOKING_CONFIRMED',
            sendAt: new Date(),
            })

            const reminderTime = new Date(new Date(findTimeSlot.startTime).getTime() - 15 * 60 * 1000);

            await sendNotification({
            userId: parent.userId,
            message: `Reminder: Your session starts in 15 minutes.`,
            type: 'SESSION_REMINDER',
            sendAt: reminderTime
            });

            // Schedule Therapist Reminder
            await sendNotification({
            userId: findTimeSlot.therapist.userId,
            message: `Reminder: Your upcoming session starts in 15 minutes.`,
            type: 'SESSION_REMINDER',
            sendAt: reminderTime
            });


        res.status(201).json(booking);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getMyBookingsHandler = async (req: Request, res: Response) => {
    try {
        const bookings = await bookingService.getMyBookings(req.user!.userId, req.user!.role);
        res.status(200).json(bookings);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to retrieve bookings' });
    }
}