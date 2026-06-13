-- LuminaCRM Sample Customer Seeding Script
-- Seeds initial mock customer profiles with spent amounts, emails, and Indian contact details.

INSERT INTO customers (email, first_name, last_name, phone, total_spent, last_purchase_date) VALUES
('priya.sharma@example.com', 'Priya', 'Sharma', '+91 9876543210', 12450.50, NOW() - INTERVAL '5 days'),
('arjun.patel@example.com', 'Arjun', 'Patel', '+91 9812345678', 8400.00, NOW() - INTERVAL '12 days'),
('meera.gupta@example.com', 'Meera', 'Gupta', '+91 9898765432', 15600.75, NOW() - INTERVAL '2 days'),
('rohan.singh@example.com', 'Rohan', 'Singh', '+91 9832109876', 4200.00, NOW() - INTERVAL '34 days'),
('ananya.kumar@example.com', 'Ananya', 'Kumar', '+91 9845678901', 9800.50, NOW() - INTERVAL '18 days'),
('vikram.mehta@example.com', 'Vikram', 'Mehta', '+91 9856789012', 17200.00, NOW() - INTERVAL '4 days'),
('nisha.joshi@example.com', 'Nisha', 'Joshi', '+91 9867890123', 5300.25, NOW() - INTERVAL '42 days'),
('kabir.kapoor@example.com', 'Kabir', 'Kapoor', '+91 9878901234', 11500.00, NOW() - INTERVAL '9 days'),
('zara.bose@example.com', 'Zara', 'Bose', '+91 9889012345', 21000.50, NOW() - INTERVAL '1 day'),
('ishaan.nair@example.com', 'Ishaan', 'Nair', '+91 9890123456', 3100.00, NOW() - INTERVAL '56 days')
ON CONFLICT (email) DO NOTHING;
