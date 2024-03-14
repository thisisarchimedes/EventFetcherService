/*
  Warnings:

  - You are about to alter the column `strategy` on the `CloseLeverage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(42)`.
  - You are about to drop the column `liqudationBuffer` on the `LeveragePosition` table. All the data in the column will be lost.
  - You are about to alter the column `strategy` on the `OpenLeverage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(42)`.
  - Added the required column `liquidationBuffer` to the `LeveragePosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `liquidationBuffer` to the `OpenLeverage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CloseLeverage" ALTER COLUMN "strategy" SET DATA TYPE VARCHAR(42);

-- AlterTable
ALTER TABLE "LeveragePosition" DROP COLUMN "liqudationBuffer",
ADD COLUMN     "liquidationBuffer" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "OpenLeverage" ADD COLUMN     "liquidationBuffer" BIGINT NOT NULL,
ALTER COLUMN "strategy" SET DATA TYPE VARCHAR(42);
