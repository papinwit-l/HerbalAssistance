import { describe, expect, it } from "vitest";
import raw from "@/data/herbs.json";
import { HERBS } from "@/lib/engine/herbs";
import { loadHerbsFrom } from "@/lib/engine/herbSource";

const URL_ = "https://php.example/api/herbs_export.php";
const reply = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
const clone = () => JSON.parse(JSON.stringify(raw));

describe("loadHerbsFrom — MySQL via the PHP export, bundled herbs.json as fallback", () => {
  it("uses the API when the payload is good", async () => {
    const r = await loadHerbsFrom({ url: URL_, fetchImpl: reply(raw) });
    expect(r.source).toBe("api");
    expect(r.herbs.map((h) => h.id)).toEqual(HERBS.map((h) => h.id));
    expect(r.problems).toEqual([]);
  });

  it("sends the token as ?token=", async () => {
    let seen = "";
    const f = (async (u: URL) => {
      seen = String(u);
      return new Response(JSON.stringify(raw));
    }) as unknown as typeof fetch;
    await loadHerbsFrom({ url: URL_, token: "abc", fetchImpl: f });
    expect(seen).toBe(`${URL_}?token=abc`);
  });

  it("drops only the herb with a code the app doesn't know", async () => {
    const body = clone();
    body.herbs[0].symptoms = ["typo_group"];
    body.herbs[1].caution_if.flags.push("not_a_flag");
    const r = await loadHerbsFrom({ url: URL_, fetchImpl: reply(body) });
    expect(r.source).toBe("api");
    expect(r.herbs).toHaveLength(HERBS.length - 2);
    expect(r.problems).toEqual([
      'fah-talai-jone: unknown symptom "typo_group"',
      'fah-talai-jone-diarrhea: unknown flag "not_a_flag"',
    ]);
  });

  it("drops a herb that isn't verified or has no page number", async () => {
    const body = clone();
    body.herbs[0].status = "draft";
    delete body.herbs[1].sources[0].page;
    const r = await loadHerbsFrom({ url: URL_, fetchImpl: reply(body) });
    expect(r.herbs).toHaveLength(HERBS.length - 2);
  });

  it("falls back to the bundled file on HTTP errors, bad JSON shape, network errors or no URL", async () => {
    expect((await loadHerbsFrom({ url: URL_, fetchImpl: reply({ error: "x" }, 403) })).problems).toEqual([
      "HTTP 403",
    ]);
    expect((await loadHerbsFrom({ url: URL_, fetchImpl: reply({ nope: 1 }) })).source).toBe("bundled");
    const down = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    const r = await loadHerbsFrom({ url: URL_, fetchImpl: down });
    expect(r).toEqual({ herbs: HERBS, source: "bundled", problems: ["fetch failed: ECONNREFUSED"] });
    expect((await loadHerbsFrom({})).source).toBe("bundled");
  });
});
