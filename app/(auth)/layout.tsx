import { Logo } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <div
        className="relative hidden flex-col justify-end overflow-hidden p-12 text-white lg:flex"
        style={{ background: "linear-gradient(160deg, var(--navy), #2b3a67 60%, var(--brand))" }}
      >
        <svg viewBox="0 0 400 300" className="absolute inset-x-0 top-16 w-full opacity-30" aria-hidden="true">
          <polygon points="0,300 120,120 170,170 250,40 330,160 400,110 400,300" fill="#fff" />
        </svg>
        <blockquote className="relative max-w-md">
          <Icon name="sparkle" size={28} />
          <p className="mt-4 font-display text-3xl font-bold leading-tight">
            “Small steps every day beat big plans once a month.”
          </p>
          <p className="mt-4 opacity-80">Twenty focused minutes a day is enough to change your band. We&apos;ll show you exactly what to do with them.</p>
        </blockquote>
      </div>
    </div>
  );
}
