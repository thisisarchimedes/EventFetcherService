/*
  Warnings:

  - The values [OPEN,CLOSE] on the enum `PositionState` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `debtPaid` on the `LiquidateLeverage` table. All the data in the column will be lost.
  - You are about to drop the column `userClaimableAmount` on the `LiquidateLeverage` table. All the data in the column will be lost.
  - Added the required column `claimableAmount` to the `LiquidateLeverage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wbtcDebtPaid` to the `LiquidateLeverage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PositionState_new" AS ENUM ('UNINITIALIZED', 'LIVE', 'EXPIRED', 'LIQUIDATED', 'CLOSED');
ALTER TABLE "LeveragePosition" ALTER COLUMN "positionState" TYPE "PositionState_new" USING ("positionState"::text::"PositionState_new");
ALTER TYPE "PositionState" RENAME TO "PositionState_old";
ALTER TYPE "PositionState_new" RENAME TO "PositionState";
DROP TYPE "PositionState_old";
COMMIT;

-- AlterTable
ALTER TABLE "LeveragePosition" ADD COLUMN     "claimableAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LiquidateLeverage" DROP COLUMN "debtPaid",
DROP COLUMN "userClaimableAmount",
ADD COLUMN     "claimableAmount" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "wbtcDebtPaid" DECIMAL(65,30) NOT NULL;
