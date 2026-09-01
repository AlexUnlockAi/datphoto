import { LoginForm } from "@/components/app/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="DatPhotography" className="h-20 w-auto" />
          <p className="mt-2 text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Command Center
          </p>
        </div>

        <div className="mt-8 border border-border bg-card p-7 shadow-lg">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
