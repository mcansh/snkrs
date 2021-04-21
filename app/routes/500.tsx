import React from 'react';

function meta() {
  return {
    title: 'Shoot...',
  };
}

const FiveHundred: React.VFC = () => {
  console.error('Check your server terminal output');

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <h1 className="text-3xl">500</h1>
      <p>Something went wrong</p>
    </div>
  );
};

export default FiveHundred;
export { meta };
