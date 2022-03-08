FROM golang:1.17.7-bullseye as litestream-builder

# set gopath for easy reference later
ENV GOPATH=/go

# install wget and unzip to download and extract litestream source
RUN apt-get update && apt-get install -y wget unzip

# download and extract litestream source
RUN wget https://github.com/benbjohnson/litestream/archive/refs/heads/main.zip
RUN unzip ./main.zip -d /src

# set working dir to litestream source
WORKDIR /src/litestream-main

# build and install litestream binary
RUN go install ./cmd/litestream

###############################################################################

# base node image
FROM node:16-bullseye-slim as base

# set for base and all that inherit from it
ENV NODE_ENV=production
ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA

# install openssl for prisma
RUN apt-get update && apt-get install -y openssl

###############################################################################

# install all node_modules, including dev
FROM base as deps

WORKDIR /remixapp/

ADD package.json package-lock.json ./
RUN npm install --production=false

###############################################################################

FROM base as production-deps

WORKDIR /remixapp/

# Copy deps and prune off dev ones
COPY --from=deps /remixapp/node_modules /remixapp/node_modules
ADD package.json package-lock.json ./
RUN npm prune --production

###############################################################################

FROM base as build

ENV NODE_ENV=production

WORKDIR /remixapp/

COPY --from=deps /remixapp/node_modules /remixapp/node_modules

# cache the prisma schema
ADD prisma .
RUN npx prisma generate
RUN npx routes-gen -d @routes-gen/remix

# build the app
ADD . .
RUN npm run build

###############################################################################

# finally, build the production image with minimal footprint
FROM base

ENV NODE_ENV=production

# copy litestream binary to /usr/local/bin
COPY --from=litestream-builder /go/bin/litestream /usr/bin/litestream
# copy litestream setup script
ADD setup-litestream.js /remixapp/setup-litestream.js
# copy litestream configs
ADD etc/litestream.primary.yml /etc/litestream.primary.yml
ADD etc/litestream.replica.yml /etc/litestream.replica.yml

# copy over production deps
COPY --from=production-deps /remixapp/node_modules /remixapp/node_modules
# copy over generated prisma client
COPY --from=build /remixapp/node_modules/.prisma /remixapp/node_modules/.prisma
# copy over built application and assets
COPY --from=build /remixapp/build /remixapp/build
COPY --from=build /remixapp/public /remixapp/public

# set working dir
WORKDIR /remixapp/

# add stuff
ADD . .

CMD ["sh", "scripts/start_with_migrations.sh"]
