-- CreateEnum
CREATE TYPE "public"."ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'DENIED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'SESSION_COMPLETED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'REPORT_READY';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CONSENT_REQUESTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CONSENT_RESPONSE';

-- DropIndex
DROP INDEX "public"."User_password_key";

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "hostStarted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "meetingId" TEXT,
ADD COLUMN     "meetingPassword" TEXT;

-- AlterTable
ALTER TABLE "public"."TherapistProfile" ALTER COLUMN "maxSlotsPerDay" SET DEFAULT 8;

-- CreateTable
CREATE TABLE "public"."SessionReport" (
    "id" TEXT NOT NULL,
    "sessionExperience" TEXT NOT NULL,
    "childPerformance" TEXT,
    "improvements" TEXT,
    "medication" TEXT,
    "recommendations" TEXT,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,

    CONSTRAINT "SessionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsentRequest" (
    "id" TEXT NOT NULL,
    "status" "public"."ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "notes" TEXT,
    "bookingId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,

    CONSTRAINT "ConsentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionFeedback" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,

    CONSTRAINT "SessionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionReport_bookingId_key" ON "public"."SessionReport"("bookingId");

-- CreateIndex
CREATE INDEX "SessionReport_therapistId_idx" ON "public"."SessionReport"("therapistId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRequest_bookingId_key" ON "public"."ConsentRequest"("bookingId");

-- CreateIndex
CREATE INDEX "ConsentRequest_parentId_idx" ON "public"."ConsentRequest"("parentId");

-- CreateIndex
CREATE INDEX "ConsentRequest_therapistId_idx" ON "public"."ConsentRequest"("therapistId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionFeedback_bookingId_key" ON "public"."SessionFeedback"("bookingId");

-- CreateIndex
CREATE INDEX "SessionFeedback_parentId_idx" ON "public"."SessionFeedback"("parentId");

-- AddForeignKey
ALTER TABLE "public"."SessionReport" ADD CONSTRAINT "SessionReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionReport" ADD CONSTRAINT "SessionReport_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."TherapistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsentRequest" ADD CONSTRAINT "ConsentRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsentRequest" ADD CONSTRAINT "ConsentRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsentRequest" ADD CONSTRAINT "ConsentRequest_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "public"."TherapistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionFeedback" ADD CONSTRAINT "SessionFeedback_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionFeedback" ADD CONSTRAINT "SessionFeedback_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
