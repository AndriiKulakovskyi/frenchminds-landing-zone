import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import PIDashboard from "@/components/pi-dashboard";
import AdminDashboard from "@/components/admin-dashboard";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user role
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role, approved')
    .eq('user_id', user.id)
    .single();

  // Debug logging
  console.log('User ID:', user.id);
  console.log('User email:', user.email);
  console.log('User role data:', userRole);
  console.log('Role error:', roleError);

  // If no role exists, check if user is admin by email and assign role accordingly
  if (!userRole) {
    const adminEmails = [
      'andrii.kulakovskyi@fondation-fondamental.org',
      'admin@frenchminds.com'
    ];

    const isAdminEmail = adminEmails.includes(user.email || '');

    if (isAdminEmail) {
      // Auto-assign admin role and approve
      await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin',
          approved: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Redirect to dashboard (will reload and show admin dashboard)
      return redirect("/dashboard");
    } else {
      // Default PI role (pending approval)
      await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'principal_investigator',
          approved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
            <p className="text-muted-foreground mb-6">
              Your Principal Investigator account is awaiting administrator approval.
              You will receive access once your account has been reviewed.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator if you have any questions.
            </p>
          </div>
        </div>
      );
    }
  }

  // Check if PI account is approved (admins bypass this check)
  if (userRole.role === 'principal_investigator' && !userRole.approved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
          <p className="text-muted-foreground mb-6">
            Your Principal Investigator account is awaiting administrator approval. 
            You will receive access once your account has been reviewed.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator if you have any questions.
          </p>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on role
  if (userRole.role === 'admin') {
    return <AdminDashboard />;
  }

  return <PIDashboard />;
}