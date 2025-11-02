-- Seed file to create default users for French Minds Landing Zone
-- This deletes all existing users and creates two specific users:
-- 1. Admin user: andrii.kulakovskyi@fondation-fondamental.org
-- 2. PI user: andrii.kulakovskyi@gmail.com
--
-- IMPORTANT: Run migrations first before running this seed file!
-- Run: supabase db reset or apply migrations manually

DO $$
DECLARE
    admin_user_id UUID;
    pi_user_id UUID;
    table_exists BOOLEAN;
BEGIN
    -- Check if required tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'Required tables do not exist. Please run migrations first: supabase db reset';
    END IF;
    
    -- Delete all existing users and related data
    RAISE NOTICE 'Deleting all existing users...';
    
    -- Disable foreign key checks temporarily
    SET session_replication_role = replica;
    
    -- Delete from all user-related tables (only if they exist)
    DELETE FROM public.user_roles WHERE true;
    DELETE FROM public.users WHERE true;
    DELETE FROM public.data_uploads WHERE true;
    DELETE FROM public.patients WHERE true;
    DELETE FROM public.audit_logs WHERE true;
    DELETE FROM auth.users WHERE true;
    
    -- Re-enable foreign key checks
    SET session_replication_role = DEFAULT;
    
    RAISE NOTICE 'All existing users deleted.';
    
    -- Create Admin user
    RAISE NOTICE 'Creating admin user...';
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
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
        'andrii.kulakovskyi@fondation-fondamental.org',
        crypt('FondaMental2025', gen_salt('bf')),
        NOW(),
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Andrii Kulakovskyi", "name": "Andrii"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO admin_user_id;

    -- Insert admin user into public.users table
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
        admin_user_id,
        admin_user_id::text,
        'andrii.kulakovskyi@fondation-fondamental.org',
        'Andrii',
        'Andrii Kulakovskyi',
        admin_user_id,
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
        admin_user_id,
        'admin',
        true,
        NOW(),
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Admin user created: andrii.kulakovskyi@fondation-fondamental.org (ID: %)', admin_user_id;
    
    -- Create PI user
    RAISE NOTICE 'Creating PI user...';
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
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
        'andrii.kulakovskyi@gmail.com',
        crypt('FondaMental2025', gen_salt('bf')),
        NOW(),
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Andrii Kulakovskyi", "name": "Andrii"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) RETURNING id INTO pi_user_id;

    -- Insert PI user into public.users table
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
        pi_user_id,
        pi_user_id::text,
        'andrii.kulakovskyi@gmail.com',
        'Andrii',
        'Andrii Kulakovskyi',
        pi_user_id,
        NOW(),
        NOW()
    );

    -- Insert PI role into user_roles table (approved by default for this specific user)
    INSERT INTO public.user_roles (
        user_id,
        role,
        approved,
        approved_at,
        approved_by,
        created_at,
        updated_at
    ) VALUES (
        pi_user_id,
        'principal_investigator',
        true,
        NOW(),
        admin_user_id,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'PI user created: andrii.kulakovskyi@gmail.com (ID: %)', pi_user_id;
    RAISE NOTICE 'Seed completed successfully!';
    
END $$;
