-- CreateTable
CREATE TABLE "StrategyTVLs" (
    "id" SERIAL NOT NULL,
    "account" VARCHAR(42) NOT NULL,
    "balance" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyTVLs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StrategyTVLs_updatedAt_idx" ON "StrategyTVLs"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyTVLs_account_key" ON "StrategyTVLs"("account");
