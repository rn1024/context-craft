FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY templates ./templates

RUN npm run build

EXPOSE 3333

CMD ["node", "dist/index.js"]