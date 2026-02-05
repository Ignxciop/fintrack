import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logger from "../lib/logger";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "./ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
    Home,
    Wallet,
    TrendingUp,
    PieChart,
    Settings,
    LogOut,
    User,
    ChevronDown,
} from "lucide-react";

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            logger.error("Error al cerrar sesión:", error);
        }
    };

    const menuItems = [
        { title: "Dashboard", icon: Home, url: "/" },
        { title: "Transacciones", icon: Wallet, url: "/transacciones" },
        { title: "Inversiones", icon: TrendingUp, url: "/inversiones" },
        { title: "Reportes", icon: PieChart, url: "/reportes" },
        { title: "Configuración", icon: Settings, url: "/configuracion" },
    ];

    const getCurrentPageTitle = () => {
        const currentItem = menuItems.find(
            (item) => item.url === location.pathname,
        );
        return currentItem?.title || "Dashboard";
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar>
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <div className="flex items-center gap-2 px-2 py-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                                        <Wallet className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            FinTrack
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Gestión financiera
                                        </span>
                                    </div>
                                </div>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {menuItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={
                                                    location.pathname ===
                                                    item.url
                                                }
                                            >
                                                <a href={item.url}>
                                                    <item.icon className="h-4 w-4" />
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
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton className="w-full">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex flex-col flex-1 text-left text-sm">
                                                <span className="font-medium">
                                                    {user?.name}{" "}
                                                    {user?.lastname}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {user?.email}
                                                </span>
                                            </div>
                                            <ChevronDown className="ml-auto h-4 w-4" />
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-[--radix-popper-anchor-width]"
                                        align="start"
                                    >
                                        <DropdownMenuLabel>
                                            Mi cuenta
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() =>
                                                navigate("/configuracion")
                                            }
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            Configuración
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="text-red-600"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Cerrar sesión
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex-1 overflow-auto">
                    <div className="border-b bg-white">
                        <div className="flex h-16 items-center px-4 gap-4">
                            <SidebarTrigger />
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {getCurrentPageTitle()}
                                </h2>
                            </div>
                            <div className="flex-1" />
                        </div>
                    </div>
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
