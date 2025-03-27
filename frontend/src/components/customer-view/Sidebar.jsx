//import { Calendar, Home, Inbox, Search, Settings, Command, Users  } from "lucide-react";
import { Home, ChevronRight, MessageSquareText, ListPlus, ChartNoAxesCombined  } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { useAuthStore } from "@/store/authStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import sidebarLogo from "../../assets/Logo.png";
// Menu items.

const items = [
    { title: 'Dashboard', url: '/dashboard/', icon: Home,},
    { title: 'Forms', url: '/forms/', icon: ListPlus,},
    { title: 'Submissions', url: '/submissions/', icon: MessageSquareText,},
    { title: 'Reports', url: '/reports/', icon: ChartNoAxesCombined,},
];

export function CustomerSidebar() {
	const { user } = useAuthStore();
	

	return (
		<Sidebar collapsible="icon" >
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
							item.items ? ( // Check if the item has sub-items
								<Collapsible
								key={item.title}
								asChild
								defaultOpen={item.isActive}
								className="group/collapsible"
								>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
									<SidebarMenuButton tooltip={item.title} >
										{item.icon && <item.icon />}
										<span>{item.title}</span>
										<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
									<SidebarMenuSub>
										{item.items.map((subItem) => (
										<SidebarMenuSubItem key={subItem.title} >
											<SidebarMenuSubButton asChild >
											<a href={subItem.url}>
												<span>{subItem.title}</span>
											</a>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
								</Collapsible>
							) : ( // Render a simple menu item for items without sub-items
								<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild>
								<a href={item.url}>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
									</a>
								</SidebarMenuButton>
								</SidebarMenuItem>
							)
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
