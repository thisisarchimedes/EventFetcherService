/*
  Warnings:

  - You are about to alter the column `receivedAmount` on the `CloseLeverage` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `wbtcDebtAmount` on the `CloseLeverage` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `exitFee` on the `CloseLeverage` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `debtAmount` on the `LeveragePosition` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `currentPositionValue` on the `LeveragePosition` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `strategyShares` on the `LeveragePosition` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `liquidationBuffer` on the `LeveragePosition` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `collateralAmount` on the `LeveragePosition` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `collateralAmount` on the `OpenLeverage` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `wbtcToBorrow` on the `OpenLeverage` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `receivedShares` on the `OpenLeverage` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `liquidationBuffer` on the `OpenLeverage` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "CloseLeverage" ALTER COLUMN "receivedAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "wbtcDebtAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "exitFee" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "LeveragePosition" ALTER COLUMN "debtAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "currentPositionValue" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "strategyShares" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "liquidationBuffer" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "collateralAmount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "OpenLeverage" ALTER COLUMN "collateralAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "wbtcToBorrow" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "receivedShares" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "liquidationBuffer" SET DATA TYPE DECIMAL(65,30);
