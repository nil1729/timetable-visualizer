FROM node:14.21.1-alpine

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont 

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

WORKDIR /app

COPY . /app/

# Additional setup for mobile frontend
COPY ./frontend-mobile /app/prod/mobile

RUN npm run setup_env

RUN npm run prod_setup

# Run everything after as non-privileged user.
USER pptruser

CMD [ "npm", "run", "start:prod" ]