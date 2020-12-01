import { Form, usePendingFormSubmit, useRouteData } from '@remix-run/react';
import React from 'react';
import { useLocation } from 'react-router-dom';

export const meta = () => ({
  title: 'Log in',
});

const Login: React.VFC = () => {
  const pendingForm = usePendingFormSubmit();
  const location = useLocation();
  const data = useRouteData();
  console.log(pendingForm, data);

  return (
    <div className="w-11/12 max-w-lg py-8 mx-auto">
      <h1 className="pb-2 text-2xl font-medium">Log in</h1>

      <Form
        action={`/login?${location.search}`}
        method="post"
        className="space-y-4"
      >
        <fieldset disabled={!!pendingForm} className="flex flex-col space-y-4">
          <label htmlFor="email">
            <span>Email:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="email"
              name="email"
              id="email"
              autoComplete="email"
            />
          </label>
          <label htmlFor="password">
            <span>Password:</span>
            <input
              className="w-full px-2 py-1 border border-gray-400 rounded"
              type="password"
              name="password"
              id="password"
            />
          </label>
          <button
            className="self-start w-auto px-4 py-2 text-left text-white transition-colors duration-100 ease-in-out bg-blue-500 rounded disabled:bg-blue-200 hover:bg-blue-700 disabled:cursor-not-allowed"
            type="submit"
          >
            Log{pendingForm && 'ging'} in
          </button>
        </fieldset>
      </Form>
    </div>
  );
};

export default Login;
