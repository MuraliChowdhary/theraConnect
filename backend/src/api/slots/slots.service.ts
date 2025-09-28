import { PrismaClient } from '@prisma/client';
import { sendNotification } from '../../services/notification.service';

const prisma = new PrismaClient();

/**
 * Checks if a given time falls within any of the therapist's breaks.
 */
function isTimeInBreak(
  time: Date,
  breaks: { startTime: string; endTime: string }[],
  date: string
): boolean {
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
export const generateAndGetAvailableSlots = async (
  therapistId: string,
  date: string
) => {
  const therapist = await prisma.therapistProfile.findUnique({
    where: { id: therapistId },
    include: { breaks: true },
  });

  if (!therapist) throw new Error('Therapist not found');

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const existingSlotsCount = await prisma.timeSlot.count({
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
      await prisma.timeSlot.createMany({ data: slotsToCreate });
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
};

/**
 * Book a slot for a child and queue notifications asynchronously.
 */
export const bookSlot = async (parentId: string, childId: string, timeSlotId: string) => {
  let slot: any;
  let child: any;
  let newBooking: any;

  await prisma.$transaction(async (tx) => {
    slot = await tx.timeSlot.findFirstOrThrow({
      where: { id: timeSlotId, isBooked: false },
      include: { therapist: { include: { user: true } } },
    });

    await tx.timeSlot.update({
      where: { id: timeSlotId },
      data: { isBooked: true },
    });

    child = await tx.child.findFirstOrThrow({
      where: { id: childId, parentId },
      include: { parent: { include: { user: true } } },
    });

    newBooking = await tx.booking.create({
      data: {
        parentId,
        childId,
        therapistId: slot.therapistId,
        timeSlotId: slot.id,
      },
    });
  });

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

  await Promise.all(notificationsToQueue.map((notif) => sendNotification(notif)));

  return newBooking;
};
