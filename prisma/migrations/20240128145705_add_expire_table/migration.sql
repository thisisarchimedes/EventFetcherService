-- CreateTable
CREATE TABLE "ExpireLeverage" (
    "id" SERIAL NOT NULL,
    "nftId" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "user" VARCHAR(42) NOT NULL,
    "receivedAmount" DECIMAL(65,30) NOT NULL,
    "wbtcDebtAmount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ExpireLeverage_pkey" PRIMARY KEY ("id")
);
