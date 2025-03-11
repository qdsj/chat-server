FROM node:22-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# production stage
FROM node:22-alpine AS production-stage

COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/package*.json /app
COPY --from=build-stage /app/.env.production /app

WORKDIR /app

RUN npm install --only=production

# 设置环境变量
ENV DB_HOST=
ENV DB_USERNAME=
ENV DB_PASSWORD=
ENV DB_PORT=3307
ENV DB_DATABASE=authqdsj
ENV NODE_ENV=production
ENV PORT=

EXPOSE ${PORT}

CMD ["node", "main.js"]
