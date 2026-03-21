import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function SignUp() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 dark:bg-zinc-950 px">
      <div className="w-full max-w-sm mx-auto">
        <Form />
      </div>
    </main>
  )
}


function Form() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign Up</h1>
        <p className="text-sm text-muted-foreground font-medium">
          Enter your name, email and password to sign up
        </p>
      </div>

      <form action="#" className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" placeholder="Your Name" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" placeholder="...." required />
          </Field>

          <div className="flex flex-col space-y-2 pt-4">
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
