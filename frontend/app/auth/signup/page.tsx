"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
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
  const [role, setRole] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData) as Record<string, string>;
    if (!data.role) {
      throw new Error("Please select a role");
    }
    console.log(data);
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
      console.error(errBody);
      throw new Error(msg);
    }
    const result = await response.json();
    console.log(result);
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
            <Link href="/auth/login">Log in</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form id="signup-form" onSubmit={handleSignup}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Your name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
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
              />
            </div>
            <input type="hidden" name="role" value={role} />
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role || undefined} onValueChange={setRole}>
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
        <Button type="submit" form="signup-form" className="w-full gap-2">
          <UserPlus />
          Sign up
        </Button>
        <Button type="button" variant="outline" className="w-full">
          Sign up with Google
        </Button>
      </CardFooter>
    </Card>
  );
}
