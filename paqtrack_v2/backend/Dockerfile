FROM node:20-alpine

WORKDIR /app

# Copiar dependencias primero (cache layer)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
