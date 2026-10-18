import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ความเป็นส่วนตัว" };

/* Plain-language PDPA notice. Written for what the app really does today
   (beta: answers stay in the browser, nothing is saved). Before LINE login
   starts saving data, update the "เข้าสู่ระบบด้วย LINE" section and the date. */
const UPDATED = "18 ตุลาคม 2569";
// Server-only, read at build time. Empty = the contact section names the team only.
const CONTACT = process.env.PRIVACY_CONTACT?.trim() ?? "";

const ASKED = [
  "ถามให้ตัวเองหรือคนอื่น",
  "ช่วงอายุ และเพศ",
  "ตั้งครรภ์หรือให้นมบุตรหรือไม่",
  "โรคประจำตัว และยาที่กินอยู่",
  "อาการที่เป็น อาการอันตราย และเป็นมานานเท่าไร",
];

const RIGHTS = [
  "ขอดู หรือขอสำเนาข้อมูลของคุณ",
  "ขอแก้ไขข้อมูลที่ไม่ถูกต้อง",
  "ขอลบข้อมูล หรือขอให้หยุดใช้ข้อมูล",
  "ถอนความยินยอมเมื่อไหร่ก็ได้ โดยไม่เสียสิทธิ์ใช้แบบไม่บันทึก",
  "ร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-heading">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-6 text-body">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-title">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-caption text-ink-muted">ปรับปรุงล่าสุด {UPDATED} · รุ่นทดลอง (เบต้า)</p>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-brand-100 p-4">
        <h2 className="text-heading">สรุปสั้น ๆ</h2>
        <ul className="flex list-disc flex-col gap-1 pl-6 text-body">
          <li>
            <strong>ตอนนี้แอปไม่บันทึกข้อมูลของคุณ</strong> คำตอบอยู่ในเครื่องของคุณเท่านั้น
            ปิดหน้าหรือกด &ldquo;เริ่มใหม่&rdquo; แล้วหายทันที
          </li>
          <li>ไม่ต้องสมัคร ไม่ขอชื่อจริง เลขบัตรประชาชน หรือเบอร์โทร</li>
          <li>ไม่ขาย ไม่แชร์ และไม่ใช้ข้อมูลเพื่อโฆษณา</li>
        </ul>
      </div>

      <Section title="น้องขมิ้นถามอะไรบ้าง">
        <List items={ASKED} />
        <p className="text-body">
          ข้อมูลสุขภาพเป็นข้อมูลอ่อนไหวตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) จึงถามเท่าที่จำเป็นต่อความปลอดภัยเท่านั้น
          ไม่อยากตอบข้อไหน ปิดหน้าได้ทุกเมื่อ
        </p>
      </Section>

      <Section title="ใช้ข้อมูลทำอะไร">
        <p className="text-body">
          ใช้คัดยาสมุนไพรในบัญชียาหลักแห่งชาติที่ปลอดภัยกับคุณ ตัดยาที่ไม่เหมาะ และเตือนเมื่อมีอาการที่ควรไปพบแพทย์
          ไม่ใช้ทำอย่างอื่น
        </p>
      </Section>

      <Section title="ข้อมูลอยู่ที่ไหน เก็บนานเท่าไร">
        <p className="text-body">
          การคัดยาทำในเบราว์เซอร์บนเครื่องของคุณ คำตอบไม่ถูกส่งไปที่เซิร์ฟเวอร์ของเรา
          และไม่ถูกเก็บไว้หลังปิดหน้า แอปไม่ใช้คุกกี้ติดตามและไม่มีเครื่องมือวัดสถิติผู้ใช้
        </p>
        <p className="text-body">
          เหมือนเว็บไซต์ทั่วไป ผู้ให้บริการเซิร์ฟเวอร์อาจบันทึกข้อมูลทางเทคนิค เช่น หมายเลข IP เวลาที่เข้า และชนิดเบราว์เซอร์
          ไว้ช่วงสั้น ๆ เพื่อดูแลความปลอดภัยของระบบ ข้อมูลนี้ไม่มีคำตอบเรื่องสุขภาพของคุณ
        </p>
      </Section>

      <Section title="ปุ่ม “เข้าสู่ระบบด้วย LINE”">
        <p className="text-body">
          ในรุ่นทดลองนี้ ปุ่มนี้และหน้าขอความยินยอมเป็นตัวอย่างเท่านั้น <strong>ยังไม่มีการบันทึกข้อมูลจริง</strong>
          แม้กด &ldquo;ยินยอม&rdquo; แล้วก็ตาม
        </p>
        <p className="text-body">
          เมื่อเปิดใช้จริง แอปจะขอความยินยอมก่อนทุกครั้ง จะเก็บเฉพาะรหัสผู้ใช้ LINE ชื่อ (ไม่บังคับ) วันเกิด เพศ
          โรคประจำตัว ยาที่กิน และประวัติคำแนะนำ เพื่อไม่ต้องถามซ้ำครั้งหน้า คุณดู ดาวน์โหลด หรือลบได้ที่หน้า
          &ldquo;ข้อมูลของฉัน&rdquo; และเราจะแก้นโยบายนี้ก่อนเริ่มเก็บ
        </p>
      </Section>

      <Section title="ส่งข้อมูลให้ใครบ้าง">
        <p className="text-body">
          ไม่ส่งให้ใคร ถ้าคุณใช้น้องขมิ้นผ่านแท็บในเว็บไซต์อื่น (เช่น ห้องยาไทย) คำตอบในแท็บนี้ไม่ถูกส่งให้เว็บไซต์นั้น
          ส่วนข้อมูลที่คุณกรอกในเว็บไซต์นั้นเป็นไปตามนโยบายของเว็บไซต์นั้นเอง
        </p>
        <p className="text-body">
          ถ้าคุณกด &ldquo;แสดงให้เภสัชกรดู&rdquo; สรุปจะขึ้นบนหน้าจอของคุณเท่านั้น คุณเลือกเองว่าจะให้ใครดู
        </p>
      </Section>

      <Section title="สิทธิ์ของคุณ">
        <List items={RIGHTS} />
        <p className="text-body">
          ตอนนี้เราไม่มีข้อมูลของคุณเก็บไว้ จึงไม่มีอะไรให้ขอดูหรือขอลบ ถ้ามีคำถามติดต่อทีมได้ตามด้านล่าง
        </p>
      </Section>

      <Section title="ติดต่อเรา">
        <p className="text-body">
          ทีมผู้พัฒนาผู้ช่วยสมุนไพร{CONTACT ? <> · {CONTACT}</> : null}
        </p>
        <p className="text-body">
          ร้องเรียนเรื่องข้อมูลส่วนบุคคล:{" "}
          <a
            href="https://www.pdpc.or.th"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 underline"
          >
            สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล
          </a>
        </p>
      </Section>

      <Section title="การเปลี่ยนแปลงนโยบาย">
        <p className="text-body">
          ถ้าเปลี่ยนวิธีใช้ข้อมูล เราจะแก้หน้านี้และวันที่ด้านบน ถ้าเป็นเรื่องสำคัญ เช่น เริ่มบันทึกข้อมูล จะขอความยินยอมใหม่ก่อน
        </p>
      </Section>

      <Link href="/" className="text-label text-brand-700 underline">
        กลับไปคุยกับน้องขมิ้น
      </Link>
    </>
  );
}
