#!/bin/sh
set -e

pnpx prisma migrate deploy
pnpx prisma generate

exec pnpm run start
