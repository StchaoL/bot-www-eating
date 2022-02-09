FROM node:12-alpine

WORKDIR /app

COPY package.json ./

#COPY yarn.lock ./

RUN yarn global add pm2

RUN yarn install --frozen-lockfile

COPY . .
