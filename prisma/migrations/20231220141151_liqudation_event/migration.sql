-- CreateTable
CREATE TABLE "LiquidateLeverage" (
    "id" SERIAL NOT NULL,
    "nftId" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "user" VARCHAR(42) NOT NULL,
    "strategy" VARCHAR(42) NOT NULL,
    "debtPaid" DECIMAL(65,30) NOT NULL,
    "userClaimableAmount" DECIMAL(65,30) NOT NULL,
    "liquidationFee" DECIMAL(65,30) NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "LiquidateLeverage_pkey" PRIMARY KEY ("id")
);
