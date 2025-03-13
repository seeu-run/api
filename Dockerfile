FROM node:23-slim

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apt-get update && apt-get install -y openssl libssl3

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/start.sh"]
