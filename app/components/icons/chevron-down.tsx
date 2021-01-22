import * as React from 'react';

type Props = React.SVGAttributes<HTMLOrSVGElement>;

const ChevronDownIcon: React.VFC<Props> = props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export { ChevronDownIcon };
