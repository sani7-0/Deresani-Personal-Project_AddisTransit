-- PostgreSQL Functions for Ticketing System
-- These are the exact functions from your database

CREATE FUNCTION public.add_ticket(p_plate_number text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_bus_id TEXT;
    v_route_id TEXT;
    v_current_passengers INTEGER;
    v_max_capacity INTEGER;
    v_status TEXT;
    v_status_emoji TEXT;
    v_ticket_time TIMESTAMPTZ;
BEGIN
    -- Get bus info
    SELECT id, route_id, current_passenger_count, max_capacity
    INTO v_bus_id, v_route_id, v_current_passengers, v_max_capacity
    FROM public.buses
    WHERE plate_number = p_plate_number;
    
    IF v_bus_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bus not found');
    END IF;
    
    -- Check if bus is full
    IF v_current_passengers >= v_max_capacity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bus is full');
    END IF;
    
    -- Update passenger count
    UPDATE public.buses 
    SET current_passenger_count = current_passenger_count + 1,
        last_updated = NOW()
    WHERE id = v_bus_id;
    
    -- Update ticket count
    INSERT INTO public.ticket_count (bus_id, route_id, plate_number, ticket_count, last_ticket_time)
    VALUES (v_bus_id, v_route_id, p_plate_number, 1, NOW())
    ON CONFLICT (bus_id) 
    DO UPDATE SET 
        ticket_count = ticket_count + 1,
        last_ticket_time = NOW(),
        updated_at = NOW();
    
    -- Get updated values
    SELECT current_passenger_count, max_capacity
    INTO v_current_passengers, v_max_capacity
    FROM public.buses
    WHERE id = v_bus_id;
    
    -- Determine status
    IF v_current_passengers < (v_max_capacity * 0.5) THEN
        v_status := 'green';
        v_status_emoji := '🟢';
    ELSIF v_current_passengers < (v_max_capacity * 0.8) THEN
        v_status := 'yellow';
        v_status_emoji := '🟡';
    ELSE
        v_status := 'red';
        v_status_emoji := '🔴';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'bus_id', v_bus_id,
        'route_id', v_route_id,
        'plate_number', p_plate_number,
        'current_passengers', v_current_passengers,
        'max_capacity', v_max_capacity,
        'status', v_status,
        'status_emoji', v_status_emoji,
        'ticket_time', NOW()
    );
END;
$$;

CREATE FUNCTION public.reset_bus_count(p_plate_number text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_bus_id TEXT;
    v_route_id TEXT;
    v_previous_count INTEGER;
BEGIN
    -- Get bus info
    SELECT id, route_id, current_passenger_count
    INTO v_bus_id, v_route_id, v_previous_count
    FROM public.buses
    WHERE plate_number = p_plate_number;
    
    IF v_bus_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bus not found');
    END IF;
    
    -- Reset passenger count
    UPDATE public.buses 
    SET current_passenger_count = 0,
        last_updated = NOW()
    WHERE id = v_bus_id;
    
    -- Reset ticket count
    UPDATE public.ticket_count 
    SET ticket_count = 0,
        last_ticket_time = NOW(),
        updated_at = NOW()
    WHERE bus_id = v_bus_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'bus_id', v_bus_id,
        'route_id', v_route_id,
        'plate_number', p_plate_number,
        'previous_count', v_previous_count,
        'reset_time', NOW()
    );
END;
$$;