import { useRef } from "react"
import type { FormEvent } from "react"
import { cn } from "cn"
import { FlaskConical, Info, UserRound } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AuthMode = "login" | "signup" | "forgot" | "reset"
type AuthPayload = { email?: string; password?: string; name?: string }
type LoginFormProps = {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onSubmit: (payload: AuthPayload) => Promise<void>
  onDemo: () => void
  onGuest: () => void
  configured: boolean
  busy: boolean
  error: string
  notice: string
  className?: string
}

// Adapted from shadcn/ui login-03. Its Card/Field layout is retained.
export function LoginForm({ mode, onModeChange, onSubmit, onDemo, onGuest, configured, busy, error, notice, className }: LoginFormProps) {
  const pending = useRef(false)
  const copy = {
    login: { title: "Good to see you", description: "Pick up where you left off with your skills and saved roles.", action: "Log in" },
    signup: { title: "Let’s get you started", description: "Save your skills and the opportunities you want to come back to.", action: "Sign up" },
    forgot: { title: "Reset your password", description: "Request a recovery link, then open it in this browser.", action: "Send recovery link" },
    reset: { title: "Choose a new password", description: "A verified account session is required to update your password.", action: "Update password" },
  }[mode]

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || busy || !configured) return
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const data = new FormData(form)
    const payload: AuthPayload = {}
    if (mode !== "reset") payload.email = String(data.get("email") || "").trim()
    if (mode !== "forgot") payload.password = String(data.get("password") || "")
    if (mode === "signup") payload.name = String(data.get("name") || "").trim()
    pending.current = true
    try { await onSubmit(payload) } finally { pending.current = false }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form key={mode} onSubmit={submit} aria-busy={busy}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" onClick={onDemo} disabled={busy}><FlaskConical aria-hidden="true" />Try demo account</Button>
                <Button variant="outline" type="button" onClick={onGuest} disabled={busy}><UserRound aria-hidden="true" />Continue as guest</Button>
                <FieldDescription className="text-center">Take a look around first. The demo uses fictional examples; guest browsing includes real roles.</FieldDescription>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or use your account</FieldSeparator>
              {!configured && <Alert><Info aria-hidden="true" /><AlertTitle>Account services need setup</AlertTitle><AlertDescription>Email signup, login, and recovery are unavailable until Supabase is configured. The demo and guest modes work now.</AlertDescription></Alert>}
              {mode === "signup" && <Field><FieldLabel htmlFor="auth-name">Name</FieldLabel><Input id="auth-name" name="name" autoComplete="name" maxLength={80} required disabled={busy} /></Field>}
              {mode !== "reset" && <Field><FieldLabel htmlFor="auth-email">Email</FieldLabel><Input id="auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required disabled={busy} /></Field>}
              {mode !== "forgot" && <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="auth-password">{mode === "reset" ? "New password" : "Password"}</FieldLabel>
                  {mode === "login" && <Button variant="link" type="button" className="ml-auto" onClick={() => onModeChange("forgot")} disabled={busy}>Forgot password?</Button>}
                </div>
                <Input id="auth-password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 12} maxLength={128} required disabled={busy} />
                {(mode === "signup" || mode === "reset") && <FieldDescription>Use 12–128 characters. Supabase manages password hashing.</FieldDescription>}
              </Field>}
              {mode === "signup" && <Alert><Info aria-hidden="true" /><AlertTitle>What your account stores</AlertTitle><AlertDescription>Supabase stores your name, email, dates, skills, preferences, saved roles, notes, and search or AI-review history you choose to retain. You and authorized project operators can access your account data; other users cannot. Public job feeds receive country and role-type filters, not your name, email or skill profile. You choose any text shared with ChatGPT. Download or delete your data in Settings. No advertising or analytics tracking; fonts are local.</AlertDescription></Alert>}
              {error && <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>}
              {notice && <Alert role="status"><AlertDescription>{notice}</AlertDescription></Alert>}
              <Field>
                <Button type="submit" disabled={busy || !configured}>{busy ? "Please wait…" : copy.action}</Button>
                <FieldDescription className="text-center">
                  {mode === "login" ? <>Don&apos;t have an account? <Button variant="link" type="button" onClick={() => onModeChange("signup")} disabled={busy}>Sign up</Button></> : <Button variant="link" type="button" onClick={() => onModeChange("login")} disabled={busy}>Back to login</Button>}
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">For students figuring out their next step. You’re welcome to browse as a guest.</FieldDescription>
    </div>
  )
}
