/*
  Warnings:

  - The values [NotificationChannel] on the enum `NotificationChannel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."NotificationChannel_new" AS ENUM ('EMAIL', 'PUSH');
ALTER TABLE "public"."Notification" ALTER COLUMN "channel" TYPE "public"."NotificationChannel_new" USING ("channel"::text::"public"."NotificationChannel_new");
ALTER TYPE "public"."NotificationChannel" RENAME TO "NotificationChannel_old";
ALTER TYPE "public"."NotificationChannel_new" RENAME TO "NotificationChannel";
DROP TYPE "public"."NotificationChannel_old";
COMMIT;
