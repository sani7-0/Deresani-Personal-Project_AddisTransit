-- Sample data for ticketing system
-- Add plate numbers and capacity to existing buses

-- Update buses with plate numbers and capacity
UPDATE buses SET 
  plate_number = CASE id
    WHEN 1 THEN '91872301'
    WHEN 2 THEN '91872302'
    WHEN 3 THEN '91872303'
    WHEN 4 THEN '91872304'
    WHEN 5 THEN '91872305'
    WHEN 6 THEN '91872306'
    WHEN 7 THEN '91872307'
    WHEN 8 THEN '91872308'
    WHEN 9 THEN '91872309'
    WHEN 10 THEN '91872310'
    WHEN 11 THEN '91872311'
    WHEN 12 THEN '91872312'
    WHEN 13 THEN '91872313'
    WHEN 14 THEN '91872314'
    WHEN 15 THEN '91872315'
    WHEN 16 THEN '91872316'
    WHEN 17 THEN '91872317'
    WHEN 18 THEN '91872318'
    WHEN 19 THEN '91872319'
    WHEN 20 THEN '91872320'
    ELSE CONCAT('91872', LPAD(id, 3, '0'))
  END,
  max_capacity = CASE 
    WHEN id % 3 = 0 THEN 60  -- Larger buses
    WHEN id % 3 = 1 THEN 45   -- Medium buses
    ELSE 35                   -- Smaller buses
  END,
  current_passenger_count = FLOOR(RAND() * 30)  -- Random current passengers
WHERE plate_number IS NULL;

-- Insert sample ticket count data
INSERT INTO ticket_count (bus_id, route_id, plate_number, ticket_count, last_ticket_time)
SELECT 
  b.id,
  b.route_id,
  b.plate_number,
  FLOOR(RAND() * 25) as ticket_count,
  DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 60) MINUTE) as last_ticket_time
FROM buses b
WHERE b.plate_number IS NOT NULL
ON DUPLICATE KEY UPDATE
  ticket_count = VALUES(ticket_count),
  last_ticket_time = VALUES(last_ticket_time);

-- Add some sample buses if none exist
INSERT IGNORE INTO buses (route_id, lat, lng, plate_number, max_capacity, current_passenger_count)
SELECT 
  r.id,
  9.0054 + (RAND() - 0.5) * 0.1,  -- Random lat around Addis Ababa
  38.7636 + (RAND() - 0.5) * 0.1, -- Random lng around Addis Ababa
  CONCAT('91872', LPAD(r.id * 10 + FLOOR(RAND() * 5), 3, '0')),
  CASE 
    WHEN r.id % 3 = 0 THEN 60
    WHEN r.id % 3 = 1 THEN 45
    ELSE 35
  END,
  FLOOR(RAND() * 30)
FROM routes r
WHERE NOT EXISTS (SELECT 1 FROM buses WHERE route_id = r.id)
LIMIT 20;
