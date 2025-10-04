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

RUN echo '<IfModule mime_module>\n\
    AddType application/javascript .js\n\
    AddType text/css .css\n\
    AddType application/json .json\n\
    AddType image/svg+xml .svg\n\
    AddType image/png .png\n\
    AddType image/jpeg .jpg .jpeg\n\
    </IfModule>\n\
    <VirtualHost *:80>\n\
    DocumentRoot /var/www/html\n\
    \n\
    <Directory /var/www/html>\n\
    Options FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
    </Directory>\n\
    \n\
    RewriteEngine On\n\
    # Never rewrite static asset extensions\n\
    RewriteCond %{REQUEST_URI} \.(css|js|map|png|jpg|jpeg|svg|webp|ico|json|txt|csv)$ [NC]\n\
    RewriteRule - [L]\n\
    # API routes to PHP\n\
    RewriteCond %{REQUEST_URI} ^/(routes|stops|buses|alerts|feedback|admin|trip|health|debug) [NC]\n\
    RewriteRule ^(.*)$ /public/index.php [QSA,L]\n\
    \n\
    # SPA fallback for everything else\n\
    RewriteCond %{REQUEST_FILENAME} !-f\n\
    RewriteCond %{REQUEST_FILENAME} !-d\n\
    RewriteRule . /index.html [L]\n\
    </VirtualHost>' > /etc/apache2/sites-available/000-default.conf

EXPOSE 80
