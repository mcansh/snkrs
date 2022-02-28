import { Document } from './document';

export function ErrorBoundary({ error }: { error: Error }) {
  console.error('Check your server terminal output');

  return (
    <Document
      title="Shoot..."
      bodyClassName="min-h-screen w-[90%] max-w-5xl mx-auto pt-20 space-y-4 font-mono text-center text-white bg-blue-bsod"
    >
      <h1 className="inline-block text-3xl font-bold bg-white text-blue-bsod">
        Uncaught Exception!
      </h1>
      <p>
        If you are not the developer, please click back in your browser and try
        again.
      </p>
      <pre className="px-4 py-2 overflow-auto border-4 border-white">
        {error.message}
      </pre>
      <p>
        There was an uncaught exception in your application. Check the browser
        console and/or the server console to inspect the error.
      </p>
    </Document>
  );
}
