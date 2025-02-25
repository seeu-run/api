FROM node:21-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

RUN pnpm install

COPY . .

EXPOSE 80

ENTRYPOINT ["sh", "-c", "pnpm run build && pnpx prisma migrate deploy && pnpx prisma generate && pnpm run start"]
