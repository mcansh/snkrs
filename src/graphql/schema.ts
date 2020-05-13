import path from 'path';

import { makeSchema, asNexusMethod, objectType, idArg } from '@nexus/schema';
import { GraphQLDateTime } from 'graphql-iso-date';

import { Context } from './context';

export const GQLDate = asNexusMethod(GraphQLDateTime, 'date');

const Sneaker = objectType({
  name: 'Sneaker',
  definition(t) {
    t.id('id');
    t.string('model');
    t.string('colorway');
    t.string('brand');
    t.float('size');
    t.string('imagePublicId');
    t.int('price');
    t.int('retailPrice');
    t.date('purchaseDate');
    t.boolean('sold');
    t.date('soldDate', { nullable: true });
    t.int('soldPrice', { nullable: true });
    t.id('stockxProductId', { nullable: true });
  },
});

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.list.field('getSneakers', {
      type: 'Sneaker',
      resolve(_parent, _args, ctx: Context, _info) {
        return ctx.db.sneaker.findMany({ orderBy: { purchaseDate: 'desc' } });
      },
    });
    t.field('getSneaker', {
      type: 'Sneaker',
      args: { id: idArg() },
      nullable: true,
      resolve(_parent, { id }, ctx: Context, _info) {
        return ctx.db.sneaker.findOne({ where: { id } });
      },
    });
  },
});

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.field('ok', {
      type: 'Boolean',
      resolve: () => true,
    });
  },
});

const currentDir = path.join(process.cwd(), 'src', 'graphql', 'generated');

const schema = makeSchema({
  types: [Query, Mutation, Sneaker, GQLDate],
  outputs: {
    typegen: path.join(currentDir, 'nexus-typegen.ts'),
    schema: path.join(currentDir, 'schema.graphql'),
  },
});

export { schema };
