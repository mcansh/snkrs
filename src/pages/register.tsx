import React from 'react';
import { NextPage } from 'next';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';

const Register: NextPage = () => {
  const router = useRouter();
  const form = useFormik({
    initialValues: {
      email: '',
      name: '',
      username: '',
      password: '',
    },
    onSubmit: async values => {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: { 'content-type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.username) {
        router.push('/');
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
      <label htmlFor="name">
        <span>Name:</span>
        <input
          className="w-full px-2 py-1 border border-gray-400 rounded"
          onChange={form.handleChange}
          value={form.values.name}
          type="name"
          name="name"
          id="name"
          autoComplete="name"
        />
      </label>
      <label htmlFor="username">
        <span>Username:</span>
        <input
          className="w-full px-2 py-1 border border-gray-400 rounded"
          onChange={form.handleChange}
          value={form.values.username}
          type="username"
          name="username"
          id="username"
          autoComplete="username"
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
        />
      </label>
      <button
        className="self-start w-auto px-4 py-2 text-left text-white bg-blue-500 rounded"
        type="submit"
      >
        Register
      </button>
    </form>
  );
};

export default Register;
