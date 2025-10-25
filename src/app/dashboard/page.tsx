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
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role, approved')
    .eq('user_id', user.id)
    .single();

  // If no role exists, create default PI role (pending approval)
  if (!userRole) {
    await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'principal_investigator',
        approved: false,
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

  // Check if PI account is approved
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