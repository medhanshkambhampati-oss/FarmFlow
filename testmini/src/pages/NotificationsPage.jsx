import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sprout,
  Droplets,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";

export default function NotificationsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const t = localStorage.getItem("token");
        const res = await fetch(`${url}/farm/getallfarmsbyid`, {
          headers: { token: t },
        });
        const data = await res.json();
        if (data.status === "success" && data.farms) {
          setFarms(data.farms);
        }
      } catch (err) {
        console.error("Error fetching farms for notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFarms();
  }, [url]);

  // Generate notifications based on farm data
  const generateNotifications = () => {
    const notifications = [];

    farms.forEach((farm) => {
      // Low Nitrogen warning
      if (farm.fn !== undefined && farm.fn < 30) {
        notifications.push({
          id: `low-n-${farm._id}`,
          type: "warning",
          icon: AlertTriangle,
          title: `Low Nitrogen in ${farm.name}`,
          message: `Nitrogen level is ${farm.fn} kg/ha — below recommended threshold (30 kg/ha). Consider adding nitrogen-rich fertilizers.`,
          farmId: farm._id,
          time: "Based on current NPK",
          color: "text-amber-400",
          bg: "bg-amber-500/10 border-amber-500/20",
        });
      }

      // Low Phosphorus warning
      if (farm.fp !== undefined && farm.fp < 10) {
        notifications.push({
          id: `low-p-${farm._id}`,
          type: "warning",
          icon: Droplets,
          title: `Low Phosphorus in ${farm.name}`,
          message: `Phosphorus level is ${farm.fp} kg/ha — below recommended threshold (10 kg/ha). Apply phosphorus supplements.`,
          farmId: farm._id,
          time: "Based on current NPK",
          color: "text-orange-400",
          bg: "bg-orange-500/10 border-orange-500/20",
        });
      }

      // Low Potassium warning
      if (farm.fk !== undefined && farm.fk < 20) {
        notifications.push({
          id: `low-k-${farm._id}`,
          type: "warning",
          icon: TrendingDown,
          title: `Low Potassium in ${farm.name}`,
          message: `Potassium level is ${farm.fk} kg/ha — below recommended threshold (20 kg/ha). Consider potassium-rich amendments.`,
          farmId: farm._id,
          time: "Based on current NPK",
          color: "text-red-400",
          bg: "bg-red-500/10 border-red-500/20",
        });
      }

      // Healthy soil notification
      if (
        farm.fn !== undefined &&
        farm.fn >= 30 &&
        farm.fp !== undefined &&
        farm.fp >= 10 &&
        farm.fk !== undefined &&
        farm.fk >= 20
      ) {
        notifications.push({
          id: `healthy-${farm._id}`,
          type: "success",
          icon: CheckCircle2,
          title: `${farm.name} — Soil Healthy`,
          message: `NPK levels are within normal range (N:${farm.fn}, P:${farm.fp}, K:${farm.fk}). Your farm is in good shape!`,
          farmId: farm._id,
          time: "Based on current NPK",
          color: "text-green-400",
          bg: "bg-green-500/10 border-green-500/20",
        });
      }

      // No crops planted
      if (!farm.crops || farm.crops.length === 0) {
        notifications.push({
          id: `no-crops-${farm._id}`,
          type: "info",
          icon: Sprout,
          title: `No crops in ${farm.name}`,
          message: `You haven't added any crops yet. Run a prediction and add your first crop!`,
          farmId: farm._id,
          time: "Suggestion",
          color: "text-blue-400",
          bg: "bg-blue-500/10 border-blue-500/20",
        });
      }
    });

    // Sort: warnings first, then info, then success
    const priority = { warning: 0, info: 1, success: 2 };
    notifications.sort((a, b) => priority[a.type] - priority[b.type]);

    return notifications;
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 bg-gray-950 text-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        <p className="mt-4 text-gray-400">Loading notifications...</p>
      </div>
    );
  }

  const notifications = generateNotifications();

  return (
    <div className="space-y-6 bg-gray-950 text-gray-200 min-h-screen p-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-green-400" />
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          {notifications.length > 0 && (
            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-medium">
              {notifications.length}
            </span>
          )}
        </div>
        <p className="text-gray-400 mt-1">
          Smart alerts based on your farm's soil health and crop status.
        </p>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <Card
                key={notif.id}
                className={`border ${notif.bg} bg-gray-900 transition-all duration-200 hover:scale-[1.01]`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-2 rounded-lg ${notif.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${notif.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {notif.title}
                        </h3>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {notif.message}
                      </p>
                      {notif.farmId && (
                        <Link
                          to={`/dashboard/farm/${notif.farmId}`}
                          className="inline-block mt-2 text-xs text-green-400 hover:text-green-300 underline transition-colors"
                        >
                          View Farm →
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">
              All caught up!
            </h3>
            <p className="text-gray-400 text-sm text-center">
              No notifications right now. Add farms and crops to get smart
              alerts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
