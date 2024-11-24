//import { Outlet } from 'react-router-dom';

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { CustomerSidebar } from "@/components/customer-view/Sidebar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

function CustomerLayoutPage({ children }) {
	//console.log("Menu items received:", sidebarMenuItems); // This line is for debugging

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
										<BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator className="hidden md:block" />
									<BreadcrumbItem>
										<BreadcrumbPage>Data Fetching</BreadcrumbPage>
									</BreadcrumbItem>
								</BreadcrumbList>
							</Breadcrumb>
						</div>

						{/* Right-aligned dropdown */}
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
					</header>

					<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}

export default CustomerLayoutPage;
