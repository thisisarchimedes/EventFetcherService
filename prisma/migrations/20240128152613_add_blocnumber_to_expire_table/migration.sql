/*
  Warnings:

  - Added the required column `blockNumber` to the `ExpireLeverage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExpireLeverage" ADD COLUMN     "blockNumber" INTEGER NOT NULL;
