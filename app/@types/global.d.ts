declare namespace NodeJS {
  interface ProcessEnv {
    CLOUDINARY_UPLOAD_PRESET: string;
    CLOUDINARY_UPLOAD_URL: string;
    CLOUDINARY_URL: string;
    CLOUDINARY_CLOUD_NAME: string;
    DATABASE_URL: string;
    SESSION_PASSWORD: string;
    FATHOM_SITE_ID: string;
    FATHOM_SCRIPT_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
    DEFAULT_USER: string;
  }
}
