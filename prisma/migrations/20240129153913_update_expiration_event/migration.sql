/*
  Warnings:

  - You are about to drop the column `receivedAmount` on the `ExpireLeverage` table. All the data in the column will be lost.
  - You are about to drop the column `wbtcDebtAmount` on the `ExpireLeverage` table. All the data in the column will be lost.
  - Added the required column `claimableAmount` to the `ExpireLeverage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExpireLeverage" DROP COLUMN "receivedAmount",
DROP COLUMN "wbtcDebtAmount",
ADD COLUMN     "claimableAmount" DECIMAL(65,30) NOT NULL;
