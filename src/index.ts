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
      return new Response("URL shortener", {
        status: 200,
        headers: DEFAULT_HEADERS,
      });
    }

    const stored = await env.LINKS.get(slug);
    const destination = stored ? mergeQuery(stored, url.searchParams) : null;

    if (!destination) {
      return new Response("Not found", {
        status: 404,
        headers: DEFAULT_HEADERS,
      });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: destination },
    });
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

/**
 * Returns the destination with incoming query params merged in (incoming wins
 * on key conflicts), or null if the stored value isn't a valid absolute URL.
 */
function mergeQuery(stored: string, incoming: URLSearchParams): string | null {
  let dest: URL;
  try {
    dest = new URL(stored);
  } catch {
    return null;
  }
  for (const [key, value] of incoming) {
    dest.searchParams.set(key, value);
  }
  return dest.toString();
}
