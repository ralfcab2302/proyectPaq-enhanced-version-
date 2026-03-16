FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Sustituye la URL en el environment antes de compilar
ARG API_URL=http://localhost:3000/api
RUN sed -i "s|http://localhost:3000/api|${API_URL}|g" src/environments/environment.ts

RUN npm run build -- --configuration production

FROM nginx:alpine

COPY --from=build /app/dist/frontend-angular/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
