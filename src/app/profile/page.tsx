import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";
import { requireMember } from "@/server/session";
import { getOwnProfile } from "@/server/users";
import { getActiveZones } from "@/server/zones";
import { logout } from "./actions";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Профиль", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireMember("/profile");
  const [profile, zones] = await Promise.all([getOwnProfile(user.id), getActiveZones()]);
  if (!profile) return null;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <Link href="/shelf" className="inline-flex min-h-11 items-center text-[15px] text-ink-soft">
        ← Моя полка
      </Link>
      <h1 className="font-display text-[28px] leading-tight font-semibold">Профиль</h1>

      <ProfileForm
        displayName={profile.displayName ?? ""}
        zoneId={profile.zoneId ?? zones[0]?.id}
        contact={profile.contact ?? ""}
        zones={zones}
      />

      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
        <p className="text-ink-soft">Почта для писем</p>
        <p className="font-medium break-all">{profile.email}</p>
        <p className="mt-1 text-[13px] text-ink-soft">Её никто не видит.</p>
      </div>

      {user.role === "admin" && (
        <Link href="/admin" className="inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-2">
          Админка
        </Link>
      )}

      <form action={logout}>
        <Button type="submit" variant="secondary" className="w-full">
          Выйти
        </Button>
      </form>

      <Link href="/profile/delete" className="inline-flex min-h-11 items-center text-[15px] text-ink-soft underline underline-offset-2">
        Удалить аккаунт
      </Link>
    </div>
  );
}
