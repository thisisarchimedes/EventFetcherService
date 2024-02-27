/*
  Warnings:

  - You are about to alter the column `strategy` on the `LeveragePosition` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(42)`.

*/
-- AlterTable
ALTER TABLE "LeveragePosition" ALTER COLUMN "strategy" SET DATA TYPE VARCHAR(42);
