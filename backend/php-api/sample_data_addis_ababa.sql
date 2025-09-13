-- Sample data for Addis Ababa transit system
-- Run this after creating the tables

-- Insert routes
INSERT INTO routes (short_name, name, color, description) VALUES 
('1', 'Route 1 - Bole to Piazza', '#1e40af', 'Main route connecting Bole to Piazza via Meskel Square'),
('2', 'Route 2 - CMC to Arat Kilo', '#16a34a', 'Route from CMC to Arat Kilo via Mexico Square'),
('3', 'Route 3 - Kazanchis to Merkato', '#f59e0b', 'Busy route connecting Kazanchis to Merkato'),
('4', 'Route 4 - Bole to Airport', '#dc2626', 'Direct route from Bole to Addis Ababa Airport'),
('5', 'Route 5 - Piazza to Merkato', '#7c3aed', 'Historic route through the city center');

-- Insert stops for Route 1 (Bole to Piazza)
INSERT INTO stops (route_id, name, lat, lng, sequence) VALUES 
(1, 'Bole Medhanealem', 8.9806, 38.7578, 1),
(1, 'Meskel Square', 9.0054, 38.7636, 2),
(1, 'Mexico Square', 9.0136, 38.7500, 3),
(1, 'Piazza', 9.0333, 38.7500, 4);

-- Insert stops for Route 2 (CMC to Arat Kilo)
INSERT INTO stops (route_id, name, lat, lng, sequence) VALUES 
(2, 'CMC', 9.0167, 38.7333, 1),
(2, 'Mexico Square', 9.0136, 38.7500, 2),
(2, 'Arat Kilo', 9.0333, 38.7500, 3);

-- Insert stops for Route 3 (Kazanchis to Merkato)
INSERT INTO stops (route_id, name, lat, lng, sequence) VALUES 
(3, 'Kazanchis', 9.0167, 38.7500, 1),
(3, 'Mexico Square', 9.0136, 38.7500, 2),
(3, 'Merkato', 9.0167, 38.7333, 3);

-- Insert stops for Route 4 (Bole to Airport)
INSERT INTO stops (route_id, name, lat, lng, sequence) VALUES 
(4, 'Bole Medhanealem', 8.9806, 38.7578, 1),
(4, 'Addis Ababa Airport', 8.9779, 38.7993, 2);

-- Insert stops for Route 5 (Piazza to Merkato)
INSERT INTO stops (route_id, name, lat, lng, sequence) VALUES 
(5, 'Piazza', 9.0333, 38.7500, 1),
(5, 'Mexico Square', 9.0136, 38.7500, 2),
(5, 'Merkato', 9.0167, 38.7333, 3);

-- Insert sample buses
INSERT INTO buses (route_id, lat, lng, heading, speed, occupancy, vehicle_number, next_stop, eta) VALUES 
(1, 8.9850, 38.7600, 45, 25, 15, 'AA001', 'Meskel Square', '3 min'),
(1, 9.0080, 38.7650, 90, 20, 22, 'AA002', 'Mexico Square', '7 min'),
(2, 9.0180, 38.7350, 180, 30, 18, 'AA003', 'Mexico Square', '2 min'),
(3, 9.0200, 38.7520, 270, 15, 35, 'AA004', 'Mexico Square', '5 min'),
(4, 8.9850, 38.7600, 135, 40, 8, 'AA005', 'Addis Ababa Airport', '12 min'),
(5, 9.0350, 38.7520, 225, 18, 28, 'AA006', 'Mexico Square', '4 min');

-- Insert sample alerts
INSERT INTO alerts (type, severity, title, description, affected_routes, affected_stops, start_time, end_time, is_active) VALUES 
('disruption', 'high', 'Route 3 Service Delayed', 'Heavy traffic around Merkato causing delays on Route 3', '["3"]', '["Merkato"]', NOW(), NOW() + INTERVAL '2 hours', true),
('delay', 'medium', 'Route 1 Minor Delays', 'Construction near Meskel Square causing 10-15 minute delays', '["1"]', '["Meskel Square"]', NOW(), NOW() + INTERVAL '4 hours', true),
('maintenance', 'low', 'Route 4 Weekend Service', 'Route 4 will have reduced frequency this weekend', '["4"]', '[]', NOW() + INTERVAL '1 day', NOW() + INTERVAL '3 days', false),
('info', 'low', 'New Route 6 Coming Soon', 'New route connecting Bole to CMC will start next month', '[]', '[]', NOW(), NULL, true);
