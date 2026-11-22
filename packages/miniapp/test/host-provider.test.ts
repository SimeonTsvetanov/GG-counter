// Unit tests of the React side of the host seam (src/providers/host-provider.tsx): the provider gives
// the host and its overlay container to the subtree, the language hook reads the host's signal, and
// using the host outside a provider is a bug that throws. Rendered to a string (no DOM needed).
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { usePortalContainer } from "../src/components/ui/portal-container.ts";
import type { Host } from "../src/host.ts";
import { HostProvider, useHost, useHostLanguage } from "../src/providers/host-provider.tsx";

/** A host whose elements are plain markers; only identity matters here. */
function fakeHost(): Host {
  // because the provider never touches the elements, only passes them on
  const element = (name: string) => ({ name }) as unknown as HTMLElement;
  return {
    language: { get: () => "bg", subscribe: () => () => undefined },
    theme: { get: () => "dark", subscribe: () => () => undefined },
    toast: () => undefined,
    share: () => Promise.resolve("shared"),
    setTitle: () => undefined,
    setBusy: () => undefined,
    notifySaved: () => undefined,
    headerActions: element("header"),
    portalContainer: element("overlays"),
    root: element("root"),
  };
}

/** Renders `probe` inside a provider of `host` and returns what it saw. */
function renderWith<T>(host: Host | null, probe: () => T): T {
  let seen: T | undefined;
  function Probe(): ReactNode {
    seen = probe();
    return null;
  }
  const tree = createElement(Probe);
  renderToStaticMarkup(host === null ? tree : createElement(HostProvider, { host, children: tree }));
  // because Probe always runs once during the render above
  return seen as T;
}

describe("HostProvider", () => {
  it("gives the subtree the host and its overlay container", () => {
    const host = fakeHost();
    expect(renderWith(host, useHost)).toBe(host);
    expect(renderWith(host, usePortalContainer)).toBe(host.portalContainer);
  });

  it("renders the host's language through useHostLanguage", () => {
    expect(renderWith(fakeHost(), useHostLanguage)).toBe("bg");
  });

  it("renders its children", () => {
    const markup = renderToStaticMarkup(createElement(HostProvider, { host: fakeHost(), children: createElement("p", null, "body") }));
    expect(markup).toBe("<p>body</p>");
  });
});

describe("outside a provider", () => {
  it("useHost throws and overlays keep Radix's default container", () => {
    expect(() => renderWith(null, useHost)).toThrow("useHost must be used within HostProvider");
    expect(renderWith(null, usePortalContainer)).toBeUndefined();
  });
});
