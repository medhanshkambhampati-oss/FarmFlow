import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, LandPlot, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.jsx";
import Addfarm from "./Addfarm";
import { toast } from "react-toastify";

export default function DashboardPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const url = import.meta.env.VITE_API_URL;

  const getFarms = async () => {
    try {
      const t = localStorage.getItem("token");
      if (!t) {
        toast.error("Please Login First");
        nav("/");
        return [];
      }

      const res = await fetch(`${url}/farm/getallfarmsbyid`, {
        method: "GET",
        headers: {
          token: t,
        },
      });

      const response = await res.json();

      if (res.ok) {
        return response.farms;
      } else {
        toast.error("Please Login First");
        nav("/");
        return [];
      }
    } catch (error) {
      console.log(error);
      toast.error("Server Unreachable");
      localStorage.removeItem("token");
      nav("/");
      return [];
    }
  };

  const deletefarm = async (fid) => {
    try {
      const t = localStorage.getItem("token");

      if (!t) {
        toast.error("Login First");
        nav("/");
        return;
      }

      const res = await fetch(`${url}/farm/deletebyid`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          token: t,
        },
        body: JSON.stringify({
          delfarm: fid,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Farm deleted successfully");
        loadFarms(); // refresh UI
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    }
  };

  const loadFarms = async () => {
    setLoading(true);
    const data = await getFarms();
    setFarms(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFarms();
  }, []);

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 bg-gray-950 text-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        <p className="mt-4 text-gray-400">Loading farms...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col bg-gray-950 text-gray-200 min-h-screen p-4">
      <div className="flex items-center">
        <h1 className="text-lg md:text-2xl font-semibold text-white">
          Your Farms
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <Addfarm onFarmAdded={loadFarms} />
        </div>
      </div>

      {farms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4 mt-4">
          {farms.map((farm) => (
            <Link to={`/dashboard/farm/${farm._id}`} key={farm._id}>
              <Card className="bg-gray-900 border-gray-800 hover:shadow-xl hover:bg-gray-800 transition-all duration-300 h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-medium text-white">
                    {farm.name}
                  </CardTitle>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (
                        window.confirm(
                          "Are you sure you want to delete this farm?"
                        )
                      ) {
                        deletefarm(farm._id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </button>
                </CardHeader>

                <CardContent className="flex-grow">
                  <div className="flex items-center text-sm text-gray-400 mt-2">
                    <MapPin className="mr-2 h-4 w-4 text-green-400" />
                    <span>{farm.locname}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-400 mt-2">
                    <LandPlot className="mr-2 h-4 w-4 text-green-400" />
                    <span>{farm.size} acres</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-700 shadow-sm mt-4 bg-gray-900">
          <div className="flex flex-col items-center gap-2 text-center p-8">
            <h3 className="text-2xl font-bold text-white">
              You have no farms yet
            </h3>

            <p className="text-sm text-gray-400">
              Get started by adding your first farm.
            </p>

            <div className="mt-4">
              <Addfarm onFarmAdded={loadFarms} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}