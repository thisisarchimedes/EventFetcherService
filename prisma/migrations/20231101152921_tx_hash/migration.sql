/*
  Warnings:

  - Added the required column `txHash` to the `CloseLeverage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `txHash` to the `OpenLeverage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CloseLeverage" ADD COLUMN     "txHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OpenLeverage" ADD COLUMN     "txHash" TEXT NOT NULL;
