"use client";

import { useState } from "react";
import { Button } from "./ui";

/** «Поделиться»: системное меню телефона, а на компьютере — копирование ссылки. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Участник закрыл меню — ничего не делаем.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Button type="button" variant="ghost" className="min-h-11 px-0 text-[15px] font-medium" onClick={share}>
      {copied ? "Ссылка скопирована" : "Поделиться"}
    </Button>
  );
}
