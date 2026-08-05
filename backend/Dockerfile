# SocioSphere backend container
# Builds the backend from the repo root (backend code lives in ./backend)

FROM node:20-alpine

# working directory
WORKDIR /app

# copy package files first for better layer caching
COPY backend/package*.json ./

# install production dependencies only (lean image)
RUN npm install --omit=dev

# copy the rest of the backend source
COPY backend/ ./

# the app runs on PORT from env; default 5000
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# start the server
CMD ["npm", "start"]
