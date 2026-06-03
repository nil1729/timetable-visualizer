FROM node:20-alpine

# Install chromium for PDF generation
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Build the frontend
RUN npm run prod_setup 2>/dev/null || echo "Frontend build skipped"

EXPOSE 5050

CMD ["npm", "run", "start:prod"]
