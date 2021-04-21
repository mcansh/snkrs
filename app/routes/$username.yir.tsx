import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';

const loader: LoaderFunction = ({ params: { username } }) => {
  const currentYear = new Date().getFullYear();

  return redirect(`/${username}/yir/${currentYear}`);
};

const YearInReviewUserIndexPage = () => null;

export default YearInReviewUserIndexPage;
export { loader };
