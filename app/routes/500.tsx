import React from 'react';

function meta() {
  return {
    title: 'Shoot...',
  };
}

const FiveHundred: React.VFC = () => {
  console.error('Check your server terminal output');

  return <h1>500</h1>;
};

export default FiveHundred;
export { meta };
