"use client";

import { useId, useState } from "react";
import { btn } from "@/components/ui/button";
import type { ProfileForm as ProfileValue, Sex } from "@/lib/chat/types";

const field =
  "min-h-tap w-full rounded-md border-2 border-brand-700 bg-surface-raised px-4 text-body text-ink";

/* S0b profile: name optional, birthdate + sex required.
   `onSubmit` throws if the flow rejects the value (e.g. a future date). */
export default function ProfileForm({ onSubmit }: { onSubmit: (v: ProfileValue) => void }) {
  const id = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthdate || !sex) {
      setError("กรุณากรอกวันเกิดและเลือกเพศค่ะ");
      return;
    }
    try {
      onSubmit({
        birthdate,
        sex,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
    } catch {
      setError("วันเกิดไม่ถูกต้อง กรุณาตรวจอีกครั้งค่ะ");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-first`} className="text-label">
          ชื่อ (ไม่บังคับ)
        </label>
        <input id={`${id}-first`} className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-last`} className="text-label">
          นามสกุล (ไม่บังคับ)
        </label>
        <input id={`${id}-last`} className={field} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
        <p className="text-caption text-ink-muted">กรอกตามบัตรประชาชน</p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-birth`} className="text-label">
          วันเกิด
        </label>
        <input
          id={`${id}-birth`}
          type="date"
          className={field}
          value={birthdate}
          max={today}
          onChange={(e) => setBirthdate(e.target.value)}
          autoComplete="bday"
        />
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-label">เพศ</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sex === s}
              onClick={() => setSex(s)}
              className={sex === s ? btn.primary : btn.secondary}
            >
              {s === "male" ? "ชาย" : "หญิง"}
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-label">
          {error}
        </p>
      )}
      <button type="submit" className={btn.primary}>
        ยืนยัน
      </button>
    </form>
  );
}
