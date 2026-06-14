export interface Env {
  LINKS: KVNamespace;
}

const DEFAULT_HEADERS = { "content-type": "text/plain; charset=utf-8" };

// allowlist guards against scheme-based redirects like javascript: and data:
const VALID_PROTOCOLS = ["http:", "https:"];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const slug = decodeSlug(url.pathname);

    // bare domain -> index page
    if (!slug) {
      return new Response("URL shortener", { status: 200, headers: DEFAULT_HEADERS });
    }

    const redirectUrl = await env.LINKS.get(slug);
    if (!redirectUrl || !isAllowedRedirect(redirectUrl)) {
      return new Response("Not found", { status: 404, headers: DEFAULT_HEADERS });;
    }

    return new Response(null, { status: 302, headers: { Location: redirectUrl } });
  },
} satisfies ExportedHandler<Env>;

function decodeSlug(pathname: string): string {
  const raw = pathname.replace(/^\/+/, "");
  try {
    return decodeURIComponent(raw);
  } catch {
    // malformed encoding -> treat the raw value as the slug
    return raw;
  }
}

function isAllowedRedirect(value: string): boolean {
  try {
    return VALID_PROTOCOLS.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
