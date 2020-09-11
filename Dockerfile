FROM node:current-alpine

COPY . .

RUN npm i

RUN npm run build

CMD ["npm", "start"]