/*
  Warnings:

  - A unique constraint covering the columns `[account]` on the table `ExecutorBalances` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ExecutorBalances_account_idx";

-- CreateIndex
CREATE UNIQUE INDEX "ExecutorBalances_account_key" ON "ExecutorBalances"("account");
