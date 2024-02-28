FROM node:14

COPY ["package.json", "/opt/client/"]
COPY ["package-lock.json", "/opt/client/"]

WORKDIR /opt/client
COPY ["localhost-key.pem", "/opt/client"]
COPY ["localhost.pem", "/opt/client"]

#RUN npm install -g npm@version
#RUN npm install --force
RUN npm ci

COPY ["src/", "/opt/client/src/"]
COPY ["public/", "/opt/client/public/"]

CMD ["npm", "start"]
