import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/logo.jsx";
import { UserNav } from "@/components/user-nav.jsx";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar({ fsl, fsr }) {

  const nav = useNavigate();
  const l = localStorage.getItem("token");
  const url = import.meta.env.VITE_API_URL;

  const [profile, setProfile] = useState({ name: "", email: "" });

  useEffect(() => {
    if (l) {
      // Try localStorage first (set during login)
      const cachedName = localStorage.getItem("userName");
      const cachedEmail = localStorage.getItem("userEmail");
      if (cachedName && cachedEmail) {
        setProfile({ name: cachedName, email: cachedEmail });
        return;
      }
      // Fallback: fetch from API
      const fetchProfile = async () => {
        try {
          const res = await fetch(`${url}/farmer/profile`, {
            headers: { token: l },
          });
          const data = await res.json();
          if (data.status === "success") {
            setProfile({ name: data.name, email: data.email });
            localStorage.setItem("userName", data.name);
            localStorage.setItem("userEmail", data.email);
          }
        } catch (err) {
          console.log("Failed to fetch profile", err);
        }
      };
      fetchProfile();
    }
  }, [l, url]);

  return (
    <header className="pt-10 sticky top-0 flex h-16 items-center bg-gray-9 backdrop-blur-sm px-4 md:px-6 z-50">

      <nav className="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 w-full">

        <Link
          to="/dashboard"
          className="pl-10 flex items-center gap-2 text-lg font-semibold md:text-base text-white"
        >
          <Logo className="h-9 w-9 text-green-400" />
          <span className="font-headline">FarmFlow</span>
        </Link>

        {l ? (

          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">

            <div className="ml-auto flex-1 sm:flex-initial"></div>

            {/* Notifications Icon */}
            <Link
              to="/dashboard/notifications"
              className="relative p-2 rounded-full hover:bg-gray-800 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-300 hover:text-white transition-colors" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-green-400 rounded-full"></span>
            </Link>

            <UserNav name={profile.name} email={profile.email} />

          </div>

        ) : (

          <div className="pr-10 flex w-full items-center gap-4 md:ml-auto">

            <div className="ml-auto flex gap-4">

              <button
                onClick={() => nav('/login')}
                className="cursor-pointer px-4 py-2 border border-green-400 text-green-400 rounded-lg hover:bg-green-400 hover:text-black transition"
              >
                Login
              </button>

              <button
                onClick={() => nav('/register')}
                className="cursor-pointer px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition"
              >
                Register
              </button>

            </div>

          </div>

        )}

      </nav>

    </header>
  );
}