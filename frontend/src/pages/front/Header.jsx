import logo from "../../assets/logo-01.png";
//import userIcon from "../../assets/user-icon.png";
import { UserRound, LayoutDashboard, UserPlus, LogIn } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, } from "@headlessui/react";

export default function Header() {
	return (
		<header>
			<nav className="border-gray-200 border-b border-slate-900/5 fixed w-full z-20 top-0 start-0">
				<div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-2">
					<a href="/" className="flex items-center">
						<img src={logo} className="h-16 mr-3" alt="Flowbite Logo" />
					</a>
					<div className="flex items-center text-right md:order-2">
						<Menu>
							<MenuButton type="button" className="flex mr-3 text-sm bg-white-100 rounded-full md:mr-0 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600" id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
								<span className="sr-only">Open user menu</span>
								<UserRound />
							</MenuButton>
								<MenuItems transition anchor="bottom end"
								className="z-50 mt-2 w-40 border 
								border-gray-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none 
								origin-top-left 
								transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] data-[closed]:scale-95 data-[closed]:opacity-0">
									<div className="py-1 px-1">
									<MenuItem>
										<a href="/dashboard" className="group flex w-full items-center gap-2 rounded-md py-1.5 px-3 text-black bg-gradient-to-r  data-[focus]:from-blue-600 data-[focus]:to-indigo-600 hover:text-white">
										<LayoutDashboard className="size-4" />
										Dashboard
										</a>
									</MenuItem>
									<MenuItem>
										<a href="/signup" className="group flex w-full items-center gap-2 rounded-md py-1.5 px-3 text-black bg-gradient-to-r data-[focus]:from-blue-600 data-[focus]:to-indigo-600 hover:text-white">
										<UserPlus className="size-4" />
										Sign Up
										</a>
									</MenuItem>
									<MenuItem>
										<a href="/login" className="group flex w-full items-center gap-2 rounded-md py-1.5 px-3 text-black bg-gradient-to-r data-[focus]:from-blue-600 data-[focus]:to-indigo-600 hover:text-white" >
										<LogIn className="size-4" />
										Login
										</a>
									</MenuItem>
									</div>
								</MenuItems>
						</Menu>
						<button data-collapse-toggle="mobile-menu-2" type="button" className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg md:hidden  focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="mobile-menu-2" aria-expanded="false">
							<span className="sr-only">Open main menu</span>
							<svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
								<path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
							</svg>
						</button>
					</div>
					<div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="mobile-menu-2">
						<ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0">
							<li>
								<a href="/" className="block py-2 pl-3 pr-4 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500" aria-current="page">
									Home
								</a>
							</li>
							<li>
								<a href="/signup" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
									About
								</a>
							</li>
							<li>
								<a href="/signup" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
									Pricing
								</a>
							</li>
							<li>
								<a href="/signup" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
									Contact
								</a>
							</li>
						</ul>
					</div>
				</div>
			</nav>
		</header>
	);
}
