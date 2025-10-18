// notification.service.ts
import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { NotificationType } from '@prisma/client';

export interface NotificationInput {
  userId: string;
  message: string;
  type: NotificationType;
  sendAt: Date;
}

export const sendNotificationToTherapist = async (input: NotificationInput) => {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      message: input.message,
      type: input.type ,
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
      type: NotificationType.REGISTRATION_SUCCESSFUL,
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
      type: "SESSION_REMINDER",
      channel: "EMAIL",
      status: "PENDING",
      sendAt: input.sendAt
    }
  });
};

