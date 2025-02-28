FROM node:21-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

RUN pnpm install

COPY . .

ENTRYPOINT [ "pnpm", "run", "start" ]