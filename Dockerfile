FROM node:current-alpine

COPY . .

RUN npm run build

CMD ["npm", "start"]