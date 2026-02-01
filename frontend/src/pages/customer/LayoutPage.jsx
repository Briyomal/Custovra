import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { CustomerSidebar } from "@/components/customer-view/Sidebar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import UsageIndicators from "@/components/ui/usage-indicators";
import { useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
//import toast from "react-hot-toast";

function CustomerLayoutPage({ children }) {
	const { user } = useAuthStore();
	const location = useLocation();
	//const navigate = useNavigate();
	const [formNames, setFormNames] = useState({});

	const { setTheme } = useTheme();



	// Fetch form names when paths change
	useEffect(() => {
		const paths = location.pathname.split('/').filter(Boolean);
		const formIds = paths.filter(path => path.length === 24); // MongoDB ObjectId length
		
		formIds.forEach(async (formId) => {
			if (!formNames[formId]) {
				try {
					const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/${formId}`, {
						withCredentials: true
					});
					setFormNames(prev => ({
						...prev,
						[formId]: response.data.form_name
					}));
				} catch (error) {
					console.error(`Error fetching form name for ID ${formId}:`, error);
				}
			}
		});
	}, [location.pathname]);

	// Define breadcrumb mappings
	const breadcrumbMappings = useMemo(() => {
		const paths = location.pathname.split('/').filter(Boolean);
		
		// Define route to breadcrumb mapping
		const routeMap = {
			'forms': 'Forms',
			'submissions': 'Submissions',
			'employees': 'Employees',
			'reports': 'Reports',
			'settings': 'Settings',
			'billing': 'Billing',
			'profile': 'Profile'
		};

		// Build breadcrumb items
		const breadcrumbs = [];
		
		// Add intermediate paths (without Dashboard as requested)
		let currentPath = '';
		paths.forEach((path, index) => {
			currentPath += `/${path}`;
			
			// Skip empty paths
			if (!path) return;
			
			// Special handling for create-form to show "Create Form" instead of "Create-form"
			if (path === 'create-form') {
				breadcrumbs.push({ name: 'Create Form', path: currentPath });
			}
			// Check if it's a form ID and we have the form name
			else if (path.length === 24 && formNames[path]) {
				breadcrumbs.push({ name: formNames[path], path: currentPath });
			}
			// Check if it's a form submission detail page (has form ID)
			else if (paths[index - 1] === 'submissions' && path.length === 24) {
				breadcrumbs.push({ name: 'Form Submissions', path: currentPath });
			} else {
				const name = routeMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
				breadcrumbs.push({ name, path: currentPath });
			}
		});

		return breadcrumbs;
	}, [location.pathname, formNames]);

	return (
		<div>
			<SidebarProvider>
				<CustomerSidebar />
				<SidebarInset>
					<header className="flex h-16 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
						{/* Left-aligned content */}
						<div className="flex items-center gap-2">
							<SidebarTrigger className="-ml-1" />
							<Separator orientation="vertical" className="mr-2 h-4" />
							<Breadcrumb>
								<BreadcrumbList>
									{breadcrumbMappings.map((crumb, index) => (
										<>
											<BreadcrumbItem key={index} className={index === breadcrumbMappings.length - 1 ? "hidden md:block" : "hidden md:block"}>
												{index < breadcrumbMappings.length - 1 ? (
													<BreadcrumbLink href={crumb.path}>{crumb.name}</BreadcrumbLink>
												) : (
													<BreadcrumbPage>{crumb.name}</BreadcrumbPage>
												)}
											</BreadcrumbItem>
											{index < breadcrumbMappings.length - 1 && (
												<BreadcrumbSeparator className="hidden md:block" />
											)}
										</>
									))}
								</BreadcrumbList>
							</Breadcrumb>
						</div>
						{/* Right-aligned content */}
						<div className="ml-auto flex items-center gap-2 md:gap-4">
							{/* Usage Indicators */}
							<UsageIndicators />
							{user?.subscription ? (
								<Badge
									className={`mr-0 md:mr-3 px-2 md:px-3 py-1 rounded-sm text-white text-sm ${
										user.subscription.plan_name?.toLowerCase().includes('gold')
											? 'bg-gradient-to-r from-yellow-600 to-amber-400 border-amber-300 dark:border-yellow-700'
											: user.subscription.plan_name?.toLowerCase().includes('silver')
												? 'bg-gradient-to-r from-slate-500 to-gray-400 border-gray-300 dark:border-slate-600'
												: 'bg-gradient-to-r from-stone-700 to-gray-500 border-gray-300 dark:border-stone-700'
									}`}
								>
									{user.subscription.plan_name}
								</Badge>
							) : user?.subscription_plan ? (
								<Badge
									className={`mr-0 md:mr-3 px-2 md:px-3 py-1 rounded-sm text-white text-sm ${
										user.subscription_plan?.toLowerCase().includes('gold')
											? 'bg-gradient-to-r from-yellow-600 to-amber-400 border-amber-300 dark:border-yellow-700'
											: user.subscription_plan?.toLowerCase().includes('silver')
												? 'bg-gradient-to-r from-slate-500 to-gray-400 border-gray-300 dark:border-slate-600'
												: 'bg-gradient-to-r from-stone-700 to-gray-500 border-gray-300 dark:border-stone-700'
									}`}
								>
									{user.subscription_plan}
								</Badge>
							) : (
								<p></p>
							)}
							
							{/* Theme Toggle */}
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
					</header>

					<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}

export default CustomerLayoutPage;