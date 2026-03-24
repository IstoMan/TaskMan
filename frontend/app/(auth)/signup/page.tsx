"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/lib/users";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const failWithError = (message: string) => {
    setError(message);
  };

  const handleSignup = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData) as Record<string, string>;
    if (!data.role) {
      failWithError("Please select a role");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
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
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your name and email below to sign up
        </CardDescription>
        <CardAction>
          <Button variant="link" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form
          id="signup-form"
          onSubmit={handleSignup}
          aria-busy={isLoading}
        >
          {error ? (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Your name" required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="········"
                required
                disabled={isLoading}
              />
            </div>
            <input type="hidden" name="role" value={role} />
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={setRole}
                disabled={isLoading}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.MEMBER}>Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          type="submit"
          form="signup-form"
          variant={error ? "destructive" : "default"}
          className="w-full gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <UserPlus aria-hidden />
          )}
          {isLoading ? "Creating account…" : "Sign up"}
        </Button>
      </CardFooter>
    </Card>
  );
}
