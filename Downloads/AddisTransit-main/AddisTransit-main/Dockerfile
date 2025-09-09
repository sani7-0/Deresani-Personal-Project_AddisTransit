# Stage 1: Build React app
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with PHP + Apache
FROM php:8.2-apache

# Install PDO and Postgres
RUN apt-get update && apt-get install -y libpq-dev && docker-php-ext-install pdo pdo_pgsql

WORKDIR /var/www/html

# Copy Vite build output
COPY --from=build /app/dist ./ 

# Copy PHP backend files
COPY --from=build /app/*.php ./

RUN chown -R www-data:www-data /var/www/html
RUN a2enmod rewrite

EXPOSE 80
