FROM node:23-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

RUN pnpm install

COPY . .

ENTRYPOINT [ "pnpm", "run", "dev" ]
