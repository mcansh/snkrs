/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly SESSION_PASSWORD: string;
  }
}
