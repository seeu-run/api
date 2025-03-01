FROM node:22.8.0-slim

USER node

WORKDIR /home/node/app

COPY package.*json .
RUN pnpm install

CMD [ "pnpm", "run", "start" ]
