import * as React from 'react';
import { useToaster } from 'react-hot-toast';
import { Portal, Transition } from '@headlessui/react';
import type { Toast } from 'react-hot-toast/dist/core/types';

import x from './icons/solid/x.svg';

const Notification: React.VFC<
  Toast & { startPause: VoidFunction; endPause: VoidFunction }
> = ({ startPause, endPause, message, visible }) => {
  const [isVisible, setIsVisible] = React.useState(() => visible);

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end"
      onMouseEnter={startPause}
      onMouseLeave={endPause}
    >
      <Transition
        show={isVisible}
        as={React.Fragment}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex justify-between flex-1 w-0">
                <p className="flex-1 w-0 text-sm font-medium text-gray-900">
                  {message}
                </p>
              </div>
              <div className="flex flex-shrink-0 ml-4">
                <button
                  className="inline-flex text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setIsVisible(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" aria-hidden="true">
                    <use href={`${x}#x`} />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

const Notifications: React.VFC = () => {
  const { toasts, handlers } = useToaster();
  const { startPause, endPause } = handlers;

  return (
    <Portal>
      {toasts.map(t => (
        <Notification
          key={t.id}
          {...t}
          startPause={startPause}
          endPause={endPause}
        />
      ))}
    </Portal>
  );
};

export { Notifications };
