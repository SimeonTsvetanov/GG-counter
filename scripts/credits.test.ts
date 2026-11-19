import { describe, expect, it } from "vitest";
import { ALLOWED_LICENSES, appCredits } from "./credits.ts";

const appDir = new URL("../app/", import.meta.url);

describe("appCredits", () => {
  it("lists every runtime dependency of the app with its licence and home page, workspace packages left out", () => {
    const credits = appCredits(appDir);
    const names = credits.map((credit) => credit.name);
    expect(names).toContain("react");
    expect(names).toContain("lucide-react");
    expect(names).not.toContain("gg-counter-core");
    expect(names).toEqual([...names].sort());
    for (const credit of credits) {
      expect(credit.url).toMatch(/^https:\/\//);
      expect(ALLOWED_LICENSES).toContain(credit.license);
    }
  });
});
