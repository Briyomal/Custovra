//import { Calendar, Home, Inbox, Search, Settings, Command, Users  } from "lucide-react";
import { Home, Command, FormInput, ChevronRight  } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { useAuthStore } from "@/store/authStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
// Menu items.

const items = [
    { title: 'Dashboard', url: '/dashboard/', icon: Home,},
    { title: 'Forms', url: '/forms/', icon: FormInput,},
	/*
	{
		title: "Form",
		url: "#",
		icon: FormInput,
		items: [
		  {
			title: "Create Form",
			url: "/forms/create",
		  },
		  {
			title: "View Forms",
			url: "/forms/view",
		  },
		  {
			title: "Quantum",
			url: "#",
		  },
		],
	  },
	  */
];

export function CustomerSidebar() {
	const { user } = useAuthStore();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="#">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<Command className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">Acme Inc</span>
									<span className="truncate text-xs">Enterprise</span>
								</div>
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
									<SidebarMenuButton tooltip={item.title}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
										<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
									<SidebarMenuSub>
										{item.items.map((subItem) => (
										<SidebarMenuSubItem key={subItem.title}>
											<SidebarMenuSubButton asChild>
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
