import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTest, toClientTest } from "@/lib/mock/registry";
import { MockTestFlow } from "./MockTestFlow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.mock") };
}

export default async function MockTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ timeScale?: string }>;
}) {
  const [{ id }, { timeScale }] = await Promise.all([params, searchParams]);
  const test = getTest(id);
  if (!test) notFound();
  const user = await requireUser();
  // timeScale < 1 shortens timers for automated testing; it can never give extra time.
  const scale = Math.min(1, Math.max(0.001, Number(timeScale) || 1));
  return <MockTestFlow test={toClientTest(test)} storageKey={`bandup:mock:${user.id}:${test.id}`} timeScale={scale} />;
}
