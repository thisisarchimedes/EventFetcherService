/*
  Warnings:

  - You are about to alter the column `user` on the `CloseLeverage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(42)`.
  - You are about to alter the column `user` on the `LeveragePosition` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(42)`.
  - You are about to alter the column `user` on the `OpenLeverage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(42)`.

*/
-- AlterTable
ALTER TABLE "CloseLeverage" ALTER COLUMN "user" SET DATA TYPE VARCHAR(42);

-- AlterTable
ALTER TABLE "LeveragePosition" ALTER COLUMN "user" SET DATA TYPE VARCHAR(42);

-- AlterTable
ALTER TABLE "OpenLeverage" ALTER COLUMN "user" SET DATA TYPE VARCHAR(42);

-- CreateIndex
CREATE INDEX "LeveragePosition_user_idx" ON "LeveragePosition"("user");
