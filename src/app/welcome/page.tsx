import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/server/session";
import { getOwnProfile } from "@/server/users";
import { getActiveZones } from "@/server/zones";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Знакомство", robots: { index: false } };

export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const next = safeNext((await searchParams).next);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (user.onboarded) redirect(next);

  const [profile, zones] = await Promise.all([getOwnProfile(user.id), getActiveZones()]);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 py-2">
      <div>
        <h1 className="font-display text-[32px] leading-[1.1] font-semibold">Давайте познакомимся</h1>
        <p className="mt-2 text-ink-soft">Один раз — и можно выкладывать книги.</p>
      </div>
      {zones.length === 0 ? (
        <p className="text-ink-soft">Список районов ещё не готов. Загляните чуть позже.</p>
      ) : (
        <WelcomeForm
          next={next}
          zones={zones}
          defaultName={profile?.displayName ?? ""}
          needsEmail={!profile?.email}
        />
      )}
    </div>
  );
}
