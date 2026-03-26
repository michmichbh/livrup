-- Add more restaurants with Unsplash images
INSERT INTO restaurants (name, description, category, image_url, address, rating, delivery_fee, delivery_time, is_open, min_order)
VALUES 
  ('Sushi Master', 'Les meilleurs sushis de la ville, fraîcheur garantie', 'Sushi', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', '78 Avenue des Sushis, Paris', 4.9, 3.99, '30-45 min', true, 20.00),
  ('Taco Loco', 'Tacos mexicains authentiques et savoureux', 'Tacos', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800', '23 Rue du Mexique, Paris', 4.6, 2.50, '20-30 min', true, 12.00),
  ('Green Bowl', 'Cuisine végétarienne et vegan créative', 'Vegan', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', '45 Boulevard Bio, Paris', 4.7, 0, '25-35 min', true, 15.00),
  ('Sweet Paradise', 'Desserts et pâtisseries artisanales', 'Desserts', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', '12 Rue Sucrée, Paris', 4.8, 3.50, '20-30 min', true, 10.00)
ON CONFLICT DO NOTHING;

-- Get the IDs of the new restaurants
DO $$
DECLARE
  sushi_id uuid;
  taco_id uuid;
  green_id uuid;
  sweet_id uuid;
BEGIN
  SELECT id INTO sushi_id FROM restaurants WHERE name = 'Sushi Master' LIMIT 1;
  SELECT id INTO taco_id FROM restaurants WHERE name = 'Taco Loco' LIMIT 1;
  SELECT id INTO green_id FROM restaurants WHERE name = 'Green Bowl' LIMIT 1;
  SELECT id INTO sweet_id FROM restaurants WHERE name = 'Sweet Paradise' LIMIT 1;

  -- Sushi Master menu
  IF sushi_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available)
    VALUES 
      (sushi_id, 'Assortiment Sushi (12 pcs)', 'Sélection du chef: saumon, thon, crevette', 18.90, 'Sushis', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400', true),
      (sushi_id, 'California Roll (8 pcs)', 'Avocat, surimi, concombre', 12.50, 'Makis', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400', true),
      (sushi_id, 'Sashimi Saumon (10 pcs)', 'Tranches de saumon frais', 16.90, 'Sashimis', 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400', true),
      (sushi_id, 'Dragon Roll', 'Anguille grillée, avocat, sauce unagi', 14.90, 'Makis', 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400', true),
      (sushi_id, 'Edamame', 'Fèves de soja salées', 4.50, 'Entrées', 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=400', true),
      (sushi_id, 'Soupe Miso', 'Soupe traditionnelle japonaise', 3.90, 'Entrées', 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=400', true),
      (sushi_id, 'Gyoza (6 pcs)', 'Raviolis japonais grillés', 7.50, 'Entrées', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400', true),
      (sushi_id, 'Ramen Tonkotsu', 'Bouillon porc, œuf, chashu, nouilles', 14.90, 'Plats chauds', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', true),
      (sushi_id, 'Chirashi Bowl', 'Riz, poissons variés, légumes', 19.90, 'Plats', 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400', true),
      (sushi_id, 'Mochi glacé (3 pcs)', 'Dessert japonais glacé', 6.50, 'Desserts', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Taco Loco menu
  IF taco_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available)
    VALUES 
      (taco_id, 'Tacos al Pastor', 'Porc mariné, ananas, coriandre, oignon', 9.90, 'Tacos', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400', true),
      (taco_id, 'Tacos Carnitas', 'Porc effiloché, guacamole, salsa verde', 10.50, 'Tacos', 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400', true),
      (taco_id, 'Burrito Chicken', 'Poulet grillé, riz, haricots, fromage', 12.90, 'Burritos', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', true),
      (taco_id, 'Quesadilla', 'Tortilla, fromage fondu, poulet, poivrons', 11.50, 'Quesadillas', 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400', true),
      (taco_id, 'Nachos Supreme', 'Chips, fromage, viande, jalapeños, crème', 13.90, 'Entrées', 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400', true),
      (taco_id, 'Guacamole & Chips', 'Avocat frais écrasé, chips maison', 7.50, 'Entrées', 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=400', true),
      (taco_id, 'Bowl Mexicain', 'Riz, haricots, viande, légumes, sauce', 14.90, 'Bowls', 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=400', true),
      (taco_id, 'Churros (6 pcs)', 'Beignets sucrés, sauce chocolat', 6.90, 'Desserts', 'https://images.unsplash.com/photo-1624371414361-e670b70fc9e3?w=400', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Green Bowl menu
  IF green_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available)
    VALUES 
      (green_id, 'Buddha Bowl', 'Quinoa, légumes grillés, houmous, graines', 14.90, 'Bowls', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', true),
      (green_id, 'Açaí Bowl', 'Açaí, granola, fruits frais, miel', 12.50, 'Bowls', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400', true),
      (green_id, 'Wrap Végétarien', 'Légumes grillés, feta, sauce tahini', 11.90, 'Wraps', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', true),
      (green_id, 'Salade Caesar Vegan', 'Romaine, croûtons, parmesan vegan, sauce', 13.50, 'Salades', 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400', true),
      (green_id, 'Burger Végétal', 'Steak végétal, légumes, sauce maison', 15.90, 'Burgers', 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400', true),
      (green_id, 'Soupe du jour', 'Soupe fraîche aux légumes de saison', 6.90, 'Entrées', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', true),
      (green_id, 'Smoothie Green Detox', 'Épinards, pomme, gingembre, citron', 7.50, 'Boissons', 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400', true),
      (green_id, 'Energy Balls (4 pcs)', 'Dattes, noix, cacao, sans sucre ajouté', 5.90, 'Desserts', 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Sweet Paradise menu
  IF sweet_id IS NOT NULL THEN
    INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available)
    VALUES 
      (sweet_id, 'Tiramisu Classique', 'Mascarpone, café, cacao', 7.90, 'Desserts italiens', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', true),
      (sweet_id, 'Cheesecake New York', 'Fromage frais, spéculoos, fruits rouges', 8.50, 'Cheesecakes', 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400', true),
      (sweet_id, 'Fondant au Chocolat', 'Cœur coulant, glace vanille', 9.90, 'Chocolat', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400', true),
      (sweet_id, 'Crêpes Nutella Banane', 'Crêpe fraîche, Nutella, banane, chantilly', 8.90, 'Crêpes', 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400', true),
      (sweet_id, 'Tarte Citron Meringuée', 'Citron acidulé, meringue italienne', 7.50, 'Tartes', 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=400', true),
      (sweet_id, 'Cookie Géant', 'Cookie XXL, pépites de chocolat', 5.90, 'Cookies', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400', true),
      (sweet_id, 'Glace Artisanale (3 boules)', 'Choix de parfums maison', 6.50, 'Glaces', 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=400', true),
      (sweet_id, 'Bubble Waffle', 'Gaufre bulle, fruits, chantilly, sauce', 10.90, 'Gaufres', 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400', true),
      (sweet_id, 'Milkshake', 'Chocolat, vanille ou fraise', 6.90, 'Boissons', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400', true),
      (sweet_id, 'Café Gourmand', 'Espresso + 3 mini desserts', 9.50, 'Café', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Update existing restaurants with Unsplash images
UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800' WHERE name = 'Burger Palace' AND (image_url IS NULL OR image_url = '');
UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800' WHERE name = 'Pizza Roma' AND (image_url IS NULL OR image_url = '');
UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800' WHERE name = 'Le Petit Bistro' AND (image_url IS NULL OR image_url = '');
UPDATE restaurants SET image_url = 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800' WHERE name = 'Dragon Wok' AND (image_url IS NULL OR image_url = '');
