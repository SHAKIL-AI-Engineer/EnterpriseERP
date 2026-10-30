"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [pendingTwoFactorToken, setPendingTwoFactorToken] = React.useState<string | null>(null)
  const [twoFactorCode, setTwoFactorCode] = React.useState("")
  const { login, completeTwoFactorLogin } = useAuth()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      if (pendingTwoFactorToken) {
        const response = await completeTwoFactorLogin(pendingTwoFactorToken, twoFactorCode)
        if (response.success) {
          toast.success("Welcome back!", {
            description: response.message || "You have successfully logged in.",
          })
          setIsLoading(false)
        } else {
          toast.error("Verification failed", {
            description: response.message || "Invalid two-factor code.",
          })
          setIsLoading(false)
        }
        return
      }

      const response = await login(data)
      if (response.success) {
        toast.success("Welcome back!", {
          description: response.message || "You have successfully logged in.",
        })
        setIsLoading(false)
      } else if (response.requiresTwoFactor && response.pendingTwoFactorToken) {
        setPendingTwoFactorToken(response.pendingTwoFactorToken)
        toast.message("Two-factor code required", {
          description: "Enter the code from your authenticator app.",
        })
        setIsLoading(false)
      } else {
        const msg = response.message || "Invalid username or password."
        toast.error(msg.includes("company") ? "Cannot sign in" : "Login failed", {
          description: msg,
        })
        setIsLoading(false)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && "response" in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Invalid username or password."
      toast.error("Login failed", {
        description: errorMessage || "Invalid username or password.",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit(onSubmit)(e)
          }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-balance text-sm text-muted-foreground">
              {pendingTwoFactorToken
                ? "Enter your two-factor code to finish signing in"
                : "Enter your credentials below to access your account"}
            </p>
          </div>

          <div className="grid gap-4">
            {pendingTwoFactorToken ? (
              <div className="grid gap-2">
                <FormLabel>Two-factor code</FormLabel>
                <Input
                  inputMode="numeric"
                  placeholder="123456"
                  className="h-10"
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value)}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="johndoe"
                          className="h-10"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          className="h-10"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" size="lg" className="w-full mt-2 py-5" disabled={isLoading}>
              {isLoading ? (
                <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              {isLoading ? "Signing in..." : pendingTwoFactorToken ? "Verify & Login" : "Login"}
            </Button>
            {pendingTwoFactorToken ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading}
                onClick={() => {
                  setPendingTwoFactorToken(null)
                  setTwoFactorCode("")
                }}
              >
                Use different account
              </Button>
            ) : null}
          </div>
        </form>
      </Form>
    </div>
  )
}
