import type { RouteComponent, LoaderFunction } from 'remix';
import { redirect } from 'remix';

const loader: LoaderFunction = ({ params }) =>
  redirect(`/${params.username}?brand=${params.brand}`);

const UserSneakerBrandPage: RouteComponent = () => null;

export default UserSneakerBrandPage;
export { loader };
