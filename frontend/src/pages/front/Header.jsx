//import logo from "../../assets/Logo.png";
import logoWhite from "../../assets/logo-white.png";
//import userIcon from "../../assets/user-icon.png";
import { UserRound, LayoutDashboard, UserPlus, LogIn, LogOut } from "lucide-react";
//import { Menu, MenuButton, MenuItem, MenuItems, } from "@headlessui/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Header() {
	const [scrolled, setScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const { setTheme } = useTheme();

	const { logout, isAuthenticated } = useAuthStore();

	function handleLogout() {
		logout();
		toast.success("You have been successfully logged out.");
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

	const scrollToSection = (e, sectionId) => {
		e.preventDefault();
		const element = document.getElementById(sectionId);
		if (element) {
			// Get the offset position of the section
			const offsetTop = element.offsetTop - 80; // Adjust for fixed header height
			// Scroll to the section with smooth behavior
			window.scrollTo({
				top: offsetTop,
				behavior: 'smooth'
			});
		}
	};

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<header>
			<nav className={`fixed w-full z-30 top-0 pt-4 start-0 border-b border-slate-900/5 transition duration-300 ${scrolled ? "bg-neutral-900/80 dark:bg-neutral-900/50 backdrop-blur-md shadow-md pt-2" : "bg-transparent"}`}>
				<div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-2">
					<a href="/" className="flex items-center">
						<img src={scrolled ? logoWhite : logoWhite} className="h-10 md:h-12 mr-3" alt="Custovra Logo" />
					</a>
					<div className="flex items-center text-right md:order-2 gap-3">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon" className="bg-transparent text-[#16bf4c] hover:text-white hover:hover:bg-[#16bf4b75]">
									<UserRound className="h-[1.2rem] w-[1.2rem]" />
									<span className="sr-only">My Account</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{isAuthenticated ? (
									<>
										<DropdownMenuItem className="bg-transparent text-neutral-800 dark:text-white hover:text-white hover:bg-[#16bf4b] dark:hover:bg-[#16bf4b75]">
											<a href="/dashboard" className="group flex w-full items-center gap-2">
												<LayoutDashboard className="size-4" />
												Dashboard
											</a>
										</DropdownMenuItem >
										<DropdownMenuItem 
											onClick={handleLogout} className="group flex w-full items-center gap-2 bg-transparent text-neutral-800 dark:text-white hover:text-white hover:bg-[#16bf4b] dark:hover:bg-[#16bf4b75]">
											<LogOut className="size-4" />
											Logout
										</DropdownMenuItem>
									</>
								) : (
									<>
										<DropdownMenuItem className="bg-transparent text-neutral-800 dark:text-white hover:text-white hover:bg-[#16bf4b] dark:hover:bg-[#16bf4b75]">
											<a href="/signup" className="group flex w-full items-center gap-2">
												<UserPlus className="size-4" />
												Sign Up
											</a>
										</DropdownMenuItem>
										<DropdownMenuItem className="bg-transparent text-neutral-800 dark:text-white hover:text-white hover:bg-[#16bf4b] dark:hover:bg-[#16bf4b75] ">
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
									<Button variant="outline" size="icon" className="bg-transparent text-[#16bf4c] hover:text-white hover:hover:bg-[#16bf4b75]">
										<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
										<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
										<span className="sr-only">Toggle theme</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="dark:bg-neutral-950">
									<DropdownMenuItem onClick={() => setTheme("light")} className="bg-transparent text-neutral-800 dark:text-white hover:text-white hover:bg-[#16bf4b] dark:hover:bg-[#16bf4b75]">Light</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setTheme("dark")} className="bg-transparent text-neutral-800 dark:text-white hover:text-white hover:bg-[#16bf4b] dark:hover:bg-[#16bf4b75]">Dark</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setTheme("system")} className="bg-transparent text-neutral-800 dark:text-white hover:text-white hover:bg-[#16bf4b] dark:hover:bg-[#16bf4b75]">System</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<button 
							data-collapse-toggle="mobile-menu-2" 
							type="button" 
							className="inline-flex items-center p-2 ml-1 text-sm text-theme-green rounded-lg md:hidden focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-theme-green dark:hover:bg-themebg dark:focus:ring-gray-600" 
							aria-controls="mobile-menu-2" 
							aria-expanded={mobileMenuOpen}
							onClick={toggleMobileMenu}
						>
							<span className="sr-only">Open main menu</span>
							<svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
								<path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
							</svg>
						</button>
					</div>
					<div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${mobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu-2">
						<ul className="flex flex-col font-medium p-4 md:p-0 mt-4 bg-themebg md:bg-transparent border border-gray-800 rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0">
							<li>
								<a href="#home" className="block py-2 pl-3 pr-4 uppercase text-white bg-text-[#16bf4c] rounded md:bg-transparent md:text-[#16bf4c] md:p-0 md:dark:text-[#16bf4c]" aria-current="page" onClick={(e) => {scrollToSection(e, 'home'); setMobileMenuOpen(false);}}>
									Home
								</a>
							</li>
							<li>
								<a href="#features" className="block py-2 pl-3 pr-4 uppercase text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-[#16bf4c] md:p-0 md:dark:hover:text-blue-300 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700" onClick={(e) => {scrollToSection(e, 'features'); setMobileMenuOpen(false);}}>
									Features
								</a>
							</li>
							<li>
								<a href="#pricing" className="block py-2 pl-3 pr-4 uppercase text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-[#16bf4c] md:p-0 md:dark:hover:text-blue-300 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700" onClick={(e) => {scrollToSection(e, 'pricing'); setMobileMenuOpen(false);}}>
									Pricing
								</a>
							</li>
							<li>
								<a href="#faq" className="block py-2 pl-3 pr-4 uppercase text-white rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-[#16bf4c] md:p-0 md:dark:hover:text-blue-300 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700" onClick={(e) => {scrollToSection(e, 'faq'); setMobileMenuOpen(false);}}>
									FAQ
								</a>
							</li>
						</ul>
					</div>
				</div>
			</nav>
		</header>
	);
}