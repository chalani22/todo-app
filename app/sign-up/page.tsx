// app/sign-up/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Eye, EyeOff, Info, Loader2, ShieldCheck } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Basic client-side validation
  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;
  }, [name, email, password]);

  // Better Auth sign-up (email + password)
  const signUp = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message || "Sign up failed");
    },
    onSuccess: () => router.push("/sign-in"),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen w-full flex-col lg:flex-row overflow-hidden">
        {/* Left branding panel (desktop) */}
        <aside className="relative hidden lg:flex lg:w-1/2 flex-col items-start justify-center p-12 text-white bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500">
          <div className="max-w-md space-y-8">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <div className="grid place-items-center rounded-xl bg-white/15 p-3">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Todo ABAC</p>
                <p className="text-xs opacity-90">Secure workflows</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
                Create your account for role-aware todo access.
              </h1>
              <p className="text-lg opacity-90">
                New accounts start as <b>User</b>. Manager/Admin roles are assigned by the system owner.
              </p>
            </div>
          </div>

          {/* Decorative icon */}
          <div className="absolute bottom-8 right-8 opacity-15">
            <ShieldCheck className="h-44 w-44" />
          </div>
        </aside>

        {/* Branding header (mobile/tablet) */}
        <div className="lg:hidden w-full bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center rounded-xl bg-white/15 p-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold leading-none">Todo ABAC</p>
                <p className="text-xs opacity-90">Secure workflows</p>
              </div>
            </div>
          </div>

          <div className="mt-4 max-w-md">
            <h1 className="text-2xl font-bold leading-tight">Create your account for role-aware todo access.</h1>
            <p className="mt-1 text-sm opacity-90">New accounts default to User role.</p>
          </div>
        </div>

        {/* Auth card */}
        <main className="flex flex-1 items-center justify-center p-6 sm:p-12 lg:p-24">
          <Card
            className="
              w-full max-w-[480px]
              border border-blue-200/70 dark:border-blue-900/70
              shadow-xl shadow-blue-500/10
            "
          >
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-bold tracking-tight">Sign Up</CardTitle>
              <p className="text-sm text-muted-foreground">Enter your details to get started.</p>
            </CardHeader>

            <CardContent className="space-y-6">
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!canSubmit || signUp.isPending) return;
                  signUp.mutate();
                }}
              >
                {/* Name */}
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label>Password</Label>

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="pr-12"
                    />

                    {/* Show/Hide password toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters.</p>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="
                    w-full h-12 text-base font-bold
                    bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500
                    text-white hover:opacity-90 disabled:opacity-60
                  "
                  disabled={!canSubmit || signUp.isPending}
                >
                  {signUp.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>

                {/* Error */}
                {signUp.isError && <p className="text-sm text-red-600">{String(signUp.error.message)}</p>}
              </form>

              {/* Sign in link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?
                  <Link href="/sign-in" className="ml-1 font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Footer note */}
              <div className="pt-5 border-t flex items-center justify-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <p className="text-xs font-medium uppercase tracking-wider">Access is role-based inside the app</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
