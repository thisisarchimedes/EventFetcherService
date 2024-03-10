/*
  Warnings:

  - You are about to drop the column `liquidationBuffer` on the `LeveragePosition` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LeveragePosition" DROP COLUMN "liquidationBuffer";
