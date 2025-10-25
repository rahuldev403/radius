"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Test123!");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [authSettings, setAuthSettings] = useState<any>(null);

  const testSignup = async () => {
    setLoading(true);
    setResult(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setResult({ data, error });
    setLoading(false);
  };

  const checkAuthSettings = async () => {
    setLoading(true);
    try {
      // Check if we can access the settings
      const { data: session } = await supabase.auth.getSession();
      setAuthSettings({
        hasSession: !!session.session,
        redirectTo: `${window.location.origin}/auth/callback`,
        siteUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      });
    } catch (error) {
      setAuthSettings({ error: String(error) });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Verification Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={testSignup} disabled={loading || !email}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Signup"
                )}
              </Button>

              <Button
                onClick={checkAuthSettings}
                variant="outline"
                disabled={loading}
              >
                Check Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auth Settings */}
        {authSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Auth Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(authSettings, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.error ? (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    Signup Failed
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Signup Initiated
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Error:</strong> {result.error.message}
                  </AlertDescription>
                </Alert>
              )}

              {result.data && (
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription>
                      {result.data.user?.identities?.length === 0 ? (
                        <span className="text-orange-600">
                          ⚠️ User already exists. Email not sent.
                        </span>
                      ) : (
                        <span className="text-green-600">
                          ✅ Signup successful! Check your email inbox (and spam
                          folder).
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="font-medium mb-2">User Data:</h3>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(result.data.user, null, 2)}
                    </pre>
                  </div>

                  {result.data.user && (
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>User ID:</strong> {result.data.user.id}
                      </p>
                      <p>
                        <strong>Email:</strong> {result.data.user.email}
                      </p>
                      <p>
                        <strong>Email Confirmed:</strong>{" "}
                        {result.data.user.email_confirmed_at ? (
                          <span className="text-green-600">✅ Yes</span>
                        ) : (
                          <span className="text-orange-600">
                            ❌ No (pending verification)
                          </span>
                        )}
                      </p>
                      <p>
                        <strong>Created At:</strong>{" "}
                        {result.data.user.created_at}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Enter a real email address you can access</p>
            <p>2. Click "Test Signup" to send verification email</p>
            <p>3. Check your email inbox (and spam folder!)</p>
            <p>4. Click the verification link in the email</p>
            <p>5. You should be redirected to the success page</p>
            <hr className="my-4" />
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> If you don't receive an email:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>Check your Supabase Dashboard → Authentication → Settings</li>
              <li>Ensure "Enable email confirmations" is checked</li>
              <li>Add redirect URL: http://localhost:3000/auth/callback</li>
              <li>Check Supabase logs for email send errors</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
