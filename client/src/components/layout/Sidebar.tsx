import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import {
  CircuitBoard,
  Home,
  Menu,
  Clock,
  Settings,
  Clipboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}

const NavItem = ({ icon, label, href, active }: NavItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          active
            ? "bg-primary-700 text-white"
            : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
        )}
      >
        <span className="mr-3">{icon}</span>
        {label}
      </a>
    </Link>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useMobile();
  
  const navigationItems = [
    {
      icon: <Home size={20} />,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: <CircuitBoard size={20} />,
      label: "Scenarios",
      href: "/scenarios",
    },
    {
      icon: <Clock size={20} />,
      label: "History",
      href: "/history",
    },
    {
      icon: <Settings size={20} />,
      label: "Settings",
      href: "/settings",
    },
  ];

  const renderContent = () => (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex items-center flex-shrink-0 px-4 py-5">
        <div className="flex items-center">
          <CircuitBoard className="h-8 w-8 text-primary-500" />
          <span className="ml-2 text-xl font-semibold text-white">CyberSim</span>
        </div>
      </div>
      
      <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href))
            }
          />
        ))}
      </nav>
      
      {user && (
        <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                <img
                  className="inline-block h-9 w-9 rounded-full"
                  src={user.avatarUrl || "https://ui-avatars.com/api/?name=" + user.username}
                  alt="Profile photo"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {user.displayName || user.username}
                </p>
                <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-800 bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {renderContent()}
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center">
          <CircuitBoard className="h-8 w-8 text-primary-500" />
          <span className="ml-2 text-xl font-semibold text-white">CyberSim</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 z-50">
      {renderContent()}
    </div>
  );
}
