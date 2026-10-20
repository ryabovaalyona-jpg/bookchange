"use client";

import { useActionState } from "react";
import { FIELD, FormError, LABEL, SubmitButton } from "@/components/form";
import { saveProfile } from "./actions";

type Props = {
  displayName: string;
  zoneId: number;
  contact: string;
  zones: { id: number; name: string }[];
};

export function ProfileForm({ displayName, zoneId, contact, zones }: Props) {
  const [state, action] = useActionState(saveProfile, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className={LABEL}>Имя</span>
        <input name="displayName" required maxLength={40} defaultValue={displayName} className={FIELD} />
      </label>
      <label className="flex flex-col gap-2">
        <span className={LABEL}>Где вы живёте</span>
        <select name="zoneId" defaultValue={zoneId} className={FIELD}>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className={LABEL}>Как с вами связаться</span>
        <input
          name="contact"
          maxLength={100}
          defaultValue={contact}
          placeholder="Телефон или ник в мессенджере"
          className={FIELD}
        />
        <span className="text-[13px] text-ink-soft">
          Покажем только соседу, с которым вы договоритесь о книге.
        </span>
      </label>
      <FormError message={state?.error} />
      {state?.saved && (
        <p role="status" className="font-medium">
          Сохранено.
        </p>
      )}
      <SubmitButton pending="Сохраняем…">Сохранить</SubmitButton>
    </form>
  );
}
