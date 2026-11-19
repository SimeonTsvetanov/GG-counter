import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH, configProblems } from "./config-check.ts";
import { pageTitle } from "./seo.ts";

const app: AppConfig = config;
const packageVersion = (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string }).version;

describe("app.config.ts", () => {
  it("meets every rule (title ≤ 60, description ≤ 155, 3–5 steps, 5–7 FAQ, version = package.json)", () => {
    expect(configProblems(app, { packageVersion })).toEqual([]);
    expect(pageTitle(app).length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(app.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });

  it("keeps the contract with installed copies (SPEC §4)", () => {
    expect(app.basePath).toBe("/GG-counter/");
    expect(app.url).toBe("https://simeontsvetanov.github.io/GG-counter/");
    expect(app.manifest.id).toBe("gg-counter-pwa-v1");
  });

  it("names the app in the answer and in every FAQ answer (answers are quoted alone)", () => {
    expect(app.answer.startsWith(`${app.name} is `)).toBe(true);
    for (const item of app.faq) expect(item.a).toContain(app.name);
  });
});

describe("configProblems", () => {
  it("reports each broken rule", () => {
    const broken: AppConfig = {
      ...app,
      id: "GG_Counter",
      basePath: "/other/",
      tagline: "x".repeat(60),
      description: "y".repeat(156),
      answer: "A score tracker.",
      steps: ["one"],
      faq: [],
      accent: "blue",
      seo: { ...app.seo, contentUpdated: "19.11.2026" },
    };
    const problems = configProblems(broken, { packageVersion: "9.9.9" });
    for (const fragment of ["kebab-case", "basePath", "package.json", "title has", "description has", "answer does not name", "steps: 1", "faq: 0", "colour \"blue\"", "contentUpdated"]) {
      expect(problems.some((p) => p.includes(fragment)), fragment).toBe(true);
    }
  });
});
