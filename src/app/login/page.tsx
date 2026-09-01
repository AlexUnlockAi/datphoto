import { LoginForm } from "@/components/app/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="font-heading text-3xl tracking-wider text-foreground">
            Dat<span className="text-primary">Photography</span>
          </span>
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
