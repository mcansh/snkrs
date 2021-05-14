import React from 'react';
import { Outlet } from 'react-router-dom';

interface DataOutletContext<T = any> {
  data: T | undefined;
}

const Context = React.createContext<DataOutletContext | undefined>(undefined);

const DataOutlet: React.FC<DataOutletContext> = ({ data }) => (
  <Context.Provider value={data}>
    <Outlet />
  </Context.Provider>
);

function useParentRouteData<T>() {
  const context = React.useContext(Context);
  if (!context) {
    throw new Error(`useParentRouteData must be wrapped in a DataOutlet`);
  }

  return context as unknown as T;
}

export { DataOutlet, useParentRouteData };
