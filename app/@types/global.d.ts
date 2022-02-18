declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    SESSION_PASSWORD: string;
    FATHOM_SITE_ID: string;
    FATHOM_SCRIPT_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
    CLOUDFLARE_ACCOUNT_ID_HASH: string;
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_IMAGES_API_TOKEN: string;
  }
}
