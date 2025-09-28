// notification.worker.ts
import cron from "node-cron";
import { PrismaClient } from '@prisma/client';
import { sendemail } from "./email.service";
const prisma = new PrismaClient();

cron.schedule("* * * * *", async () => {  // runs every minute
  const pendingNotifications = await prisma.notification.findMany({
    where: {
      status: "PENDING",
      sendAt: { lte: new Date() } 
    }
  });

  for (const notif of pendingNotifications) {
    const user = await prisma.user.findUnique({ where: { id: notif.userId } });

    if (!user?.email) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: { status: "FAILED" }
      });
      continue;
    }

    const result = await sendemail(user.email, notif.message);

    await prisma.notification.update({
      where: { id: notif.id },
      data: { status: result.success ? "SENT" : "FAILED" }
    });
  }
});
