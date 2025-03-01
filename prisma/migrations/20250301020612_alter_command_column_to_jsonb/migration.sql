/*
  Warnings:

  - Changed the type of `command` on the `SSHCommands` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "SSHCommands" DROP COLUMN "command",
ADD COLUMN     "command" JSONB NOT NULL;
