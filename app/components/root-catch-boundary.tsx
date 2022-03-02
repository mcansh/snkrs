import { useCatch } from 'remix';

import { Document } from './document';

export function CatchBoundary() {
  let caught = useCatch();

  return (
    <Document
      title={`${caught.status} ${caught.statusText}`}
      bodyClassName="w-[90%] max-w-5xl mx-auto pt-20 space-y-4 font-mono text-center text-white bg-blue-bsod"
    >
      <h1 className="inline-block text-3xl font-bold bg-white text-blue-bsod">
        {caught.status} {caught.statusText}
      </h1>
    </Document>
  );
}
