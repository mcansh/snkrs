import { redirect } from 'remix';
import type { LoaderFunction } from 'remix';

const loader: LoaderFunction = ({ params: { username } }) => {
  const currentYear = new Date().getFullYear();

  return redirect(`/${username}/yir/${currentYear}`);
};

const YearInReviewUserIndexPage = () => null;

export default YearInReviewUserIndexPage;
export { loader };
