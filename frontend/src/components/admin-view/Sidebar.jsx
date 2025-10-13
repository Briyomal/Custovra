//import { Calendar, Home, Inbox, Search, Settings, Command, Users  } from "lucide-react";
import { Home, Users, FileText, BarChart3 } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { useAuthStore } from "@/store/authStore";
import { useLocation } from "react-router-dom";
import sidebarLogo from "../../assets/Logo.png";
// Menu items.

const items = [
    { title: 'Dashboard', url: '/admin', icon: Home,},
    { title: 'Users', url: '/admin/users', icon: Users },
    { title: 'Forms', url: '/admin/forms', icon: FileText },
    { title: 'Reports', url: '/admin/reports', icon: BarChart3 },
];

export function AdminSidebar() {
	const { user } = useAuthStore();
	const location = useLocation();
	const currentPath = location.pathname;

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="py-4">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="xl" asChild className="hover:bg-gray-200 active:bg-gray-200 dark:hover:bg-gray-900 ">
							<a href="#">
								<img src={sidebarLogo} alt="Logo" className="w-32" />
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										className={`${(item.url === '/admin' && currentPath === '/admin') || (item.url !== '/admin' && currentPath.startsWith(item.url)) ? "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 text-white font-medium" : ""}`}
									>
										<a href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}