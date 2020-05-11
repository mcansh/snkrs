import React from 'react';
import { render } from '@testing-library/react';

it('renders correctly', () => {
  const { container } = render(<h1>Hello World</h1>);
  expect(container.querySelector('h1')).toHaveTextContent('Hello World');
});
