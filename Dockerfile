FROM node:4.2
RUN apt-get update && apt-get install -y --force-yes cron
RUN npm i -g npm@3
RUN npm i 
