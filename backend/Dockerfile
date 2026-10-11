FROM node:18

WORKDIR /mapguessr

COPY package*.json ./
RUN npm install

EXPOSE 3001

CMD ["npm", "run", "dev"]