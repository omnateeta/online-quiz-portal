import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();

  // Simplified navigation based on user role
  const navigation = [
    { name: 'Home', href: '/', current: false },
    ...(user 
      ? isAdmin 
        ? [
            { 
              name: 'Admin Panel', 
              href: '/admin', 
              current: window.location.pathname === '/admin'
            }
          ]
        : [
            { 
              name: 'Student Dashboard', 
              href: '/dashboard', 
              current: window.location.pathname === '/dashboard'
            }
          ]
      : []
    )
  ];

  return (
    <Disclosure as="nav" className="bg-primary-600">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="-ml-2 mr-2 flex items-center md:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex flex-shrink-0 items-center">
                  <Link to={isAdmin ? '/admin' : '/'} className="text-white font-bold flex items-center">
                    {isAdmin ? 'Admin Portal' : 'Quiz Portal'}
                  </Link>
                </div>
                <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={classNames(
                        item.current
                          ? 'bg-primary-700 text-white'
                          : 'text-white hover:bg-primary-700',
                        'px-3 py-2 rounded-md font-medium flex items-center h-full'
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                {user ? (
                  <div className="hidden md:ml-4 md:flex md:flex-shrink-0 md:items-center">
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="flex rounded-full bg-primary-600 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600">
                          <span className="sr-only">Open user menu</span>
                          <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center text-white">
                            {user.username[0].toUpperCase()}
                          </div>
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <div className="px-4 py-2 text-sm text-gray-700">
                                <div className="font-medium">{user.username}</div>
                                <div className="text-gray-500">{user.email}</div>
                                {isAdmin && <div className="text-primary-600 font-medium">Administrator</div>}
                              </div>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={logout}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block w-full px-4 py-2 text-sm text-gray-700 text-left border-t'
                                )}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                ) : (
                  <div className="flex space-x-4">
                    <Link
                      to="/login"
                      className="text-white hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-white text-primary-600 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-primary-700 text-white'
                      : 'text-white hover:bg-primary-700',
                    'block px-3 py-2 rounded-md text-base font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {user && (
              <div className="border-t border-primary-700 pb-3 pt-4">
                <div className="flex items-center px-5">
                  <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center text-white">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user.username}</div>
                    <div className="text-sm font-medium text-primary-300">{user.email}</div>
                    {isAdmin && <div className="text-sm font-medium text-primary-300">Administrator</div>}
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <button
                    onClick={logout}
                    className="block w-full px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-700 hover:text-white"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar; 