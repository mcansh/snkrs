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
    <form onSubmit={form.handleSubmit}>
      <label htmlFor="email">
        <span>Email: </span>
        <input
          onChange={form.handleChange}
          value={form.values.email}
          type="email"
          name="email"
          id="email"
          autoComplete="email"
        />
      </label>
      <label htmlFor="password">
        <span>Password: </span>
        <input
          onChange={form.handleChange}
          value={form.values.password}
          type="password"
          name="password"
          id="password"
        />
      </label>
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
