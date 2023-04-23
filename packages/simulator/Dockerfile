FROM node:18.16.0

WORKDIR /src

RUN apt-get update && \
    apt-get install build-essential librdkafka-dev -y && \
    npm ci

CMD ["tail", "-f", "/dev/null"]