import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
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
import {
    Home,
    Wallet,
    Settings,
    LogOut,
    User,
    ChevronDown,
    Moon,
    Sun,
    CreditCard,
    ArrowLeftRight,
    Repeat,
    PiggyBank,
    Calendar,
} from "lucide-react";

export default function MainLayout() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/login";
        } catch (error) {
            logger.error("Error al cerrar sesión:", error);
        }
    };

    const menuItems = [
        { title: "Dashboard", icon: Home, url: "/" },
        { title: "Cuentas", icon: CreditCard, url: "/cuentas" },
        { title: "Movimientos", icon: ArrowLeftRight, url: "/movimientos" },
        { title: "Recurrentes", icon: Repeat, url: "/recurrentes" },
        { title: "Presupuestos", icon: PiggyBank, url: "/presupuestos" },
        { title: "Calendario", icon: Calendar, url: "/calendario" },
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
                                                <Link to={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
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
                                        <SidebarMenuButton className="w-full h-auto py-2">
                                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <div className="flex flex-col flex-1 text-left text-sm gap-0.5">
                                                <span className="font-medium leading-tight">
                                                    {user?.name}{" "}
                                                    {user?.lastname}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate leading-tight">
                                                    {user?.email}
                                                </span>
                                            </div>
                                            <ChevronDown className="ml-auto h-4 w-4" />
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="w-[--radix-dropdown-menu-trigger-width]"
                                        align="start"
                                        side="top"
                                        sideOffset={4}
                                    >
                                        <DropdownMenuLabel>
                                            Mi cuenta
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={toggleTheme}>
                                            {theme === "light" ? (
                                                <Moon className="mr-2 h-4 w-4" />
                                            ) : (
                                                <Sun className="mr-2 h-4 w-4" />
                                            )}
                                            {theme === "light"
                                                ? "Modo oscuro"
                                                : "Modo claro"}
                                        </DropdownMenuItem>
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

                <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950">
                    <div className="border-b bg-white dark:bg-slate-900/50 dark:border-blue-900/30">
                        <div className="flex h-16 items-center px-4 gap-4">
                            <SidebarTrigger />
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
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
