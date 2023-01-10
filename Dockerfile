FROM node:14.21.1-alpine

# Installs latest Chromium (100) package.
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont 

WORKDIR /app

COPY . /app/

# Additional setup for mobile frontend
COPY ./frontend-mobile /app/prod/mobile

RUN npm run setup_env

RUN npm run prod_setup

CMD [ "npm", "run", "start:prod" ]