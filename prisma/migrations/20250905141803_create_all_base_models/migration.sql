/*
  Warnings:

  - You are about to drop the column `bio` on the `Influencer` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `Influencer` table. All the data in the column will be lost.
  - You are about to drop the column `followerCount` on the `Influencer` table. All the data in the column will be lost.
  - You are about to drop the column `followingCount` on the `Influencer` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Influencer` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `Influencer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[account_id]` on the table `Influencer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account_id` to the `Influencer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AnalysisState" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."Ethnicity" AS ENUM ('ASIAN', 'BLACK', 'HISPANIC', 'MIDDLE_EASTERN', 'NATIVE_AMERICAN', 'PACIFIC_ISLANDER', 'WHITE');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."AgeGroup" AS ENUM ('YOUNG_ADULT', 'MIDDLE_AGED', 'SENIOR');

-- DropIndex
DROP INDEX "public"."Influencer_username_key";

-- AlterTable
ALTER TABLE "public"."Influencer" DROP COLUMN "bio",
DROP COLUMN "displayName",
DROP COLUMN "followerCount",
DROP COLUMN "followingCount",
DROP COLUMN "username",
DROP COLUMN "verificationStatus",
ADD COLUMN     "account_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "follower_count" INTEGER,
    "following_count" INTEGER,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "ethnicity" "public"."Ethnicity",
    "gender" "public"."Gender",
    "age_group" "public"."AgeGroup",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reel" (
    "id" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL,
    "comment_count" INTEGER NOT NULL,
    "share_count" INTEGER NOT NULL,
    "view_count" INTEGER NOT NULL,
    "gcloud_uri" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "reel_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL,
    "reply_count" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalysisStatus" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "status" "public"."AnalysisState" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ReelCollaborations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ReelCollaborations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_RestaurantToInfluencer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RestaurantToInfluencer_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "public"."Account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_account_id_key" ON "public"."Restaurant"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisStatus_account_id_key" ON "public"."AnalysisStatus"("account_id");

-- CreateIndex
CREATE INDEX "_ReelCollaborations_B_index" ON "public"."_ReelCollaborations"("B");

-- CreateIndex
CREATE INDEX "_RestaurantToInfluencer_B_index" ON "public"."_RestaurantToInfluencer"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_account_id_key" ON "public"."Influencer"("account_id");

-- AddForeignKey
ALTER TABLE "public"."Restaurant" ADD CONSTRAINT "Restaurant_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Influencer" ADD CONSTRAINT "Influencer_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "public"."Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalysisStatus" ADD CONSTRAINT "AnalysisStatus_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ReelCollaborations" ADD CONSTRAINT "_ReelCollaborations_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ReelCollaborations" ADD CONSTRAINT "_ReelCollaborations_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RestaurantToInfluencer" ADD CONSTRAINT "_RestaurantToInfluencer_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RestaurantToInfluencer" ADD CONSTRAINT "_RestaurantToInfluencer_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
