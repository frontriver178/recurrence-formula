FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y \
  texlive-full \
  nodejs \
  npm \
  && apt-get clean

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
