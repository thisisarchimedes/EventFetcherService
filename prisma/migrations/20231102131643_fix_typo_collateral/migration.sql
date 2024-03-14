/*
  Warnings:

  - You are about to drop the column `collatarelAmount` on the `LeveragePosition` table. All the data in the column will be lost.
  - Added the required column `collateralAmount` to the `LeveragePosition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LeveragePosition" DROP COLUMN "collatarelAmount",
ADD COLUMN     "collateralAmount" DOUBLE PRECISION NOT NULL;
