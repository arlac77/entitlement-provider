# FROM node:argon
# FROM node:4-onbuild
FROM node:7.3

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install --production

EXPOSE 10000
CMD [ "node", "bin/kronos-cluster-node" ]
