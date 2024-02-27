-- CreateEnum
CREATE TYPE "PositionState" AS ENUM ('OPEN', 'CLOSE', 'LIQUIDATED', 'EXPIRED');

-- CreateTable
CREATE TABLE "OpenLeverage" (
    "id" SERIAL NOT NULL,
    "nftId" BIGINT NOT NULL,
    "user" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "collateralAmount" BIGINT NOT NULL,
    "wbtcToBorrow" BIGINT NOT NULL,
    "receivedShares" BIGINT NOT NULL,
    "positionExpireBlock" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "OpenLeverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloseLeverage" (
    "id" SERIAL NOT NULL,
    "nftId" BIGINT NOT NULL,
    "user" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "receivedAmount" BIGINT NOT NULL,
    "wbtcDebtAmount" BIGINT NOT NULL,
    "exitFee" BIGINT NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "CloseLeverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeveragePosition" (
    "id" SERIAL NOT NULL,
    "nftId" BIGINT NOT NULL,
    "user" TEXT NOT NULL,
    "collatarelAmount" BIGINT NOT NULL,
    "debtAmount" BIGINT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "currentPositionValue" BIGINT NOT NULL,
    "strategyShares" BIGINT NOT NULL,
    "strategy" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "positionExpireBlock" INTEGER NOT NULL,
    "liqudationBuffer" BIGINT NOT NULL,
    "positionState" "PositionState" NOT NULL,

    CONSTRAINT "LeveragePosition_pkey" PRIMARY KEY ("id")
);
