import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import DashboardNavbar from "@/components/dashboard-navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key } from "lucide-react";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <>
        <DashboardNavbar />
        <div className="flex h-screen w-full flex-1 items-center justify-center p-4">
          <FormMessage message={searchParams} />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Reset Password</CardTitle>
              </div>
              <CardDescription>
                Enter your new password below to update your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="w-full"
                  />
                </div>

                <FormMessage message={searchParams} />

                <SubmitButton
                  formAction={resetPasswordAction}
                  pendingText="Updating password..."
                  className="w-full"
                >
                  Update Password
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
