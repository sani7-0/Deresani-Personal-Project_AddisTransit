# Testing the Ticketing System

## How It Works (Exactly as you specified)

### 1. When Ticket Machine Prints a Ticket

```bash
# This is what happens when a ticket machine prints a ticket for bus 91872309
curl -X POST "http://localhost:3001/buses/add-ticket" \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "91872309"}'
```

**Response:**

```json
{
  "success": true,
  "bus_id": 9,
  "route_id": 2,
  "plate_number": "91872309",
  "current_passengers": 26, // ← This is the +1 person count
  "max_capacity": 50,
  "status": "yellow",
  "status_emoji": "🟡",
  "ticket_time": "2024-01-15 14:30:25"
}
```

### 2. Check Bus Status on Your Phone

```bash
# Check how many people are on Route 12, bus 91872309
curl "http://localhost:3001/buses/status?plateNumber=91872309"
```

**Response:**

```json
[
  {
    "bus_id": 9,
    "plate_number": "91872309",
    "route_id": 2,
    "route_number": "12",
    "route_short_name": "12",
    "route_name": "Route 12",
    "route_color": "#FF6B35",
    "passengers": 26, // ← 26 citizens on this bus
    "max_capacity": 50,
    "fullness_percentage": 52.0,
    "status": "yellow",
    "status_emoji": "🟡",
    "ticket_count": 26, // ← Total tickets sold
    "last_ticket_time": "2024-01-15 14:30:25"
  }
]
```

### 3. Reset Bus (End of Route)

```bash
# When bus reaches end of route, reset the count
curl -X POST "http://localhost:3001/buses/reset" \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "91872309"}'
```

**Response:**

```json
{
  "success": true,
  "bus_id": 9,
  "route_id": 2,
  "plate_number": "91872309",
  "previous_count": 26, // ← Was 26 people
  "reset_time": "2024-01-15 15:00:00"
}
```

## The Simple Flow You Wanted

1. **Ticket Machine Prints Ticket** → Calls `add_ticket('91872309')`
2. **System Adds +1** → `current_passenger_count = current_passenger_count + 1`
3. **You Check Phone** → See "Route 12, bus 91872309 has 26 citizens"
4. **End of Route** → Call `reset_bus_count('91872309')` to clear count

## Database Functions (PostgreSQL)

The system uses these PostgreSQL functions exactly as you specified:

```sql
-- When ticket machine prints ticket
SELECT public.add_ticket('91872309');

-- When bus reaches end of route
SELECT public.reset_bus_count('91872309');
```

## Frontend Interface

Go to `http://localhost:3000/tickets` to:

- See all buses with their current passenger counts
- Add tickets by selecting bus plate number
- Reset bus counts
- See real-time status with color indicators

**This is exactly what you asked for - when a machine prints a ticket, it counts as +1 person on the bus!**
