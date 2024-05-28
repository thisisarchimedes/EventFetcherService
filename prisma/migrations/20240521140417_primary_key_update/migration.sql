/*
  Warnings:

  - The primary key for the `LeveragePosition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `LeveragePosition` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nftId]` on the table `LeveragePosition` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LeveragePosition" DROP CONSTRAINT "LeveragePosition_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "LeveragePosition_pkey" PRIMARY KEY ("nftId");

-- CreateIndex
CREATE UNIQUE INDEX "LeveragePosition_nftId_key" ON "LeveragePosition"("nftId");
