import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  FileText,
  ImageIcon,
  Users,
  Settings,
  Wand2,
  LogOut,
  FolderTree,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

type Item = { title: string; url: string; icon: any; exact?: boolean };
const groups: { label: string; items: Item[] }[] = [
  { label: "Geral", items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true }] },
  {
    label: "Catálogo",
    items: [
      { title: "Produtos", url: "/admin/produtos", icon: Package },
      { title: "Categorias", url: "/admin/categorias", icon: FolderTree },
      { title: "Coleções", url: "/admin/colecoes", icon: Sparkles },
      { title: "Estoque", url: "/admin/estoque", icon: Warehouse },
    ],
  },
  {
    label: "Vendas",
    items: [
      { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
      { title: "Clientes", url: "/admin/clientes", icon: Users },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { title: "Páginas", url: "/admin/paginas", icon: FileText },
      { title: "Banners", url: "/admin/banners", icon: ImageIcon },
      { title: "Construtor", url: "/admin/editor", icon: Wand2 },
    ],
  },
  { label: "Sistema", items: [{ title: "Configurações", url: "/admin/configuracoes", icon: Settings }] },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-stone-200">
      <SidebarHeader className="border-b border-stone-200 px-4 py-4">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-serif font-bold">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-base font-bold text-neutral-900">Scenzzy</span>
              <span className="text-[10px] uppercase tracking-widest text-stone-500">Admin</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-stone-200 px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ver loja">
              <Link to="/" className="flex items-center gap-2 text-xs">
                <ImageIcon className="h-4 w-4" />
                {!collapsed && <span>Ver loja</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Sair">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && user && (
          <div className="px-2 pt-2 text-[10px] text-stone-500 truncate">{user.email}</div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
