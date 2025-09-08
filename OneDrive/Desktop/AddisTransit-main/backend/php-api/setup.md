# PHP API Setup Instructions

## 1. Database Setup

### Create PostgreSQL Database

```sql
CREATE DATABASE transit;
\c transit;
```

### Create Tables

Run the schema file:

```bash
psql -U postgres -d transit -f schema.mysql.sql
```

### Add Sample Data

```bash
psql -U postgres -d transit -f sample_data_addis_ababa.sql
```

## 2. Environment Variables (Optional)

Create a `.env` file in the `backend/php-api` directory:

```
DB_HOST=127.0.0.1
DB_NAME=transit
DB_USER=postgres
DB_PASS=postgres
DB_PORT=5432
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

**Note:** The `MAPBOX_ACCESS_TOKEN` is optional but recommended for road snapping. Without it, routes will be drawn as straight lines between stops.

## 3. Start the API Server

```bash
cd backend/php-api
php -S 0.0.0.0:3001 -t public
```

## 4. Test the API

Visit: http://localhost:3001/health

You should see: `{"ok":true}`

## 5. Troubleshooting

### If you get 500 errors:

1. Check if PostgreSQL is running
2. Check if the database exists
3. Check if tables exist
4. Check if sample data was inserted

### Test database connection:

```bash
psql -U postgres -d transit -c "SELECT COUNT(*) FROM routes;"
```

Should return: `5` (number of routes in sample data)

## 6. Road Snapping

The API now supports road snapping using Mapbox Directions API:

- Routes will follow actual roads instead of straight lines
- Requires a Mapbox access token in the `.env` file
- Falls back to straight lines if no token is provided or API fails
