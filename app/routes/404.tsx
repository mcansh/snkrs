import * as React from 'react';

import type { MetaFunction, RouteComponent } from 'remix';

const meta: MetaFunction = () => ({
  title: "Ain't nothing here",
});

const FourOhFour: RouteComponent = () => (
  <div className="flex flex-col items-center justify-center w-full h-full font-mono">
    <h1 className="text-3xl">404</h1>
    <p>Page not found</p>
  </div>
);

export default FourOhFour;
export { meta };
