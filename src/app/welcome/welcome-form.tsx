"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Checkbox, FIELD, FormError, LABEL, SubmitButton } from "@/components/form";
import { LEGAL_DOCS } from "@/lib/legal";
import { completeWelcome } from "./actions";

type Props = {
  next: string;
  zones: { id: number; name: string }[];
  defaultName: string;
  needsEmail: boolean;
};

export function WelcomeForm({ next, zones, defaultName, needsEmail }: Props) {
  const [state, action] = useActionState(completeWelcome, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-2">
        <span className={LABEL}>Как вас называть</span>
        <input name="displayName" required maxLength={40} defaultValue={defaultName} className={FIELD} />
        <span className="text-[13px] text-ink-soft">Это имя увидят соседи. Можно только имя.</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className={LABEL}>Где вы живёте</span>
        <select name="zoneId" required defaultValue="" className={FIELD}>
          <option value="" disabled>
            Выберите ЖК или микрорайон
          </option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
        <span className="text-[13px] text-ink-soft">Без адреса: только чтобы соседи понимали, далеко ли идти.</span>
      </label>

      {needsEmail && (
        <label className="flex flex-col gap-2">
          <span className={LABEL}>Почта</span>
          <input name="email" type="email" required className={FIELD} />
          <span className="text-[13px] text-ink-soft">Сюда придут письма о книгах. Её никто не увидит.</span>
        </label>
      )}

      <label className="flex flex-col gap-2">
        <span className={LABEL}>Как с вами связаться — по желанию</span>
        <input
          name="contact"
          maxLength={100}
          placeholder="Телефон или ник в мессенджере"
          className={FIELD}
        />
        <span className="text-[13px] text-ink-soft">
          Никто его не видит. Покажем только соседу, с которым вы договоритесь о книге.
        </span>
      </label>

      <div className="flex flex-col gap-1">
        <Checkbox name="adult" required>
          Мне есть 18 лет
        </Checkbox>
        <Checkbox name="consent" required>
          Даю согласие на{" "}
          <Link href={LEGAL_DOCS.consent.href} target="_blank" className="underline underline-offset-2">
            обработку персональных данных
          </Link>
        </Checkbox>
        <Checkbox name="rules" required>
          Принимаю{" "}
          <Link href={LEGAL_DOCS.rules.href} target="_blank" className="underline underline-offset-2">
            правила сервиса
          </Link>
        </Checkbox>
      </div>

      <FormError message={state?.error} />
      <SubmitButton pending="Сохраняем…">Готово</SubmitButton>
    </form>
  );
}
