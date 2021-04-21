import React from 'react';

function meta() {
  return {
    title: "Ain't nothing here",
  };
}

const FourOhFour: React.VFC = () => (
  <div className="flex flex-col items-center justify-center w-full h-full">
    <h1 className="text-3xl">404</h1>
    <p>Page not found</p>
  </div>
);

export default FourOhFour;
export { meta };
