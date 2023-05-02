FROM node:18-alpine

# RUN apk add --no-cache bash

USER node

RUN npm install -g @nestjs/cli

WORKDIR /home/node/app

RUN npm run start:dev