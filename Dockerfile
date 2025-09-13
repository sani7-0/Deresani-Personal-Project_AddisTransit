# Build React app
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Set environment variable for local API (same domain)
ENV VITE_API_URL=""

RUN npm run build

# Stage 2: Serve with PHP + Apache (frontend + backend)
FROM php:8.2-apache

# Install PDO + PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev && docker-php-ext-install pdo pdo_pgsql

WORKDIR /var/www/html

# Copy frontend build (React) to root
COPY --from=build /app/dist/ /var/www/html/

# Copy backend PHP files
COPY backend/php-api/ /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Enable mod_rewrite
RUN a2enmod rewrite

# Add Apache config: serve React at /, PHP API routes
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html\n\
    \n\
    # Frontend (React)\n\
    <Directory /var/www/html>\n\
    Options FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
    </Directory>\n\
    \n\
    # API routes\n\
    RewriteEngine On\n\
    RewriteCond %{REQUEST_URI} ^/(routes|stops|buses|alerts|feedback|admin|trip|health|debug)\n\
    RewriteRule ^(.*)$ /index.php [QSA,L]\n\
    \n\
    # React routing for all other routes\n\
    RewriteCond %{REQUEST_FILENAME} !-f\n\
    RewriteCond %{REQUEST_FILENAME} !-d\n\
    RewriteRule . /index.html [L]\n\
    </VirtualHost>' > /etc/apache2/sites-available/000-default.conf

EXPOSE 80
