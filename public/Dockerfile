FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y \
  texlive-latex-base \
  texlive-latex-recommended \
  texlive-fonts-recommended \
  texlive-latex-extra \
  nodejs \
  npm \
  && apt-get clean

WORKDIR /app
COPY . .

RUN npm install

CMD ["node", "server.js"]
