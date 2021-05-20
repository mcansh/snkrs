import { redirect } from 'remix';

import type { RouteComponent, LoaderFunction } from 'remix';

const loader: LoaderFunction = ({ params }) =>
  redirect(`/${params.username}?brand=${params.brand}`);

const UserSneakerBrandPage: RouteComponent = () => null;

export default UserSneakerBrandPage;
export { loader };
