import { noteText } from "@/lib/chat/flow";
import { symptomLabel } from "@/lib/chat/steps";
import type { Facts, NoteCode } from "@/lib/chat/types";
import { PersonaBubbles } from "./Bubbles";

/* S11 placeholder until lib/engine exists: shows what the engine will receive
   and the notes the flow collected. Herb cards replace the dashed box. */
export default function ResultPreview({ facts, notes }: { facts: Facts; notes: NoteCode[] }) {
  return (
    <div className="flex flex-col gap-3">
      <PersonaBubbles
        bubbles={[`ได้ข้อมูลครบแล้วค่ะ อาการ${symptomLabel(facts.selectedSymptom)} หนูกำลังหาสมุนไพรที่ปลอดภัยให้นะคะ`]}
      />

      <div className="rounded-md border-2 border-dashed border-border bg-surface-raised p-4 text-body text-ink-muted">
        [การ์ดสมุนไพรจะแสดงที่นี่ — รอ rule engine]
      </div>

      {notes.length > 0 && (
        <ul className="flex flex-col gap-2 rounded-md bg-turmeric-100 p-4 text-body">
          {notes.map((n) => (
            <li key={n}>{noteText(n)}</li>
          ))}
        </ul>
      )}

      {process.env.NODE_ENV !== "production" && (
        <details className="rounded-md border border-border bg-surface-raised p-3 text-caption">
          <summary className="cursor-pointer">dev: facts ที่ส่งให้ engine</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(facts, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
