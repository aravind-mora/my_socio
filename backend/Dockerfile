# ============================================================
# SocioSphere Backend — Dockerfile (for Back4app / any container host)
# Builds the backend from the repo root (backend code in ./backend)
# ============================================================

FROM node:20-alpine

# working dir
WORKDIR /app

# copy package files first for better layer caching
COPY backend/package*.json ./

# install dependencies (production only, lean image)
RUN npm install --omit=dev

# copy the rest of the backend source
COPY backend/ ./

# the app runs on PORT from env (Back4app sets its own PORT; default 5000)
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# start the server
CMD ["npm", "start"]
