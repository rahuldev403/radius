import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-emerald-600 hover:bg-emerald-700 text-sm normal-case",
            card: "shadow-xl",
          },
        }}
        redirectUrl="/dashboard"
      />
    </div>
  );
}
