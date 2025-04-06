import logo from "../../assets/Logo.png";
//import userIcon from "../../assets/user-icon.png";
import { UserRound, LayoutDashboard, UserPlus, LogIn, LogOut } from "lucide-react";
//import { Menu, MenuButton, MenuItem, MenuItems, } from "@headlessui/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";

export default function Header() {
	const [scrolled, setScrolled] = useState(false);

	const { setTheme } = useTheme();

	const { logout, isAuthenticated } = useAuthStore();

	function handleLogout() {
		logout();
	}

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 10) {
				setScrolled(true);
			} else {
				setScrolled(false);
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header>
			<nav className={`fixed w-full z-20 top-0 start-0 border-b border-slate-900/5 transition duration-300 ${scrolled ? "bg-white/30 dark:bg-slate-900/30 backdrop-blur-md shadow-md" : "bg-transparent"}`}>
				<div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-2">
					<a href="/" className="flex items-center">
						<img src={logo} className="h-16 mr-3" alt="Flowbite Logo" />
					</a>
					<div className="flex items-center text-right md:order-2 gap-3">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<UserRound className="h-[1.2rem] w-[1.2rem]" />
									<span className="sr-only">My Account</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{isAuthenticated ? (
									<>
										<DropdownMenuItem>
											<a href="/dashboard" className="group flex w-full items-center gap-2">
												<LayoutDashboard className="size-4" />
												Dashboard
											</a>
										</DropdownMenuItem>
										<DropdownMenuItem onClick={handleLogout} className="group flex w-full items-center gap-2">
											<LogOut className="size-4" />
											Logout
										</DropdownMenuItem>
									</>
								) : (
									<>
										<DropdownMenuItem>
											<a href="/signup" className="group flex w-full items-center gap-2">
												<UserPlus className="size-4" />
												Sign Up
											</a>
										</DropdownMenuItem>
										<DropdownMenuItem>
											<a href="/login" className="group flex w-full items-center gap-2">
												<LogIn className="size-4" />
												Login
											</a>
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
						<div className="ml-auto">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="icon">
										<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
										<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
										<span className="sr-only">Toggle theme</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
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
								<a href="#about" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-300 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
									About
								</a>
							</li>
							<li>
								<a href="#pricing" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-300 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
									Pricing
								</a>
							</li>
							<li>
								<a href="#contact" className="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-300 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
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
