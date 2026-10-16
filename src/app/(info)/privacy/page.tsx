import type { Metadata } from "next";

export const metadata: Metadata = { title: "ความเป็นส่วนตัว" };

export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-title">นโยบายความเป็นส่วนตัว</h1>
      <p className="text-body">[เนื้อหา — ดูแบบ /privacy ใน canvas]</p>
    </>
  );
}
