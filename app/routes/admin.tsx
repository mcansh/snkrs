/* eslint-disable no-await-in-loop */
import type { Readable } from 'stream';

import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  UploadHandler,
} from 'remix';
import {
  unstable_parseMultipartFormData,
  Form,
  Link,
  useLoaderData,
  redirect,
  json,
} from 'remix';
import * as CSV from 'csv-string';
import type { Brand, Settings, Sneaker, User } from '@prisma/client';

import { sessionKey } from '~/constants';
import { prisma } from '~/db.server';
import { getSeoMeta } from '~/seo';
import { getSession } from '~/session';
import { isAdmin } from '~/lib/schemas/user.server';
import type { RouteHandle } from '~/@types/types';

interface LoaderData {
  users: Array<{
    email: string;
    username: string;
    updatedAt: string;
    createdAt: string;
    fullName: string;
    id: string;
    sneakers: number;
  }>;
}

export let loader: LoaderFunction = async ({ request }) => {
  let session = await getSession(request.headers.get('Cookie'));
  let userId = session.get(sessionKey);

  if (!userId) {
    return redirect(`/login?returnTo=${request.url}`);
  }

  let user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return redirect(`/login?returnTo=${request.url}`);
  }

  if (!isAdmin(user)) {
    return redirect(`/${user.username}`);
  }

  let users = await prisma.user.findMany({
    select: {
      email: true,
      username: true,
      updatedAt: true,
      createdAt: true,
      fullName: true,
      id: true,
      sneakers: { select: { id: true } },
    },
  });

  return json<LoaderData>({
    users: users.map(currentUser => ({
      ...currentUser,
      createdAt: currentUser.createdAt.toISOString(),
      updatedAt: currentUser.updatedAt.toISOString(),
      sneakers: currentUser.sneakers.length,
    })),
  });
};

function parseCSVStream(stream: Readable) {
  return new Promise((resolve, reject) => {
    let parser = CSV.createStream({ separator: ',' });

    let columns: Array<string> = [];

    let rows: Array<Record<string, string>> = [];

    parser.on('data', (row: any) => {
      if (columns.length === 0) {
        columns = row;
      } else {
        let data: Record<string, string> = {};
        columns.forEach((column, index) => {
          data[column] = row[index];
        });

        rows.push(data);
      }
    });

    parser.on('end', () => {
      resolve(rows);
    });

    parser.on('error', error => {
      reject(error);
    });

    stream.pipe(parser);
  });
}

type MakeValueString<T> = { [K in keyof T]: string };

export let action: ActionFunction = async ({ request }) => {
  let session = await getSession(request.headers.get('Cookie'));
  let userId = session.get(sessionKey);

  if (!userId) {
    return redirect(`/login?returnTo=${request.url}`);
  }

  let user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return redirect(`/login?returnTo=${request.url}`);
  }

  if (!isAdmin(user)) {
    return redirect(`/${user.username}`);
  }

  let uploadHandler: UploadHandler = async ({ stream, name }) => {
    let results = await parseCSVStream(stream);

    if (name === 'users') {
      for (let row of results as Array<MakeValueString<User>>) {
        await prisma.user.upsert({
          where: { email: row.email },
          create: {
            id: row.id,
            email: row.email,
            username: row.username,
            fullName: row.fullName,
            familyName: row.familyName,
            givenName: row.givenName,
            password: row.password,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            role: row.role || 'USER',
          },
          update: {
            id: row.id,
            email: row.email,
            username: row.username,
            fullName: row.fullName,
            familyName: row.familyName,
            givenName: row.givenName,
            password: row.password,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            role: row.role || 'USER',
          },
        });
      }
    } else if (name === 'brand') {
      for (let row of results as Array<MakeValueString<Brand>>) {
        await prisma.brand.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            name: row.name,
            slug: row.slug,
          },
          update: {
            id: row.id,
            name: row.name,
            slug: row.slug,
          },
        });
      }
    } else if (name === 'sneakers') {
      for (let row of results as Array<MakeValueString<Sneaker>>) {
        await prisma.sneaker.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            colorway: row.colorway,
            imagePublicId: row.imagePublicId,
            model: row.model,
            price: Number(row.price),
            retailPrice: Number(row.retailPrice),
            brand: {
              connect: {
                id: row.brandId,
              },
            },
            user: {
              connect: {
                id: row.userId,
              },
            },
            size: Number(row.size),
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            soldDate: row.soldDate ? new Date(row.soldDate) : null,
            sold: row.sold === 'TRUE',
            purchaseDate: new Date(row.purchaseDate),
            soldPrice: row.soldPrice ? Number(row.soldPrice) : null,
          },
          update: {
            id: row.id,
            colorway: row.colorway,
            imagePublicId: row.imagePublicId,
            model: row.model,
            price: Number(row.price),
            retailPrice: Number(row.retailPrice),
            brand: {
              connect: {
                id: row.brandId,
              },
            },
            user: {
              connect: {
                id: row.userId,
              },
            },
            size: Number(row.size),
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt),
            soldDate: row.soldDate ? new Date(row.soldDate) : null,
            sold: row.sold === 'TRUE',
            purchaseDate: new Date(row.purchaseDate),
            soldPrice: row.soldPrice ? Number(row.soldPrice) : null,
          },
        });
      }
    } else if (name === 'settings') {
      for (let row of results as Array<MakeValueString<Settings>>) {
        await prisma.settings.upsert({
          where: { id: row.id },
          create: {
            id: row.id,
            showPurchasePrice: row.showPurchasePrice === 'TRUE',
            showRetailPrice: row.showRetailPrice === 'TRUE',
            showTotalPrice: row.showTotalPrice === 'TRUE',
            userId: row.userId,
          },
          update: {
            id: row.id,
            showPurchasePrice: row.showPurchasePrice === 'TRUE',
            showRetailPrice: row.showRetailPrice === 'TRUE',
            showTotalPrice: row.showTotalPrice === 'TRUE',
            userId: row.userId,
          },
        });
      }
    } else {
      throw new Error('invalid upload');
    }

    return '';
  };

  await unstable_parseMultipartFormData(request, uploadHandler);

  return redirect('/admin');
};

export let meta: MetaFunction = () => {
  return getSeoMeta({
    title: 'Admin Panel',
  });
};

export let handle: RouteHandle = {
  bodyClassName: 'bg-gray-100 py-6',
};

export default function AdminPanel() {
  let data = useLoaderData<LoaderData>();

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
      <div className="flex flex-col">
        <Form
          reloadDocument
          method="post"
          encType="multipart/form-data"
          className="space-y-2 flex flex-col max-w-xs px-2"
        >
          <label>
            <span className="block text-sm font-medium leading-5 text-gray-700">
              Upload Users CSV
            </span>
            <input
              type="file"
              name="users"
              accept="text/csv"
              className="file:bg-slate-300 file:rounded file:px-2 file:py-1 file:border-none file:shadow-sm file:cursor-pointer"
            />
          </label>
          <label>
            <span className="block text-sm font-medium leading-5 text-gray-700">
              Upload Sneakers CSV
            </span>
            <input
              type="file"
              name="sneakers"
              accept="text/csv"
              className="file:bg-slate-300 file:rounded file:px-2 file:py-1 file:border-none file:shadow-sm file:cursor-pointer"
            />
          </label>
          <label>
            <span className="block text-sm font-medium leading-5 text-gray-700">
              Upload Brand CSV
            </span>
            <input
              type="file"
              name="brand"
              accept="text/csv"
              className="file:bg-slate-300 file:rounded file:px-2 file:py-1 file:border-none file:shadow-sm file:cursor-pointer"
            />
          </label>
          <label>
            <span className="block text-sm font-medium leading-5 text-gray-700">
              Upload Settings CSV
            </span>
            <input
              type="file"
              name="settings"
              accept="text/csv"
              className="file:bg-slate-300 file:rounded file:px-2 file:py-1 file:border-none file:shadow-sm file:cursor-pointer"
            />
          </label>
          <button
            className="w-fit bg-blue-500 text-white px-2 py-1 rounded cursor-pointer"
            type="submit"
          >
            Upload
          </button>
        </Form>
        <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Username
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Sneaker Count
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((person, personIdx) => (
                    <tr
                      key={person.email}
                      className={
                        personIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {person.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.sneakers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`users/${person.username}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
