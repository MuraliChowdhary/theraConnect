// notification.service.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NotificationType } from '@prisma/client';

export interface NotificationInput {
  userId: string;
  message: string;
  type: string;
  sendAt: Date; 
}

export const sendNotification = async (input: NotificationInput) => {
  await prisma.notification.create({
  data: {
    userId: input.userId,
    message: "Your session starts in 15 minutes!",
    type: "SESSION_REMINDER",
    channel: "EMAIL", 
    status: "PENDING",
    sendAt: input.sendAt
  }
});
};

