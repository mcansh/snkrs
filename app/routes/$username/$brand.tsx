import type { RouteComponent, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

const loader: LoaderFunction = ({ params }) =>
  redirect(`/${params.username}?brand=${params.brand}`);

const UserSneakerBrandPage: RouteComponent = () => null;

export default UserSneakerBrandPage;
export { loader };
