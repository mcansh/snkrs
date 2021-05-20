import * as React from 'react';

import FourOhFour from '../404';
import { SneakerCard } from '../../components/sneaker';
import { useParentRouteData } from '../../components/data-outlet';

import type { RouteComponent } from 'remix';
import type { RouteData } from '../$username';

const UserSneakersChildPage: RouteComponent = () => {
  const data = useParentRouteData<RouteData>();

  if (!data.user) {
    return <FourOhFour />;
  }

  return (
    <ul className="grid grid-cols-2 px-4 py-6 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
      {data.user.sneakers.map(sneaker => (
        <SneakerCard key={sneaker.id} {...sneaker} />
      ))}
    </ul>
  );
};

export default UserSneakersChildPage;
