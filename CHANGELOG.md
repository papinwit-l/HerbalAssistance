# Changelog

## 1.0.0-beta.1 — 2026-10-18

First beta: the full chat works end to end on real, checked data.

### Chat (น้องขมิ้น)
- Guided chat S0–S11: who it's for, age group, pregnancy / breastfeeding, conditions
  (incl. asthma, allergies), regular medicines, symptom grid, danger signs, duration,
  per-group follow-up questions.
- Red-flag screen (call 1669) and "see a doctor" screen; children under 12 are sent to a
  doctor or pharmacist.
- Persona art: happy / waving / concerned / holding turmeric.

### Recommendations
- Rule engine (no AI): matches symptom group, route and skin type, then removes every herb
  with a contraindication or caution that applies, and says why.
- Herb card: indication, dose from the national list, "follow the label", tablet counter
  (pick the strength on the box → "ครั้งละ 4–7 เม็ด"), cautions, side effects, when to see
  a doctor, shop vs hospital-only (รพ.), source page.
- Small burns: first aid instead of a herb (first-aid text still needs a source).

### Data
- 31 herbs from บัญชียาหลักแห่งชาติด้านสมุนไพร พ.ศ. 2566 + ฉบับที่ 2 พ.ศ. 2568, basic list
  only, each checked field by field against the cited page (AI check — team spot-check pending).
- MySQL (`simp_thaiherbalcare`, shared with the PHP app) is the one place herbs are edited.
  The chat page reads them at runtime from the PHP `api/herbs_export.php` (cached 5 min);
  bad herbs are dropped and logged, and the bundled `src/data/herbs.json` is the fallback.

### Not in this beta
- LINE login / saved profile, R4 "show to doctor" screen, about/privacy content.
- Fever, nausea, mouth ulcer and allergic-rhinitis groups (data ready, chat not yet).
- Herb photos.
