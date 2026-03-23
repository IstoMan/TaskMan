"use client";

import Link from "next/link";
import { DoorOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const failWithError = (message: string) => {
    setError(message);
  };
  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData) as Record<string, string>;
    if (!data.email || !data.password) {
      failWithError("Please enter your email and password");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errBody = (await response.json()) as { error?: string; message?: string };
        const msg = errBody.error ?? errBody.message ?? response.statusText;
        failWithError(msg);
        return;
      }
      await response.json();
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      failWithError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction>
          <Button variant="link" asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <form id="login-form" onSubmit={handleLogin} aria-busy={isLoading}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" name="password" type="password" placeholder="············" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" form="login-form" className="w-full gap-2" variant={error ? "destructive" : "default"} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <DoorOpen aria-hidden />
          )}
          {isLoading ? "Logging in…" : "Login"}
        </Button>
        <Button type="button" variant="outline" className="w-full" disabled={isLoading}>
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  );
}
