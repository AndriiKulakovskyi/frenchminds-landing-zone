-- Script to create additional admin users
-- Usage: Run this script in your Supabase SQL editor or via psql
-- 
-- Instructions:
-- 1. Replace 'admin@example.com' with the desired admin email
-- 2. Replace 'AdminPassword123!' with a secure password
-- 3. Replace 'John Doe' with the admin's full name
-- 4. Run the script
--
-- Note: This script creates a user in auth.users with proper password hashing
-- and sets up the corresponding records in public.users and public.user_roles

-- Example usage (replace these values):
-- \set admin_email 'admin@example.com'
-- \set admin_password 'AdminPassword123!'
-- \set admin_name 'John Doe'

-- For direct execution, replace the variables below:
DO $$
DECLARE
    admin_email TEXT := 'admin@example.com';  -- CHANGE THIS
    admin_password TEXT := 'AdminPassword123!';  -- CHANGE THIS
    admin_name TEXT := 'John Doe';  -- CHANGE THIS
    new_user_id UUID;
BEGIN
    -- Insert new admin user into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "' || admin_name || '", "name": "' || split_part(admin_name, ' ', 1) || '"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO new_user_id;

    -- Insert into public.users table
    INSERT INTO public.users (
        id,
        user_id,
        email,
        name,
        full_name,
        token_identifier,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        new_user_id::text,
        admin_email,
        split_part(admin_name, ' ', 1),
        admin_name,
        new_user_id,
        NOW(),
        NOW()
    );

    -- Insert admin role into user_roles table
    INSERT INTO public.user_roles (
        user_id,
        role,
        approved,
        approved_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'admin',
        true,
        NOW(),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Admin user created successfully: % (ID: %)', admin_email, new_user_id;
END $$;

-- Alternative: Function-based approach for easier reuse
-- This creates a function that can be called multiple times
CREATE OR REPLACE FUNCTION create_admin_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Insert new admin user into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "' || p_full_name || '", "name": "' || split_part(p_full_name, ' ', 1) || '"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO new_user_id;

    -- Insert into public.users table
    INSERT INTO public.users (
        id,
        user_id,
        email,
        name,
        full_name,
        token_identifier,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        new_user_id::text,
        p_email,
        split_part(p_full_name, ' ', 1),
        p_full_name,
        new_user_id,
        NOW(),
        NOW()
    );

    -- Insert admin role into user_roles table
    INSERT INTO public.user_roles (
        user_id,
        role,
        approved,
        approved_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'admin',
        true,
        NOW(),
        NOW(),
        NOW()
    );

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage of the function:
-- SELECT create_admin_user('admin2@example.com', 'SecurePassword123!', 'Jane Smith');
-- SELECT create_admin_user('admin3@example.com', 'AnotherPassword456!', 'Bob Johnson');
