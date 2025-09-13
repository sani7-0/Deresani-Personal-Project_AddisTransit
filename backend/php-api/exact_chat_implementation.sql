-- EXACT IMPLEMENTATION FROM THE CHAT - LINE BY LINE

-- 1. Add Plate Number to Buses Table
ALTER TABLE public.buses 
ADD COLUMN plate_number TEXT;

-- Add unique constraint for plate numbers
ALTER TABLE public.buses 
ADD CONSTRAINT buses_plate_number_key UNIQUE (plate_number);

-- Update existing buses with sample plate numbers
UPDATE public.buses SET plate_number = '91872309' WHERE id = 'bus-12-1';
UPDATE public.buses SET plate_number = '91872310' WHERE id = 'bus-12-2';
UPDATE public.buses SET plate_number = '91872311' WHERE id = 'bus-24-1';
UPDATE public.buses SET plate_number = '91872312' WHERE id = 'bus-24-2';
UPDATE public.buses SET plate_number = '91872313' WHERE id = 'bus-36-1';
UPDATE public.buses SET plate_number = '91872314' WHERE id = 'bus-36-2';
UPDATE public.buses SET plate_number = '91872315' WHERE id = 'bus-45-1';
UPDATE public.buses SET plate_number = '91872316' WHERE id = 'bus-45-2';
UPDATE public.buses SET plate_number = '91872317' WHERE id = 'bus-91-1';
UPDATE public.buses SET plate_number = '91872318' WHERE id = 'bus-91-2';
UPDATE public.buses SET plate_number = '91872319' WHERE id = 'bus-53-1';
UPDATE public.buses SET plate_number = '91872320' WHERE id = 'bus-53-2';
UPDATE public.buses SET plate_number = '91872321' WHERE id = 'bus-82-1';
UPDATE public.buses SET plate_number = '91872322' WHERE id = 'bus-82-2';
UPDATE public.buses SET plate_number = '91872323' WHERE id = 'bus-38-1';
UPDATE public.buses SET plate_number = '91872324' WHERE id = 'bus-38-2';
UPDATE public.buses SET plate_number = '91872325' WHERE id = 'bus-64-1';
UPDATE public.buses SET plate_number = '91872326' WHERE id = 'bus-64-2';
UPDATE public.buses SET plate_number = '91872327' WHERE id = 'bus-29-1';
UPDATE public.buses SET plate_number = '91872328' WHERE id = 'bus-29-2';
UPDATE public.buses SET plate_number = '91872329' WHERE id = 'bus-77-1';
UPDATE public.buses SET plate_number = '91872330' WHERE id = 'bus-77-2';

-- 2. Create Simple Ticket Count Table
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

-- Create indexes for performance
CREATE INDEX idx_ticket_count_bus_id ON public.ticket_count(bus_id);
CREATE INDEX idx_ticket_count_route_id ON public.ticket_count(route_id);
CREATE INDEX idx_ticket_count_plate ON public.ticket_count(plate_number);
CREATE INDEX idx_ticket_count_time ON public.ticket_count(last_ticket_time DESC);

-- 3. Create Function to Add Ticket (Simple +1 Counter)
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

-- 4. Create Function to Reset Bus Count (End of Route)
CREATE OR REPLACE FUNCTION public.reset_bus_count(
    p_plate_number TEXT
) RETURNS JSONB AS $$
DECLARE
    v_bus_id TEXT;
    v_route_id TEXT;
    v_old_count INTEGER;
BEGIN
    -- Get bus info
    SELECT id, route_id, current_passenger_count
    INTO v_bus_id, v_route_id, v_old_count
    FROM public.buses 
    WHERE plate_number = p_plate_number;
    
    -- If bus not found, return error
    IF v_bus_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bus with plate number ' || p_plate_number || ' not found'
        );
    END IF;
    
    -- Reset passenger count
    UPDATE public.buses 
    SET current_passenger_count = 0,
        last_updated = NOW()
    WHERE id = v_bus_id;
    
    -- Reset ticket count
    UPDATE public.ticket_count 
    SET ticket_count = 0,
        updated_at = NOW()
    WHERE bus_id = v_bus_id;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'bus_id', v_bus_id,
        'route_id', v_route_id,
        'plate_number', p_plate_number,
        'previous_count', v_old_count,
        'reset_time', NOW()
    );
END;
$$ LANGUAGE plpgsql;
