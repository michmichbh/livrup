-- Seed restaurants
INSERT INTO public.restaurants (id, name, description, image_url, cuisine_type, address, rating, delivery_time, delivery_fee, minimum_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Le Petit Bistro', 'Authentic French cuisine with a modern twist', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', 'French', '15 Rue de la Paix, Paris', 4.8, '25-35 min', 2.99, 15.00),
  ('22222222-2222-2222-2222-222222222222', 'Tokyo Express', 'Fresh sushi and Japanese specialties', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', 'Japanese', '42 Avenue Montaigne, Paris', 4.6, '30-40 min', 3.49, 20.00),
  ('33333333-3333-3333-3333-333333333333', 'Mama Mia Pizzeria', 'Traditional Italian pizzas baked in wood-fired oven', 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400', 'Italian', '8 Place de la Bastille, Paris', 4.5, '20-30 min', 1.99, 12.00),
  ('44444444-4444-4444-4444-444444444444', 'Burger Palace', 'Gourmet burgers and crispy fries', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 'American', '23 Boulevard Haussmann, Paris', 4.4, '15-25 min', 2.49, 10.00),
  ('55555555-5555-5555-5555-555555555555', 'Spice Garden', 'Authentic Indian flavors and aromatic dishes', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', 'Indian', '56 Rue du Faubourg, Paris', 4.7, '35-45 min', 2.99, 18.00),
  ('66666666-6666-6666-6666-666666666666', 'Dragon Wok', 'Traditional Chinese cuisine and dim sum', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', 'Chinese', '12 Rue de Rivoli, Paris', 4.3, '25-35 min', 2.49, 15.00);

-- Seed menu items for Le Petit Bistro
INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Coq au Vin', 'Classic French braised chicken in red wine', 18.50, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400', 'Main'),
  ('11111111-1111-1111-1111-111111111111', 'Beef Bourguignon', 'Slow-cooked beef stew with vegetables', 22.00, 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=400', 'Main'),
  ('11111111-1111-1111-1111-111111111111', 'French Onion Soup', 'Traditional soup with melted gruyere', 9.50, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', 'Starter'),
  ('11111111-1111-1111-1111-111111111111', 'Crème Brûlée', 'Vanilla custard with caramelized sugar', 8.00, 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400', 'Dessert');

-- Seed menu items for Tokyo Express
INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Salmon Sashimi', 'Fresh salmon slices (8 pieces)', 16.00, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400', 'Sashimi'),
  ('22222222-2222-2222-2222-222222222222', 'Dragon Roll', 'Eel, avocado, and cucumber roll', 14.50, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400', 'Rolls'),
  ('22222222-2222-2222-2222-222222222222', 'Chicken Ramen', 'Rich broth with noodles and toppings', 13.00, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', 'Noodles'),
  ('22222222-2222-2222-2222-222222222222', 'Miso Soup', 'Traditional Japanese soup', 4.50, 'https://images.unsplash.com/photo-1607301405752-725e9520e30e?w=400', 'Starter');

-- Seed menu items for Mama Mia Pizzeria
INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Margherita', 'Fresh tomato, mozzarella, and basil', 12.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 'Pizza'),
  ('33333333-3333-3333-3333-333333333333', 'Quattro Formaggi', 'Four cheese blend pizza', 14.50, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 'Pizza'),
  ('33333333-3333-3333-3333-333333333333', 'Spaghetti Carbonara', 'Creamy pasta with pancetta', 13.00, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', 'Pasta'),
  ('33333333-3333-3333-3333-333333333333', 'Tiramisu', 'Classic Italian coffee dessert', 7.50, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', 'Dessert');

-- Seed menu items for Burger Palace
INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Classic Cheeseburger', 'Beef patty with cheddar and special sauce', 11.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 'Burgers'),
  ('44444444-4444-4444-4444-444444444444', 'Bacon Deluxe', 'Double patty with bacon and cheese', 14.50, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', 'Burgers'),
  ('44444444-4444-4444-4444-444444444444', 'Crispy Fries', 'Golden crispy french fries', 4.50, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', 'Sides'),
  ('44444444-4444-4444-4444-444444444444', 'Chocolate Milkshake', 'Creamy chocolate shake', 5.50, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400', 'Drinks');

-- Seed menu items for Spice Garden
INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category) VALUES
  ('55555555-5555-5555-5555-555555555555', 'Butter Chicken', 'Creamy tomato-based curry with chicken', 15.50, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', 'Main'),
  ('55555555-5555-5555-5555-555555555555', 'Lamb Biryani', 'Fragrant rice with spiced lamb', 17.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', 'Main'),
  ('55555555-5555-5555-5555-555555555555', 'Vegetable Samosas', 'Crispy pastry with spiced vegetables', 6.50, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 'Starter'),
  ('55555555-5555-5555-5555-555555555555', 'Garlic Naan', 'Fresh baked garlic bread', 3.50, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', 'Bread');

-- Seed menu items for Dragon Wok
INSERT INTO public.menu_items (restaurant_id, name, description, price, image_url, category) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Kung Pao Chicken', 'Spicy stir-fried chicken with peanuts', 13.50, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400', 'Main'),
  ('66666666-6666-6666-6666-666666666666', 'Sweet and Sour Pork', 'Classic Cantonese dish', 14.00, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400', 'Main'),
  ('66666666-6666-6666-6666-666666666666', 'Dim Sum Basket', 'Assorted steamed dumplings', 12.00, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', 'Dim Sum'),
  ('66666666-6666-6666-6666-666666666666', 'Fried Rice', 'Wok-fried rice with vegetables', 8.50, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400', 'Rice');
