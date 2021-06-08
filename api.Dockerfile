FROM node:14.17-alpine

# Set app directory
WORKDIR /usr/src/app

# Install git in order to allow installing
# npm packages from Github
RUN set -xe \
  && apk add --no-cache git

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./package*.json ./
COPY ./yarn.lock ./

RUN yarn

# Bundle app source
COPY . .

# Build app
RUN yarn build

# EXPOSE 8000

# we run the positions tools (in dev env) as it doesn't require any account id or other stuff as input
ENV NODE_ENV development
CMD ["node","./dist/tools/positions.js", "-watch"]
