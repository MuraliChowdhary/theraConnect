/*
  Warnings:

  - Added the required column `channel` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sendAt` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('NotificationChannel');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- DropIndex
DROP INDEX "public"."Notification_userId_idx";

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "channel" "public"."NotificationChannel" NOT NULL,
ADD COLUMN     "sendAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "public"."NotificationStatus" NOT NULL;

-- CreateIndex
CREATE INDEX "Notification_userId_status_sendAt_idx" ON "public"."Notification"("userId", "status", "sendAt");
