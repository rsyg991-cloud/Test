import { logout } from "@/app/actions/auth";
import { Icon } from "@/components/icons";
import { BottomNav, SideNav } from "@/components/NavLinks";
import { Logo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const vocabDue = await prisma.vocabCard.count({ where: { userId: user.id, due: { lte: new Date() } } });

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside
        className="sticky top-0 hidden h-dvh flex-col gap-8 border-r p-5 lg:flex"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <Logo href="/dashboard" />
        <SideNav vocabDue={vocabDue} />
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl p-4" style={{ background: "var(--surface-2)" }}>
            <div className="text-sm font-bold">{user.name}</div>
            <div className="mt-2 flex items-center gap-4 text-sm" style={{ color: "var(--muted)" }}>
              <span className="inline-flex items-center gap-1">
                <Icon name="flame" size={16} style={{ color: "var(--brand)" }} /> {user.streak}
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="star" size={16} style={{ color: "var(--gold)" }} /> {user.xp.toLocaleString()} XP
              </span>
            </div>
          </div>
          <form action={logout}>
            <button className="flex items-center gap-2 px-3 text-sm font-semibold" style={{ color: "var(--muted)" }}>
              <Icon name="logout" size={16} /> Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur lg:hidden"
          style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}
        >
          <Logo href="/dashboard" small />
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="inline-flex items-center gap-1">
              <Icon name="flame" size={17} style={{ color: "var(--brand)" }} /> {user.streak}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="star" size={17} style={{ color: "var(--gold)" }} /> {user.xp}
            </span>
            <form action={logout}>
              <button aria-label="Log out" className="grid place-items-center p-1" style={{ color: "var(--muted)" }}>
                <Icon name="logout" size={17} />
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
