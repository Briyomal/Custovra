//import { Calendar, Home, Inbox, Search, Settings, Command, Users  } from "lucide-react";
import { Home, ChevronRight, MessageSquareText, ListPlus, ChartNoAxesCombined, Users, CreditCard } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { useAuthStore } from "@/store/authStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import sidebarLogo from "../../assets/Logo.png";
import logoWhite from "../../assets/logo-white.png";
import { useLocation } from "react-router-dom";
import { useUnreadSubmissions } from "@/hooks/useUnreadSubmissions";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";



	

// Menu items.
const items = [
  { title: 'Dashboard', url: '/dashboard/', icon: Home, },
  { title: 'Forms (Outlets)', url: '/forms/', icon: ListPlus, },
  { title: 'Feedback / Reviews', url: '/submissions/', icon: MessageSquareText, },
  { title: 'Employees', url: '/employees/', icon: Users, },
  { title: 'Reports', url: '/reports/', icon: ChartNoAxesCombined, },
  { title: 'Billing', url: '/billing/', icon: CreditCard, },
];

export function CustomerSidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const currentPath = location.pathname;
  const { unreadCount } = useUnreadSubmissions(user?._id);
  const { theme } = useTheme();

  // Find the Submissions item and add the badge if there are unread submissions
  const itemsWithBadge = items.map(item => {
    if (item.title === 'Feedback / Reviews' && unreadCount > 0) {
      return {
        ...item,
        badge: (
          <Badge className="ml-2 bg-red-600 hover:bg-red-700 text-white rounded-full h-5 px-2 text-xs">
            {unreadCount}
          </Badge>
        )
      };
    }
    return item;
  });

  return (
    <Sidebar collapsible="icon" >
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="xl" asChild className="hover:bg-gray-200 active:bg-gray-200 dark:hover:bg-gray-900 ">
              <a href="/">
                <img src={theme === "dark" ? logoWhite : sidebarLogo} alt="Custovra" className="w-32" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsWithBadge.map((item) => (
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
                          {item.badge}
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
                    <SidebarMenuButton
                      asChild
                      className={`${currentPath.startsWith(item.url) ? "font-medium bg-gradient-to-r from-[#16bf4c] to-lime-500 text-black transition-all duration-200 ease-in-out hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] hover:text-black focus:outline-none focus:ring-2 focus:ring-lime-400" : "font-medium hover:bg-gradient-to-r hover:to-[#16bf4c] hover:from-lime-500 hover:text-black transition-all duration-700 ease-in-out hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] focus:outline-none focus:ring-2 focus:ring-lime-400"
                        }`}
                    >
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge}
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