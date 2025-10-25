ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

DROP POLICY IF EXISTS "Users can insert roles" ON public.user_roles;
CREATE POLICY "Users can insert roles" ON public.user_roles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (true);
