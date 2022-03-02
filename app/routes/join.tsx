import * as React from 'react';
import type { ActionFunction, LoaderFunction, MetaFunction } from 'remix';
import { json, redirect, useLoaderData, useTransition } from 'remix';

import { prisma } from '~/db.server';
import { registerSchema } from '~/lib/schemas/user.server';
import { hash } from '~/lib/auth.server';
import type {
  RegisterSchema,
  PossibleRegistrationErrors,
} from '~/lib/schemas/user.server';
import { createUserSession, getUserId } from '~/session.server';

interface RouteData {
  joinError?: undefined | (Partial<RegisterSchema> & { generic?: string });
}

export let loader: LoaderFunction = async ({ request }) => {
  let userId = await getUserId(request);
  if (userId) return redirect('/');
  return json(null);
};

interface ActionData {
  errors: PossibleRegistrationErrors;
}

export let action: ActionFunction = async ({ request }) => {
  const body = await request.formData();
  const email = body.get('email');
  const givenName = body.get('givenName');
  const familyName = body.get('familyName');
  const username = body.get('username');
  const password = body.get('password');

  const valid = registerSchema.safeParse({
    email,
    givenName,
    familyName,
    username,
    password,
  });

  if (!valid.success) {
    return json<ActionData>(
      { errors: valid.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const foundUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: valid.data.email }, { username: valid.data.username }],
    },
  });

  if (foundUser && foundUser.email === email) {
    return json<ActionData>(
      { errors: { email: ['A user with this email already exists'] } },
      { status: 400 }
    );
  }

  if (foundUser && foundUser.username === username) {
    return json<ActionData>(
      { errors: { username: ['A user with this username already exists'] } },
      { status: 400 }
    );
  }

  const hashed = await hash(valid.data.password);

  const newUser = await prisma.user.create({
    data: {
      email: valid.data.email,
      familyName: valid.data.familyName,
      givenName: valid.data.givenName,
      password: hashed,
      username: valid.data.username,
      fullName: `${valid.data.givenName} ${valid.data.familyName}`,
    },
  });

  let redirectTo = new URL(request.url).searchParams.get('redirectTo');

  return createUserSession(
    request,
    newUser.id,
    redirectTo ?? `/${newUser.username}`
  );
};

export let meta: MetaFunction = () => ({
  title: 'Join',
  description: 'show off your sneaker collection',
});

export default function JoinPage() {
  const transition = useTransition();
  const pendingForm = transition.submission;
  const data = useLoaderData<RouteData>();

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h1>brb</h1>
    </div>
  );
}
