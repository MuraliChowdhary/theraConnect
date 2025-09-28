import { PrismaClient } from '@prisma/client';
import { sendNotification } from '../../services/notification.service';

const prisma = new PrismaClient();

/**
 * Checks if a given time falls within any of the therapist's breaks.
 * @param time - The Date object to check.
 * @param breaks - An array of therapist breaks.
 * @param date - The target date string 'YYYY-MM-DD' to construct break times.
 * @returns {boolean} - True if the time is within a break, false otherwise.
 */
function isTimeInBreak(time: Date, breaks: { startTime: string, endTime: string }[], date: string): boolean {
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
 * The core function to generate slots for a day if they don't exist,
 * and then return the available ones.
 */
export const generateAndGetAvailableSlots = async (therapistId: string, date: string) => {
  const therapist = await prisma.therapistProfile.findUnique({
    where: { id: therapistId },
    include: { breaks: true },
  });
  

  if (!therapist) {
    throw new Error('Therapist not found');
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  // 1. Check if slots already exist for this day
  const existingSlotsCount = await prisma.timeSlot.count({
    where: { therapistId, startTime: { gte: dayStart, lte: dayEnd } },
  });

  // 2. If no slots exist, generate them
  if (existingSlotsCount === 0) {
    const slotsToCreate = [];
    let currentSlotTime = new Date(`${date}T${therapist.scheduleStartTime}:00.000Z`);
    const { slotDurationInMinutes, breaks, maxSlotsPerDay } = therapist;

    while (slotsToCreate.length < maxSlotsPerDay) {
      const slotEndTime = new Date(currentSlotTime.getTime() + slotDurationInMinutes * 60000);

      // Skip slot if it starts within a break
      if (!isTimeInBreak(currentSlotTime, breaks, date)) {
        slotsToCreate.push({
          therapistId,
          startTime: new Date(currentSlotTime),
          endTime: slotEndTime,
        });
      }
      // Move to the start of the next potential slot
      currentSlotTime = slotEndTime;
    }

    if (slotsToCreate.length > 0) {
      await prisma.timeSlot.createMany({ data: slotsToCreate });
    }
  }

  // 3. Fetch and return all *available* slots for the day
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
 * Books a time slot for a child in a concurrency-safe transaction.
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

  // Notifications outside transaction
  await sendNotification({
    userId: slot.therapist.user.id,
    type: 'BOOKING_CONFIRMED',
    message: `New booking confirmed with ${child.name} on ${slot.startTime.toLocaleDateString()}.`,
  });
  await sendNotification({
    userId: child.parent.user.id,
    type: 'BOOKING_CONFIRMED',
    message: `Your booking for ${child.name} is confirmed for ${slot.startTime.toLocaleString()}.`,
  });

  return newBooking;
};

