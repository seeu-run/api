-- CreateEnum
CREATE TYPE "SSHCommandName" AS ENUM ('ECHO_SYSTEM_STATS');

-- CreateTable
CREATE TABLE "SSHCommands" (
    "id" TEXT NOT NULL,
    "name" "SSHCommandName" NOT NULL,
    "command" TEXT NOT NULL,

    CONSTRAINT "SSHCommands_pkey" PRIMARY KEY ("id")
);
