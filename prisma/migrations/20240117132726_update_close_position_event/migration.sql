/*
  Warnings:

  - You are about to drop the column `exitFee` on the `CloseLeverage` table. All the data in the column will be lost.
  - You are about to drop the column `strategy` on the `CloseLeverage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CloseLeverage" DROP COLUMN "exitFee",
DROP COLUMN "strategy";
