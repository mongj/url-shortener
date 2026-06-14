export interface Env {
  /** Short links: key = slug, value = destination URL (plain string). */
  LINKS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const slug = decodeSlug(url.pathname);

    // Bare domain: a tiny landing response instead of an error.
    if (!slug) {
      return new Response("URL shortener", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const stored = await env.LINKS.get(slug);
    const destination = stored ? mergeQuery(stored, url.searchParams) : null;

    if (!destination) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
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
    // Malformed percent-encoding: treat the raw value as the slug.
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
