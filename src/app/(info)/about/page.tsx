import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "เกี่ยวกับ" };

export default function AboutPage() {
  return (
    <>
      <Image
        src="/persona/full.webp"
        width={300}
        height={962}
        alt="น้องขมิ้น ผู้ช่วยแนะนำสมุนไพร ถือขมิ้นชันในมือ"
        className="mx-auto h-60 w-auto"
        priority
      />
      <h1 className="text-title">เกี่ยวกับผู้ช่วยสมุนไพร</h1>
      <p className="text-body">[เนื้อหา — ดูแบบ /about ใน canvas]</p>
    </>
  );
}
