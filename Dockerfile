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
WORKDIR /remixapp/
COPY --from=deps /remixapp/node_modules /remixapp/node_modules
# schema doesn't change much so these will stay cached
ADD prisma .
RUN npx prisma generate
# app code changes all the time
ADD . .
RUN npm run build

###############################################################################

# finally, build the production image with minimal footprint
FROM base
WORKDIR /remixapp/
# copy over production deps
COPY --from=production-deps /remixapp/node_modules /remixapp/node_modules
# copy over generated prisma client
COPY --from=build /remixapp/node_modules/.prisma /remixapp/node_modules/.prisma
# copy over built application and assets
COPY --from=build /remixapp/build /remixapp/build
COPY --from=build /remixapp/public /remixapp/public
# add stuff
ADD . .
CMD ["sh", "scripts/start_with_migrations.sh"]
