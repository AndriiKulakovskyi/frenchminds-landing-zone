import { createClient } from "../../supabase/server";

/**
 * Check if a user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role, approved')
    .eq('user_id', userId)
    .single();

  return userRole?.role === 'admin' && userRole?.approved === true;
}

/**
 * Check if a user is an approved Principal Investigator
 */
export async function isApprovedPI(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role, approved')
    .eq('user_id', userId)
    .single();

  return userRole?.role === 'principal_investigator' && userRole?.approved === true;
}

/**
 * Check if a user is approved (either admin or approved PI)
 */
export async function isApprovedUser(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role, approved')
    .eq('user_id', userId)
    .single();

  if (!userRole) return false;
  
  // Admins are always approved, PIs need explicit approval
  if (userRole.role === 'admin') return true;
  if (userRole.role === 'principal_investigator') return userRole.approved === true;
  
  return false;
}

/**
 * Get user role information
 */
export async function getUserRole(userId: string) {
  const supabase = await createClient();
  
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role, approved, approved_at, approved_by')
    .eq('user_id', userId)
    .single();

  return userRole;
}
