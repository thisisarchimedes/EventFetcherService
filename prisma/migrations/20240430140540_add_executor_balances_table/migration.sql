-- CreateTable
CREATE TABLE "ExecutorBalances" (
    "id" SERIAL NOT NULL,
    "account" VARCHAR(42) NOT NULL,
    "balance" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutorBalances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutorBalances_account_idx" ON "ExecutorBalances"("account");

-- CreateIndex
CREATE INDEX "ExecutorBalances_updatedAt_idx" ON "ExecutorBalances"("updatedAt");
