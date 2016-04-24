FROM node:4.2
WORKDIR /gitmonitor-client

RUN apt-get update && apt-get install -y --force-yes cron
RUN npm i -g npm@3
RUN git clone https://github.com/theotow/gitmonitor-client.git .
RUN npm i -g
RUN npm i
