FROM node:23-slim

RUN npm install -g pnpm

WORKDIR /app

COPY package*.json ./

RUN pnpm install

COPY . .

ENTRYPOINT [ "/start.sh" ]