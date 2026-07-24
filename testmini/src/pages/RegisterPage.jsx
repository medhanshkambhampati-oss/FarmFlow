import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Logo } from "@/components/logo.jsx";
import { useState } from "react";
import { toast } from "react-toastify";

export default function RegisterPage({setSr}) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const url = import.meta.env.VITE_API_URL;

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${url}/farmer/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, pass }),
      });

      const response = await res.json();

      if (res.ok) {
        if (response.status === "success") {
          toast.success(response.mssg);
          navigate("/login");
        } else {
          toast.error(response.mssg);
        }
        setName("");
        setEmail("");
        setPass("");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server not reachable");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${url}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4" onMouseDown={()=>navigate('/')}>

      <Card className="w-full max-w-sm backdrop-blur bg-black/40 border-gray-800 text-gray-200 shadow-xl rounded-xl" onMouseDown={(e)=>e.stopPropagation()}>

        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center items-center gap-2">
            <Logo className="h-8 w-8 text-green-500" />
            <CardTitle className="text-2xl font-bold text-white">
              FarmFlow
            </CardTitle>
          </div>

          <CardDescription className="text-gray-400">
            Create an account to manage your farms
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="fullname" className="font-bold text-gray-300">
                Full Name
              </Label>

              <Input
                id="fullname"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-gray-300">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-gray-300">
                Password
              </Label>

              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              Create an account
            </Button>

            {/* OR Divider */}
            <div className="flex items-center my-1 pb-3">
              <div className="flex-grow h-px bg-gray-700"></div>
              <span className="px-3 text-gray-400 text-sm">OR</span>
              <div className="flex-grow h-px bg-gray-700"></div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="h-5 w-5"
              >
                <path fill="#EA4335" d="M24 9.5c3.2 0 6.1 1.1 8.3 3.3l6.2-6.2C34.5 2.5 29.6 0 24 0 14.6 0 6.6 5.5 2.7 13.5l7.3 5.7C12 13.2 17.5 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.7-.4-3.9H24v7.4h12.8c-.3 1.9-1.9 4.8-5.3 6.7l8.1 6.3c4.7-4.4 7.4-10.9 7.4-16.5z"/>
                <path fill="#FBBC05" d="M10 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.3-5.7C1 17 0 20.4 0 24s1 7 2.7 10.4l7.3-5.7z"/>
                <path fill="#34A853" d="M24 48c6.6 0 12.1-2.2 16.1-6l-8.1-6.3c-2.2 1.5-5.1 2.6-8 2.6-6.5 0-12-3.7-14-9l-7.3 5.7C6.6 42.5 14.6 48 24 48z"/>
              </svg>

              Sign in with Google
            </Button>

          </form>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="ml-1 text-green-400 hover:text-green-300"
          >
            Sign in
          </Link>
        </CardFooter>

      </Card>

    </div>
  );
}