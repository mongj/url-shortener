/// <reference types="@cloudflare/vitest-pool-workers/types" />

declare global {
  namespace Cloudflare {
    interface Env {
      LINKS: KVNamespace;
    }
  }
}

export {};
