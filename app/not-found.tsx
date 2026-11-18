import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 font-display text-5xl font-bold">Off the trail</h1>
        <p className="mt-3" style={{ color: "var(--muted)" }}>
          We couldn&apos;t find that page.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Back to base
        </Link>
      </div>
    </div>
  );
}
