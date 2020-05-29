import React from 'react';
import { NextPage } from 'next';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';

const Login: NextPage = () => {
  const router = useRouter();
  const form = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async values => {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: { 'content-type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.username) {
        if (router.query.continue) {
          router.push(router.query.continue as string);
        } else {
          router.push('/');
        }
      }
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit}
      className="flex flex-col justify-center w-11/12 max-w-lg py-8 mx-auto space-y-4"
    >
      <label htmlFor="email">
        <span>Email:</span>
        <input
          className="w-full px-2 py-1 border border-gray-400 rounded"
          onChange={form.handleChange}
          value={form.values.email}
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
          onChange={form.handleChange}
          value={form.values.password}
          type="password"
          name="password"
          id="password"
          autoComplete="password"
        />
      </label>
      <button
        disabled={form.isSubmitting}
        className="self-start w-auto px-4 py-2 text-left text-white bg-blue-500 rounded"
        type="submit"
      >
        Log{form.isSubmitting && 'ging'} in
      </button>
    </form>
  );
};

export default Login;
