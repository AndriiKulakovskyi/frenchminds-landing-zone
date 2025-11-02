-- Migration to add RLS policies for admin approval workflow

-- Enable RLS on user_roles table if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

-- Policy: Users can insert their own role (for signup)
CREATE POLICY "Users can insert own role" ON public.user_roles 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own role
CREATE POLICY "Users can view own role" ON public.user_roles 
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all user roles
CREATE POLICY "Admins can view all roles" ON public.user_roles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin' 
    AND ur.approved = true
  )
);

-- Policy: Admins can update approval status
CREATE POLICY "Admins can update roles" ON public.user_roles 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin' 
    AND ur.approved = true
  )
);

-- Policy: Admins can delete roles (for rejection)
CREATE POLICY "Admins can delete roles" ON public.user_roles 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin' 
    AND ur.approved = true
  )
);

-- Update users table policies to allow admins to view all users
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data" ON public.users 
FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin' 
    AND ur.approved = true
  )
);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON public.users 
FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data" ON public.users 
FOR INSERT WITH CHECK (auth.uid()::text = user_id);
