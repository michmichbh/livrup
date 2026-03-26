-- Fix schema to match application code

-- Add missing columns to restaurants if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'category') THEN
    ALTER TABLE public.restaurants ADD COLUMN category TEXT DEFAULT 'Restaurant';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'is_open') THEN
    ALTER TABLE public.restaurants ADD COLUMN is_open BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Update existing data to use new columns
UPDATE public.restaurants 
SET category = COALESCE(cuisine_type, 'Restaurant'),
    is_open = COALESCE(is_active, true)
WHERE category IS NULL OR is_open IS NULL;

-- Add driver access policies for orders
DROP POLICY IF EXISTS "Drivers can view ready orders" ON public.orders;
CREATE POLICY "Drivers can view ready orders" ON public.orders 
FOR SELECT USING (
  status = 'ready' AND driver_id IS NULL AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'driver')
);

DROP POLICY IF EXISTS "Drivers can claim orders" ON public.orders;
CREATE POLICY "Drivers can claim orders" ON public.orders 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'driver')
);

-- Allow drivers to insert earnings
DROP POLICY IF EXISTS "Drivers can insert earnings" ON public.driver_earnings;
CREATE POLICY "Drivers can insert earnings" ON public.driver_earnings 
FOR INSERT WITH CHECK (auth.uid() = driver_id);

-- Allow admins to insert/update/delete orders
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow order items to be read by admins
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow drivers to view order items for their orders
DROP POLICY IF EXISTS "Drivers can view order items" ON public.order_items;
CREATE POLICY "Drivers can view order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND driver_id = auth.uid())
);
