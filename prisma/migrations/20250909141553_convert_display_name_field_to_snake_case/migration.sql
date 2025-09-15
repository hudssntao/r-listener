/*
  Warnings:

  - You are about to drop the column `displayName` on the `Account` table. All the data in the column will be lost.
  - Added the required column `display_name` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Account" DROP COLUMN "displayName",
ADD COLUMN     "display_name" TEXT NOT NULL;
