import type { Metadata } from "next";

export const metadata: Metadata = { title: "เกี่ยวกับ" };

export default function AboutPage() {
  return (
    <>
      <h1 className="text-title">เกี่ยวกับผู้ช่วยสมุนไพร</h1>
      <p className="text-body">[เนื้อหา — ดูแบบ /about ใน canvas]</p>
    </>
  );
}
