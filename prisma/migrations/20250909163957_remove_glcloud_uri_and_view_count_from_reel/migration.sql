/*
  Warnings:

  - You are about to drop the column `gcloud_uri` on the `Reel` table. All the data in the column will be lost.
  - You are about to drop the column `view_count` on the `Reel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Reel" DROP COLUMN "gcloud_uri",
DROP COLUMN "view_count";
