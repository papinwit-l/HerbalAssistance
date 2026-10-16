"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { btn } from "@/components/ui/button";
import RedFlagScreen from "@/components/screens/RedFlagScreen";
import ReferScreen from "@/components/screens/ReferScreen";
import {
  answer,
  current,
  editFrom,
  start,
  transcript,
  type ChatState,
  type FlowContext,
} from "@/lib/chat/flow";
import type { AnswerMap, StepId } from "@/lib/chat/types";
import ChatHeader from "./ChatHeader";
import { PersonaBubbles, UserBubble } from "./Bubbles";
import ResultPreview from "./ResultPreview";
import ConsentForm from "./inputs/ConsentForm";
import MultiChoice from "./inputs/MultiChoice";
import ProfileForm from "./inputs/ProfileForm";
import SingleChoice from "./inputs/SingleChoice";
import SymptomGrid from "./inputs/SymptomGrid";

/* The whole chat on "/". All logic lives in lib/chat/flow.ts; this only renders
   the current View and turns taps into answer() / editFrom() calls. */

// LIFF login isn't wired yet: no saved profile, so [เข้าสู่ระบบด้วย LINE]
// walks the first-login mockup (consent → profile form).
const ctx: FlowContext = {};

export default function Chat() {
  const [state, setState] = useState<ChatState>(start);
  const view = current(state, ctx);
  const history = transcript(state, ctx);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ block: "end", behavior: reduce ? "auto" : "smooth" });
  }, [state]);

  /* Values come from the step's own options; flow.answer validates them again. */
  const submit = (step: StepId, value: unknown) =>
    setState(answer(state, step, value as AnswerMap[StepId], ctx));
  const restart = () => setState(start());
  const undoLast = () => {
    const last = state.entries.at(-1);
    if (last) setState(editFrom(state, last.step));
  };

  const outcome = view.type === "outcome" ? view.outcome : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader progress={view.progress} />

      {/* Messages — the only part that scrolls */}
      <main className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {history.map((turn) => (
          <Fragment key={turn.step}>
            <PersonaBubbles bubbles={turn.bubbles} />
            <UserBubble label={turn.answer} onEdit={() => setState(editFrom(state, turn.step))} />
          </Fragment>
        ))}

        {view.type === "ask" && <PersonaBubbles bubbles={view.bubbles} />}

        {outcome?.kind === "out" && (
          <PersonaBubbles
            bubbles={[
              "เด็กอายุต่ำกว่า 12 ปี ควรให้แพทย์หรือเภสัชกรดูแลการใช้ยานะคะ",
              "ถ้ามีอาการรุนแรง โทร 1669 ได้ทันทีค่ะ",
            ]}
          />
        )}
        {outcome?.kind === "result" && <ResultPreview facts={outcome.facts} notes={outcome.notes} />}

        <div ref={endRef} />
      </main>

      {/* Answer tray. key={step} resets chip / form state for each new question. */}
      <div className="flex max-h-[60%] flex-col gap-2 overflow-y-auto rounded-t-md bg-surface-raised p-4 shadow-card">
        {view.type === "ask" && (
          <Tray key={view.step} step={view.step} input={view.input} onAnswer={submit} />
        )}

        {outcome?.kind === "out" && (
          <button type="button" className={btn.primary} onClick={restart}>
            เริ่มใหม่
          </button>
        )}
        {outcome?.kind === "result" && (
          <>
            {/* [แสดงให้เภสัชกรดู] arrives with R4. */}
            <button type="button" className={btn.secondary} onClick={() => setState(editFrom(state, "symptom"))}>
              ถามอาการอื่น
            </button>
            <button type="button" className={btn.secondary} onClick={restart}>
              เริ่มใหม่
            </button>
          </>
        )}
      </div>

      {outcome?.kind === "redflag" && <RedFlagScreen signs={outcome.signs} onBack={undoLast} />}
      {outcome?.kind === "refer" && (
        <ReferScreen reason={outcome.reason} onBack={undoLast} onRestart={restart} />
      )}
    </div>
  );
}

function Tray({
  step,
  input,
  onAnswer,
}: {
  step: StepId;
  input: Extract<ReturnType<typeof current>, { type: "ask" }>["input"];
  onAnswer: (step: StepId, value: unknown) => void;
}) {
  switch (input.kind) {
    case "single":
      return (
        <SingleChoice
          options={input.options}
          primaryFirst={step === "welcome"}
          onPick={(v) => onAnswer(step, v)}
        />
      );
    case "multi":
      return (
        <MultiChoice
          options={input.options}
          noneLabel={input.noneLabel}
          onSubmit={(v) => onAnswer(step, v)}
        />
      );
    case "symptom":
      // Free text / voice ("พิมพ์หรือพูดอาการเอง") arrives with /api/parse.
      return <SymptomGrid options={input.options} onPick={(code) => onAnswer(step, { code, source: "grid" })} />;
    case "consent":
      return <ConsentForm onPick={(v) => onAnswer(step, v)} />;
    case "profile_form":
      return <ProfileForm onSubmit={(v) => onAnswer(step, v)} />;
  }
}
