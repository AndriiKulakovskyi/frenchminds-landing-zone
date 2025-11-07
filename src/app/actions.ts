"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || '';
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email: email,
      }
    },
  });

  console.log("After signUp", error);


  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      // Create user profile
      const { error: updateError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: fullName,
          full_name: fullName,
          email: email,
          user_id: user.id,
          token_identifier: user.id,
          created_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error updating user profile:', updateError);
      }

      // Create user role as PI (pending approval)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'principal_investigator',
          approved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
      }
    } catch (err) {
      console.error('Error in user profile creation:', err);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect("success", "/dashboard/reset-password", "Password updated successfully");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const approveUserAction = async (userId: string) => {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if current user is admin
  const { isAdmin } = await import("@/utils/auth");
  const isCurrentUserAdmin = await isAdmin(user.id);
  if (!isCurrentUserAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Approve the user
  const { error } = await supabase
    .from('user_roles')
    .update({
      approved: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to approve user: ${error.message}`);
  }

  return { success: true };
};

export const rejectUserAction = async (userId: string) => {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if current user is admin
  const { isAdmin } = await import("@/utils/auth");
  const isCurrentUserAdmin = await isAdmin(user.id);
  if (!isCurrentUserAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Delete from user_roles table (this is what we can do from client)
  const { error: roleError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (roleError) {
    throw new Error(`Failed to delete user role: ${roleError.message}`);
  }

  // Delete from users table
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (userError) {
    console.error('Failed to delete user record:', userError);
    // Don't throw error here as the role deletion is the critical part
  }

  // Note: We cannot delete from auth.users without admin service role key
  // The user account will remain in auth but won't have any roles or access
  // Admin should delete the auth user manually from Supabase dashboard if needed

  return { success: true };
};

export const deleteUploadAction = async (uploadId: string) => {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if current user is admin
  const { isAdmin } = await import("@/utils/auth");
  const isCurrentUserAdmin = await isAdmin(user.id);
  if (!isCurrentUserAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Get upload details first
  const { data: upload, error: fetchError } = await supabase
    .from('data_uploads')
    .select('file_path, file_name')
    .eq('id', uploadId)
    .single();

  if (fetchError || !upload) {
    throw new Error(`Failed to fetch upload details: ${fetchError?.message || 'Upload not found'}`);
  }

  // Delete file from S3 storage if file_path exists
  if (upload.file_path) {
    const { error: storageError } = await supabase.storage
      .from('clinical-data-uploads')
      .remove([upload.file_path]);

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError);
      throw new Error(`Failed to delete file from storage: ${storageError.message}`);
    }
  }

  // Delete record from database
  const { error: deleteError } = await supabase
    .from('data_uploads')
    .delete()
    .eq('id', uploadId);

  if (deleteError) {
    throw new Error(`Failed to delete upload record: ${deleteError.message}`);
  }

  return { success: true, fileName: upload.file_name };
};

export const updateProfileAction = async (formData: FormData) => {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return encodedRedirect("error", "/dashboard/profile", "Not authenticated");
  }

  const fullName = formData.get("full_name")?.toString();

  if (!fullName) {
    return encodedRedirect("error", "/dashboard/profile", "Full name is required");
  }

  // Update user profile in public.users table
  const { error: profileError } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      name: fullName,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (profileError) {
    console.error('Error updating user profile:', profileError);
    return encodedRedirect("error", "/dashboard/profile", "Failed to update profile");
  }

  // Update auth.users metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      name: fullName
    }
  });

  if (authError) {
    console.error('Error updating auth metadata:', authError);
    return encodedRedirect("error", "/dashboard/profile", "Failed to update profile metadata");
  }

  return encodedRedirect("success", "/dashboard/profile", "Profile updated successfully");
};

export const deleteUserAction = async (userId: string) => {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if current user is admin
  const { isAdmin } = await import("@/utils/auth");
  const isCurrentUserAdmin = await isAdmin(user.id);
  if (!isCurrentUserAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Prevent self-deletion
  if (userId === user.id) {
    throw new Error("You cannot delete your own account");
  }

  // Delete from user_roles table
  const { error: roleError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (roleError) {
    throw new Error(`Failed to delete user role: ${roleError.message}`);
  }

  // Delete from users table
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (userError) {
    console.error('Failed to delete user record:', userError);
  }

  // Log the action in audit_logs
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'delete_user',
    resource_type: 'user',
    resource_id: userId,
    outcome: 'success',
    details: { deleted_user_id: userId }
  });

  return { success: true };
};

export const promoteToAdminAction = async (userId: string) => {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if current user is admin
  const { isAdmin } = await import("@/utils/auth");
  const isCurrentUserAdmin = await isAdmin(user.id);
  if (!isCurrentUserAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Update user role to admin
  const { error } = await supabase
    .from('user_roles')
    .update({
      role: 'admin',
      approved: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to promote user to admin: ${error.message}`);
  }

  // Log the action in audit_logs
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'promote_to_admin',
    resource_type: 'user_role',
    resource_id: userId,
    outcome: 'success',
    details: { promoted_user_id: userId }
  });

  return { success: true };
};