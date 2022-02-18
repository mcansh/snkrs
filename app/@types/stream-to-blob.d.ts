declare module 'stream-to-blob' {
  export default function streamToBlob(
    stream: NodeJS.ReadableStream,
    mimeType?: string
  ): Promise<Blob>;
}
