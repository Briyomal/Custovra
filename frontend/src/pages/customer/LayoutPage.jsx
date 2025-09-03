//import { Outlet } from 'react-router-dom';

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

function CustomerLayoutPage({ children }) {

	const { user } = useAuthStore();

	const { setTheme } = useTheme();
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
									<BreadcrumbItem className="hidden md:block">
										<BreadcrumbLink href="#"></BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator className="hidden md:block" />
									<BreadcrumbItem>
										<BreadcrumbPage></BreadcrumbPage>
									</BreadcrumbItem>
								</BreadcrumbList>
							</Breadcrumb>
						</div>
						{/* Right-aligned content */}
						<div className="ml-auto flex items-center gap-4">
							{/* Usage Indicators */}
							<UsageIndicators />
							{user.payment ? (
								<Badge
									className={`mr-3 px-3 py-1 rounded-sm text-white text-sm ${user.payment.plan === 'Premium'
											? 'bg-gradient-to-r from-green-700 to-lime-500 border-lime-300 dark:border-green-700'
											: user.payment.plan === 'Standard'
												? 'bg-gradient-to-r from-purple-700 to-fuchsia-500 border-fuchsia-300 dark:border-purple-700'
												: user.payment.plan === 'Basic'
													? 'bg-gradient-to-r from-blue-700 to-cyan-500 border-cyan-300 dark:border-blue-700'
													: 'bg-gradient-to-r from-stone-700 to-gray-500 border-gray-300 dark:border-stone-700'
										}`}
								>
									{user.payment.plan}
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
