# EXACT IMPLEMENTATION FROM THE CHAT

## What You Asked For (Line by Line from Chat)

> "u get what i mean js add the table so that when a machine rolls out tickets it counts as +1 passenger on the tickts table and make sure it refrences the bus and routes so when i check my phone i can see that route number 12 for example with the bus plate of 91872309 has 25 citizens or sum shit and if the bus table doesnt have a plate row add it too"

## EXACT Implementation from Chat

### 1. Database Schema (EXACT from chat)

```sql
-- Add plate_number column to buses table
ALTER TABLE public.buses
ADD COLUMN plate_number TEXT;

-- Add unique constraint for plate numbers
ALTER TABLE public.buses
ADD CONSTRAINT buses_plate_number_key UNIQUE (plate_number);

-- Update existing buses with sample plate numbers
UPDATE public.buses SET plate_number = '91872309' WHERE id = 'bus-12-1';
UPDATE public.buses SET plate_number = '91872310' WHERE id = 'bus-12-2';
-- ... etc
```

### 2. Ticket Count Table (EXACT from chat)

```sql
CREATE TABLE public.ticket_count (
    id BIGSERIAL PRIMARY KEY,
    bus_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    ticket_count INTEGER DEFAULT 0 NOT NULL,
    last_ticket_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Foreign key constraints
    CONSTRAINT fk_ticket_count_bus FOREIGN KEY (bus_id) REFERENCES public.buses(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_count_route FOREIGN KEY (route_id) REFERENCES public.routes(id) ON DELETE CASCADE
);
```

### 3. Add Ticket Function (EXACT from chat)

```sql
CREATE OR REPLACE FUNCTION public.add_ticket(
    p_plate_number TEXT
) RETURNS JSONB AS $$
DECLARE
    v_bus_id TEXT;
    v_route_id TEXT;
    v_current_count INTEGER;
    v_max_capacity INTEGER;
    v_status TEXT;
    v_status_emoji TEXT;
BEGIN
    -- Get bus info from plate number
    SELECT id, route_id, current_passenger_count, max_capacity
    INTO v_bus_id, v_route_id, v_current_count, v_max_capacity
    FROM public.buses
    WHERE plate_number = p_plate_number;

    -- If bus not found, return error
    IF v_bus_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bus with plate number ' || p_plate_number || ' not found'
        );
    END IF;

    -- Add +1 to ticket count
    INSERT INTO public.ticket_count (bus_id, route_id, plate_number, ticket_count, last_ticket_time)
    VALUES (v_bus_id, v_route_id, p_plate_number, 1, NOW())
    ON CONFLICT (bus_id) DO UPDATE SET
        ticket_count = ticket_count.ticket_count + 1,
        last_ticket_time = NOW(),
        updated_at = NOW();

    -- Update bus passenger count
    UPDATE public.buses
    SET current_passenger_count = current_passenger_count + 1,
        last_updated = NOW()
    WHERE id = v_bus_id;

    -- Get updated count
    SELECT current_passenger_count, max_capacity
    INTO v_current_count, v_max_capacity
    FROM public.buses
    WHERE id = v_bus_id;

    -- Determine status
    IF v_current_count < (v_max_capacity * 0.5) THEN
        v_status := 'green';
        v_status_emoji := '🟢';
    ELSIF v_current_count < (v_max_capacity * 0.8) THEN
        v_status := 'yellow';
        v_status_emoji := '🟡';
    ELSE
        v_status := 'red';
        v_status_emoji := '🔴';
    END IF;

    -- Return success with current status
    RETURN jsonb_build_object(
        'success', true,
        'bus_id', v_bus_id,
        'route_id', v_route_id,
        'plate_number', p_plate_number,
        'current_passengers', v_current_count,
        'max_capacity', v_max_capacity,
        'status', v_status,
        'status_emoji', v_status_emoji,
        'ticket_time', NOW()
    );
END;
$$ LANGUAGE plpgsql;
```

### 4. Backend API (EXACT from chat)

```php
// Add ticket endpoint
if ($path === '/buses/add-ticket' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $body = json_decode(file_get_contents('php://input') ?: 'null', true);
        if (!is_array($body) || !isset($body['plateNumber'])) {
            jsonResponse(['error' => 'Plate number is required'], 400);
            exit;
        }

        $plateNumber = trim($body['plateNumber']);
        $stmt = $pdo->prepare("SELECT public.add_ticket(?)");
        $stmt->execute([$plateNumber]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $data = json_decode($result['add_ticket'], true);
        jsonResponse($data);
    } catch (Throwable $e) {
        error_log('Add ticket error: ' . $e->getMessage());
        jsonResponse(['error' => 'Failed to add ticket', 'details' => $e->getMessage()], 500);
    }
    exit;
}
```

### 5. Frontend API Functions (EXACT from chat)

```javascript
// Add ticket (when ticket machine prints ticket)
export const addTicket = (plateNumber) => {
  return safeFetch("/buses/add-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plateNumber }),
  });
};
```

## How It Works (EXACTLY as you specified)

1. **Ticket Machine Prints Ticket** → Calls `addTicket('91872309')`
2. **System Adds +1** → `current_passenger_count = current_passenger_count + 1`
3. **You Check Phone** → See "Route 12, bus 91872309 has 25 citizens"

## Test Commands (EXACT from chat)

```bash
# When ticket machine prints ticket
curl -X POST "http://localhost:3001/buses/add-ticket" \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "91872309"}'

# Check bus status on phone
curl "http://localhost:3001/buses/status?plateNumber=91872309"
```

**This is EXACTLY what the chat implemented - when a machine prints a ticket, it counts as +1 person on the bus!**
