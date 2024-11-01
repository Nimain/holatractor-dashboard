FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS frontend-production
WORKDIR /app

COPY --from=frontend-builder /app/next.config.js ./
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]