// notification.service.ts
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { NotificationType } from '@prisma/client';

export interface NotificationInput {
  userId: string;
  message: string;
  sendAt: Date;
}

export const sendNotificationToTherapist = async (input: NotificationInput) => {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: NotificationType.SESSION_COMPLETED,
      channel: 'EMAIL',
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
};

export const sendNotificationToTherapistSessionBooked = async (input: NotificationInput) => {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: NotificationType.BOOKING_CONFIRMED,
      channel: 'EMAIL',
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
};

export const sendNotificationAfterAnEvent = async (input: NotificationInput) => {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: "REGISTRATION_SUCCESSFUL",
      channel: 'EMAIL',
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
};

export const sendNotification = async (input: NotificationInput) => {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: NotificationType.SESSION_REMINDER,
      channel: "EMAIL",
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
};

export const sendNotificationBookingCancelled= async (input: NotificationInput) => {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: NotificationType.BOOKING_CANCELLED,
      channel: "EMAIL",
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
};


export const sendNotificationAfterAnEventSessionCompleted = async (input: NotificationInput) => {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: NotificationType.SESSION_COMPLETED,
      channel: 'EMAIL',
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
}


export const sendNotificationBookingConfirmed = async (input: NotificationInput) => {
   await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: NotificationType.BOOKING_CONFIRMED,
      channel: 'EMAIL',
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
}


export const therapistAccountApproved = async(input:NotificationInput)=>{
  await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: NotificationType.THERAPIST_ACCOUNT_APPROVED,
      channel: 'EMAIL',
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
}