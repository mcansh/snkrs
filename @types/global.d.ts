/// <reference types="node" />

// Extend the NodeJS namespace with variables in next.config.js
declare namespace NodeJS {
  interface ProcessEnv {
    readonly SESSION_PASSWORD: string;
    readonly VERSION: string;
    readonly QUICKMETRICS_API_KEY: string;
  }
}
