"use client";

import { useActionState } from "react";
import { wantBooks } from "@/app/books/actions";
import { SubmitButton } from "./form";

export function WantButton({ bookId, label, back }: { bookId: number; label: string; back: string }) {
  const [state, action] = useActionState(wantBooks, undefined);
  if (state?.message) {
    return (
      <p role="status" className="py-3 text-center font-medium">
        {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="back" value={back} />
      {state?.error && (
        <p role="alert" className="text-center text-[15px]">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pending="Записываем…">
        {label}
      </SubmitButton>
    </form>
  );
}
