/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly SESSION_PASSWORD: string;
    readonly CLOUDFLARE_PURGE_KEY: string;
    readonly CLOUDFLARE_ZONE_ID: string;
    readonly CLOUDFLARE_EMAIL: string;
  }
}
