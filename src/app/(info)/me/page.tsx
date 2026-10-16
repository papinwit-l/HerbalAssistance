import type { Metadata } from "next";

export const metadata: Metadata = { title: "ข้อมูลของฉัน" };

export default function MePage() {
  return (
    <>
      <h1 className="text-title">ข้อมูลของฉัน</h1>
      <p className="text-body">[mockup — ดูแบบ /me ใน canvas]</p>
    </>
  );
}
