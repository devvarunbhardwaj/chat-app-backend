/*
  Warnings:

  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."course_contents" DROP CONSTRAINT "course_contents_courseId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isActive";

-- AddForeignKey
ALTER TABLE "course_contents" ADD CONSTRAINT "course_contents_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
