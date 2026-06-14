import { env } from "cloudflare:workers";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

function request(path: string): Request {
  return new Request(`https://links.example.com${path}`);
}

async function call(path: string): Promise<{ status: number; location: string | null }> {
  const res = await worker.fetch(request(path), env);
  return { status: res.status, location: res.headers.get("Location") };
}

describe("link shortener", () => {
  it("302s a known slug to its stored URL", async () => {
    await env.LINKS.put("gh", "https://example.com/profile");
    const { status, location } = await call("/gh");
    expect(status).toBe(302);
    expect(location).toBe("https://example.com/profile");
  });

  it("404s for an unknown slug", async () => {
    const { status, location } = await call("/does-not-exist");
    expect(status).toBe(404);
    expect(location).toBeNull();
  });

  it("returns a 200 landing response for the root path", async () => {
    const { status, location } = await call("/");
    expect(status).toBe(200);
    expect(location).toBeNull();
  });

  it("merges incoming query params (incoming wins on conflict)", async () => {
    await env.LINKS.put("q", "https://example.com/page?a=1&keep=yes");
    const { location } = await call("/q?a=2&utm=src");
    const url = new URL(location!);
    expect(url.origin + url.pathname).toBe("https://example.com/page");
    expect(url.searchParams.get("a")).toBe("2"); // incoming overrides stored
    expect(url.searchParams.get("keep")).toBe("yes"); // stored preserved
    expect(url.searchParams.get("utm")).toBe("src"); // incoming added
  });

  it("404s when the stored value is not a valid URL", async () => {
    await env.LINKS.put("bad", "not a url");
    const { status, location } = await call("/bad");
    expect(status).toBe(404);
    expect(location).toBeNull();
  });

  it("decodes percent-encoded slugs", async () => {
    await env.LINKS.put("my link", "https://example.com/spaced");
    const { location } = await call("/my%20link");
    expect(location).toBe("https://example.com/spaced");
  });
});
