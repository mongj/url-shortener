export interface Env {
  LINKS: KVNamespace;
}

const DEFAULT_HEADERS = { "content-type": "text/plain; charset=utf-8" };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const slug = decodeSlug(url.pathname);

    // bare domain -> index page
    if (!slug) {
      return new Response("URL shortener", { status: 200, headers: DEFAULT_HEADERS });
    }

    const redirectUrl = await env.LINKS.get(slug);

    // 404 if the redirect URL is not found
    if (!redirectUrl) {
      return new Response("Not found", { status: 404, headers: DEFAULT_HEADERS });
    }

    // 404 if the redirect URL is not a valid URL
    try {
      new URL(redirectUrl);
    } catch {
      return new Response("Not found", { status: 404, headers: DEFAULT_HEADERS });
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
