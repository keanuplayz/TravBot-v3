###############
# Solution #1 #
###############
# https://github.com/geekduck/docker-node-canvas
# Took 20m 55s

#FROM node:12
#
#RUN apt-get update \
#	&& apt-get install -qq build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
#
#RUN mkdir -p /opt/node/js \
#	&& cd /opt/node \
#	&& npm i canvas
#
#WORKDIR /opt/node/js
#
#ENTRYPOINT ["node"]

###############
# Solution #2 #
###############
# https://github.com/Automattic/node-canvas/issues/729#issuecomment-352991456
# Took 22m 50s

#FROM ubuntu:xenial
#
#RUN apt-get update && apt-get install -y \
#	curl \
#	git
#
#RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - \
#	&& curl -sL https://deb.nodesource.com/setup_8.x | bash - \
#	&& curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
#	&& echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
#
#RUN apt-get update && apt-get install -y \
#	nodejs \
#	yarn \
#	libcairo2-dev \
#	libjpeg-dev \
#	libpango1.0-dev \
#	libgif-dev \
#	libpng-dev \
#	build-essential \
#	g++

###############
# Solution #3 #
###############
# https://github.com/Automattic/node-canvas/issues/866#issuecomment-330001221
# Took 7m 29s

FROM node:10.16.0-alpine
FROM mhart/alpine-node:8.5.0

RUN apk add --no-cache \
	build-base \
	g++ \
	cairo-dev \
	jpeg-dev \
	pango-dev \
	bash \
	imagemagick

# The rest of the commands to execute

COPY . .

RUN npm i

RUN npm run build

CMD ["npm", "start"]