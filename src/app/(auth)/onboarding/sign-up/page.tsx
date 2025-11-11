import { ScreenScaffold } from "@/components/common/screen-scaffold";

export default function SignUpScreen() {
  return (
    <ScreenScaffold
      title="Sign Up Options"
      description="Entry point into account creation with multiple authentication providers."
      highlights={[
        "Email & password form with strength meter",
        "Phone OTP flow with Twilio placeholder",
        "Federated buttons for Google and Apple",
        "Link for existing members to sign in",
      ]}
    />
  );
}
