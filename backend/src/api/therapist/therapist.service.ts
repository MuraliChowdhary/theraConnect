import { PrismaClient, BookingStatus } from '@prisma/client';
import { z } from 'zod';
import { sendNotification } from '../../services/notification.service';
import type { requestLeaveSchema, createTimeSlotsSchema } from './therapist.validation';

const prisma = new PrismaClient();
type RequestLeaveInput = z.infer<typeof requestLeaveSchema>['body'];
type CreateTimeSlotsInput = z.infer<typeof createTimeSlotsSchema>['body'];

export const getTherapistProfile = async (userId: string) => {
    return prisma.therapistProfile.findUnique({ where: { userId } });
};

export const createTimeSlots = async (therapistId: string, input: CreateTimeSlotsInput) => {
    const slotsData = input.slots.map(slot => ({
        therapistId,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
    }));

    return prisma.timeSlot.createMany({
        data: slotsData,
    });
};

export const requestLeave = async (therapistId: string, input: RequestLeaveInput) => {
  const therapist = await prisma.therapistProfile.findUnique({ where: { id: therapistId } });
  if (!therapist) throw new Error('Therapist not found.');
  if (therapist.leavesRemainingThisMonth <= 0) throw new Error('No leaves remaining.');

  const leaveDate = new Date(input.date);
  const startOfDay = new Date(leaveDate.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(leaveDate.setUTCHours(23, 59, 59, 999));

  const affectedBookings = await prisma.booking.findMany({
    where: {
      therapistId,
      status: 'SCHEDULED',
      timeSlot: { startTime: { gte: startOfDay, lte: endOfDay } },
    },
    include: { parent: { include: { user: true } }, timeSlot: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.therapistLeave.create({ data: { therapistId, date: startOfDay, type: input.type, reason: input.reason } });
    await tx.therapistProfile.update({ where: { id: therapistId }, data: { leavesRemainingThisMonth: { decrement: 1 } } });
    for (const booking of affectedBookings) {
      await tx.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.CANCELLED_BY_THERAPIST } });
      await tx.timeSlot.update({ where: { id: booking.timeSlotId }, data: { isBooked: false } });
    }
  });

  for (const booking of affectedBookings) {
    await sendNotification({
      userId: booking.parent.userId,
      type: 'BOOKING_CANCELLED',
      message: `Your session for ${booking.timeSlot.startTime.toLocaleDateString()} has been cancelled as the therapist is unavailable.`,
      sendAt:new Date()
    });
  }
  return { message: 'Leave approved and affected bookings have been cancelled.' };
};