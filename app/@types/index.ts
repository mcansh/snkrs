import type { AppData } from 'remix';
import type {
  ActionArgs,
  ActionReturn,
  LinksArgs,
  LinksReturn,
  LoaderArgs,
  LoaderReturn,
  MetaArgs,
  MetaReturn,
} from 'remix-utils';
import type { Params } from 'react-router';

type TypedLoaderFunction<P extends Params = Params> = (
  args: Omit<LoaderArgs, 'params'> & { params: P }
) => LoaderReturn;

type TypedActionFunction<P extends Params = Params> = (
  args: Omit<ActionArgs, 'params'> & { params: P }
) => ActionReturn;

type TypedMetaFunction<Data extends AppData = AppData> = (
  args: Omit<MetaArgs, 'data'> & { data: Data }
) => MetaReturn;

type TypedLinksFunction<Data extends AppData = AppData> = (
  args: Omit<LinksArgs, 'data'> & { data: Data }
) => LinksReturn;

export {
  TypedLoaderFunction,
  TypedActionFunction,
  TypedMetaFunction,
  TypedLinksFunction,
};
