import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { LogOut, User } from "lucide-react";

export function UserNav({ name, email }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  // Get initials for avatar fallback
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full bg-gray-800 hover:bg-gray-700 transition"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=22c55e&color=fff&size=40`}
              alt={name || "User"}
            />
            <AvatarFallback className="bg-green-500 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 bg-gray-900 border border-gray-800 text-gray-200 shadow-xl"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-white">{name || "User"}</p>
            <p className="text-xs text-gray-400">
              {email || "No email"}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-800" />

        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:bg-gray-800 cursor-pointer">
            <User className="mr-2 h-4 w-4 text-green-400" />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-gray-800" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="hover:bg-red-500/20 text-red-400 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}