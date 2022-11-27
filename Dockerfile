FROM node:14.21.1-alpine

WORKDIR /app

COPY . /app/

# Additional setup for mobile frontend
COPY ./frontend-mobile /app/prod/mobile

RUN npm run setup_env

RUN npm run prod_setup

CMD [ "npm", "run", "start:prod" ]