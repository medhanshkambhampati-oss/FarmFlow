import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Sprout,
  Shield,
  TrendingUp,
  Wallet,
  BarChart3,
  Leaf,
  ChevronDown,
  ChevronUp,
  MapPin,
  LandPlot,
  ChevronLeft,
  Trash2,
  Wheat,
  Gauge,
  Pencil,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx";
import { Button } from "@/components/ui/button.jsx";
import { toast } from "react-toastify";

const PROFIT_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];
const COST_COLORS = ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"];
const SAFETY_COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

// Convert internal key like 'rice_basmati' -> 'Rice Basmati'
const prettifyCrop = (name) =>
  String(name)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const CROP_VARIETY_OPTIONS = [
  "Rice (Basmati)", "Rice (Non-Basmati)", "Rice (Sona Masuri)",
  "Wheat (Common)", "Wheat (Durum)", "Wheat (Sharbati)",
  "Maize (Sweet Corn)", "Maize (Feed Corn)", "Maize (Popcorn)",
  "Millet (Pearl/Bajra)", "Millet (Finger/Ragi)", "Millet (Foxtail)", "Millet (Sorghum/Jowar)",
  "Soybean (Food Grade)", "Soybean (Oil Grade)",
];

export default function FarmDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Farm state
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState([]);
  const [addingCrop, setAddingCrop] = useState(null); // tracks which crop is being added
  const [deletingCrop, setDeletingCrop] = useState(null); // tracks which crop is being deleted
  const url = import.meta.env.VITE_API_URL;

  // ✅ EDIT STATES
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    landAreaAcres: "",
    fn: "",
    fp: "",
    fk: "",
    ph: "",
  });

  // RightSection state (lifted up, initialized after farm loads)
  const [showForm, setShowForm] = useState(false);
  const [predLoading, setPredLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [n, setN] = useState(0);
  const [p, setP] = useState(0);
  const [k, setK] = useState(0);
  const [ph, setPh] = useState(6.5);

  // Yield Prediction state
  const [showYieldForm, setShowYieldForm] = useState(false);
  const [yieldLoading, setYieldLoading] = useState(false);
  const [yieldResult, setYieldResult] = useState(null);
  const [yieldError, setYieldError] = useState("");
  const [ypCropVariety, setYpCropVariety] = useState("Rice (Basmati)");
  const [ypSeedType, setYpSeedType] = useState("Hybrid");
  const [ypIrrigationType, setYpIrrigationType] = useState("Flood");
  const [ypUseFertilizer, setYpUseFertilizer] = useState(false);
  const [ypFertN, setYpFertN] = useState(80);
  const [ypFertP, setYpFertP] = useState(40);
  const [ypFertK, setYpFertK] = useState(40);
  const [ypSoilPh, setYpSoilPh] = useState(6.5);


  const fetchCrops = async () => {
    try {
      const t = localStorage.getItem("token");
      const res = await fetch(`${url}/crop/getcrops/${id}`, {
        headers: { token: t },
      });
      const data = await res.json();
      if (data.status === "success") {
        setCrops(data.crops);
      }
    } catch (err) {
      console.error("Error fetching crops:", err);
    }
  };

  useEffect(() => {
    const loadFarm = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${url}/farm/getsinglefarm/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            token: localStorage.getItem("token"),
          },
        });

        const data = await response.json();

        if (!data || data.status !== "success") {
          navigate("/dashboard");
          return;
        }

        const farmData = data.data;

        const formattedFarm = {
          ...farmData,
          location: farmData.locname || "Unknown",
          landAreaAcres: farmData.size || 0,
          waterAvailability: farmData.humidity || "N/A",
        };

        setFarm(formattedFarm);
        // Seed slider values from farm data
        setN(farmData.fn ?? 0);
        setP(farmData.fp ?? 0);
        setK(farmData.fk ?? 0);
      } catch (err) {
        console.error("Fetch error:", err);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadFarm();
    fetchCrops();
  }, [id, navigate, url]);

  const details = useMemo(() => {
    if (!farm) return [];
    return [
      { icon: MapPin, label: "Location", value: farm.location },
      { icon: LandPlot, label: "Land Area", value: `${farm.landAreaAcres} acres`, editKey: "landAreaAcres" },
      { icon: Sprout, label: "Nitrogen (N)", value: `${farm.fn} Kg/ha`, editKey: "fn" },
      { icon: Wheat, label: "Potassium (K)", value: `${farm.fk} Kg/ha`, editKey: "fk" },
      { icon: Leaf, label: "Phosphorus (P)", value: `${farm.fp} Kg/ha`, editKey: "fp" },
      { icon: Gauge, label: "Soil pH", value: `${farm.ph ?? 7}`, editKey: "ph" },
    ];
  }, [farm]);

  // ✅ EDIT FUNCTIONS
  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      landAreaAcres: farm.landAreaAcres,
      fn: farm.fn,
      fp: farm.fp,
      fk: farm.fk,
      ph: farm.ph ?? ph,
    });
  };

  const handleChange = (key, value) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${url}/farm/updatefarm`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          farmId: id,
          n: Number(editData.fn),
          p: Number(editData.fp),
          k: Number(editData.fk),
          ph: Number(editData.ph),
          size: Number(editData.landAreaAcres),
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setFarm((prev) => ({
          ...prev,
          landAreaAcres: Number(editData.landAreaAcres),
          size: Number(editData.landAreaAcres),
          fn: Number(editData.fn),
          fp: Number(editData.fp),
          fk: Number(editData.fk),
          ph: Number(editData.ph),
        }));
        // Sync prediction sliders with new baseline values
        setN(Number(editData.fn));
        setP(Number(editData.fp));
        setK(Number(editData.fk));
        setPh(Number(editData.ph));
        setIsEditing(false);
        toast.success("Farm updated successfully");
      } else {
        toast.error(data.msg || "Update failed");
      }
    } catch {
      toast.error("Error updating farm");
    }
  };

  const handleAddCrop = async (rec) => {
    const t = localStorage.getItem("token");
    if (!t) {
      toast.error("Please Login First");
      return;
    }

    setAddingCrop(rec.crop);

    try {
      const res = await fetch(`${url}/crop/addcrop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: t,
        },
        body: JSON.stringify({ farmId: id, cname: rec.crop }),
      });

      const data = await res.json();

      if (data.status === "success") {
        toast.success(`${rec.crop} added successfully!`);
        // Refresh crops and update farm NPK values
        fetchCrops();
        // Update farm's displayed NPK
        if (data.updatedFarmNPK) {
          setFarm((prev) => ({
            ...prev,
            fn: data.updatedFarmNPK.fn,
            fp: data.updatedFarmNPK.fp,
            fk: data.updatedFarmNPK.fk,
          }));
          setN(data.updatedFarmNPK.fn);
          setP(data.updatedFarmNPK.fp);
          setK(data.updatedFarmNPK.fk);
        }
      } else {
        toast.error(data.msg || "Failed to add crop");
      }
    } catch (err) {
      console.error("Error adding crop:", err);
      toast.error("Failed to add crop. Server error.");
    } finally {
      setAddingCrop(null);
    }
  };

  const handleDeleteCrop = async (cropId) => {
    const t = localStorage.getItem("token");
    if (!t) {
      toast.error("Please Login First");
      return;
    }

    if (!confirm("Are you sure you want to delete this crop?")) return;

    setDeletingCrop(cropId);

    try {
      const res = await fetch(`${url}/crop/deletecrop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: t,
        },
        body: JSON.stringify({ cropId, farmId: id }),
      });

      const data = await res.json();

      if (data.status === "success") {
        toast.success("Crop deleted successfully!");
        // Refresh crops
        fetchCrops();
        // Update farm's displayed NPK
        if (data.updatedFarmNPK) {
          setFarm((prev) => ({
            ...prev,
            fn: data.updatedFarmNPK.fn,
            fp: data.updatedFarmNPK.fp,
            fk: data.updatedFarmNPK.fk,
          }));
          setN(data.updatedFarmNPK.fn);
          setP(data.updatedFarmNPK.fp);
          setK(data.updatedFarmNPK.fk);
        }
      } else {
        toast.error(data.msg || "Failed to delete crop");
      }
    } catch (err) {
      console.error("Error deleting crop:", err);
      toast.error("Failed to delete crop. Server error.");
    } finally {
      setDeletingCrop(null);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${url}/farm/cp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          farmId: id,
          n: Number(n),
          p: Number(p),
          k: Number(k),
          ph: Number(ph),
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setResult(data);
      } else {
        setError(data.msg || "Prediction failed");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect. Make sure both servers are running.");
    } finally {
      setPredLoading(false);
    }
  };

  const getStrategyIcon = (type) => {
    switch (type) {
      case "safest": return <Shield className="h-5 w-5" />;
      case "cheapest": return <Wallet className="h-5 w-5" />;
      case "profitable": return <TrendingUp className="h-5 w-5" />;
      default: return <Sprout className="h-5 w-5" />;
    }
  };

  const getStrategyColor = (type) => {
    switch (type) {
      case "safest":
        return {
          bg: "from-indigo-500/20 to-indigo-600/10",
          border: "border-indigo-500/40",
          text: "text-indigo-400",
          badge: "bg-indigo-500/20 text-indigo-300",
        };
      case "cheapest":
        return {
          bg: "from-amber-500/20 to-amber-600/10",
          border: "border-amber-500/40",
          text: "text-amber-400",
          badge: "bg-amber-500/20 text-amber-300",
        };
      case "profitable":
        return {
          bg: "from-emerald-500/20 to-emerald-600/10",
          border: "border-emerald-500/40",
          text: "text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300",
        };
      default:
        return {
          bg: "from-gray-500/20 to-gray-600/10",
          border: "border-gray-500/40",
          text: "text-gray-400",
          badge: "bg-gray-500/20 text-gray-300",
        };
    }
  };

  const getStrategyLabel = (type) => {
    switch (type) {
      case "safest": return "🛡️ Safest Bet";
      case "cheapest": return "💰 Lowest Investment";
      case "profitable": return "📈 Maximum Profit";
      default: return type;
    }
  };

  if (loading || !farm) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 bg-gray-950 text-gray-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        <p className="mt-4 text-gray-400">Loading farm details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gray-950 text-gray-200 min-h-screen p-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-white">{farm.name}</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-8">

          {/* ✅ FARM DETAILS CARD WITH EDIT */}
          <Card className="bg-gray-900 border-gray-800 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-green-400 hover:cursor-pointer transition"
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
            </button>

            <CardHeader>
              <CardTitle>Farm Details</CardTitle>
            </CardHeader>

            <CardContent>
              <dl className="grid md:grid-cols-2 gap-4">
                {details.map((detail) => {
                  const Icon = detail.icon;
                  return (
                    <div key={detail.label} className="flex items-start">
                      <Icon className="h-5 w-5 text-green-400 mr-3 mt-1" />
                      <div className="w-full">
                        <dt className="font-medium">{detail.label}</dt>

                        {isEditing && detail.editKey ? (
                          <input
                            type="number"
                            step={detail.editKey === "ph" ? "0.1" : "1"}
                            value={editData[detail.editKey] ?? ""}
                            onChange={(e) => handleChange(detail.editKey, e.target.value)}
                            className="text-gray-400 bg-gray-800 border border-gray-700 rounded px-2 py-1 mt-1 w-full text-sm"
                          />
                        ) : (
                          <dd className="text-gray-400">{detail.value}</dd>
                        )}
                      </div>
                    </div>
                  );
                })}
              </dl>

              {isEditing && (
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Save
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Crop History</CardTitle>
              <CardDescription>
                Crops cultivated
              </CardDescription>
            </CardHeader>

            <CardContent>
              {crops.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Crop</TableHead>
                      <TableHead>Pre NPK</TableHead>
                      <TableHead>Post NPK</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crops.map((crop) => (
                      <TableRow key={crop._id}>
                        <TableCell className="font-medium capitalize">{crop.name}</TableCell>
                        <TableCell className="text-gray-400 text-xs">
                          N:{crop.pn} P:{crop.pp} K:{crop.pk}
                        </TableCell>
                        <TableCell className="text-green-400 text-xs">
                          N:{crop.nn} P:{crop.np} K:{crop.nk}
                        </TableCell>
                        <TableCell className="text-gray-400 text-xs">
                          {new Date(crop.recordedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => handleDeleteCrop(crop._id)}
                            disabled={deletingCrop === crop._id}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 
                                       hover:bg-red-500/10 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            {deletingCrop === crop._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-400 py-6">
                  No crop history available. Use predictions to add crops.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — inlined RightSection */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg space-y-6">
            {/* Heading */}
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-400" />
                Crop Prediction
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                ML-powered recommendations based on your soil & weather data.
              </p>
            </div>

            {/* BUTTON (Initial View) */}
            {!showForm && !result && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                           transition-all duration-300 text-white font-medium py-3 rounded-lg 
                           flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
              >
                <Sprout className="h-5 w-5" />
                Start Prediction
              </button>
            )}

            {/* FORM (After Click) */}
            {showForm && !result && (
              <form onSubmit={handlePredict} className="space-y-4">
                <p className="text-xs text-gray-500">
                  Adjust soil nutrient values. Weather data is auto-fetched from
                  your farm location.
                </p>

                {/* Nitrogen */}
                <div>
                  <Label className="text-gray-300 text-sm">
                    Nitrogen (N){" "}
                    <span className="text-gray-500 font-normal">kg/ha</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="range"
                      min="0"
                      max="750"
                      value={n}
                      onChange={(e) => setN(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={n}
                      onChange={(e) => setN(Number(e.target.value))}
                      className="h-9 w-16 text-center rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Phosphorus */}
                <div>
                  <Label className="text-gray-300 text-sm">
                    Phosphorus (P){" "}
                    <span className="text-gray-500 font-normal">kg/ha</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="range"
                      min="0"
                      max="150"
                      value={p}
                      onChange={(e) => setP(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={p}
                      onChange={(e) => setP(Number(e.target.value))}
                      className="h-9 w-16 text-center rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Potassium */}
                <div>
                  <Label className="text-gray-300 text-sm">
                    Potassium (K){" "}
                    <span className="text-gray-500 font-normal">kg/ha</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="range"
                      min="0"
                      max="250"
                      value={k}
                      onChange={(e) => setK(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={k}
                      onChange={(e) => setK(Number(e.target.value))}
                      className="h-9 w-16 text-center rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* pH */}
                <div>
                  <Label className="text-gray-300 text-sm">
                    Soil pH{" "}
                    <span className="text-gray-500 font-normal">(0-14)</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="range"
                      min="0"
                      max="14"
                      step="0.1"
                      value={ph}
                      onChange={(e) => setPh(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={ph}
                      onChange={(e) => setPh(Number(e.target.value))}
                      className="h-9 w-16 text-center rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={predLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                             disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed
                             transition-all duration-300 text-white font-medium py-3 rounded-lg 
                             flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
                >
                  {predLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-5 w-5" />
                      Get Recommendations
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* RESULTS */}
            {result && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {/* Season Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-medium">
                    {result.recommendations?.season}
                  </span>
                  <button
                    onClick={() => {
                      setResult(null);
                      setShowForm(true);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
                  >
                    Re-analyze
                  </button>
                </div>

                {/* Weather & Soil Used */}
                {result.weatherUsed && (
                  <div className="bg-gray-800/60 rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Temp
                      </p>
                      <p className="text-sm text-white font-semibold">
                        {result.weatherUsed.temperature}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Humidity
                      </p>
                      <p className="text-sm text-white font-semibold">
                        {result.weatherUsed.humidity}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Rainfall
                      </p>
                      <p className="text-sm text-white font-semibold">
                        {result.weatherUsed.rainfall}mm
                      </p>
                    </div>
                  </div>
                )}

                {/* 3 Strategy Cards */}
                {["safest", "cheapest", "profitable"].map((strategy) => {
                  const rec = result.recommendations?.[strategy];
                  if (!rec) return null;
                  const colors = getStrategyColor(strategy);

                  return (
                    <div
                      key={strategy}
                      className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4 
                                 transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={colors.text}>
                          {getStrategyIcon(strategy)}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {getStrategyLabel(strategy)}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-white capitalize">
                            {prettifyCrop(rec.crop)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {rec.suitability}% match
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            Cost: ₹{(rec.cost / 1000).toFixed(0)}K
                          </p>
                          <p className={`text-sm font-semibold ${colors.text}`}>
                            Profit: ₹{(rec.profit / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <button
                          onClick={() => { handleAddCrop(rec); setShowForm(false); setResult(false) }}
                          disabled={addingCrop === rec.crop}
                          className="mt-1 text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white 
                                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {addingCrop === rec.crop ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : null}
                          Add To Crop
                        </button>
                      </div>

                      {/* Safety rating dots */}
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-[10px] text-gray-500 mr-1">
                          Safety:
                        </span>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-1.5 rounded-full ${i < rec.safety ? "bg-green-400" : "bg-gray-700"
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Toggle Charts */}
                <button
                  onClick={() => setShowCharts(!showCharts)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white 
                             transition-colors py-2 border border-gray-800 rounded-lg hover:border-gray-700"
                >
                  <BarChart3 className="h-4 w-4" />
                  {showCharts ? "Hide" : "Show"} Comparison Charts
                  {showCharts ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {/* Charts */}
                {showCharts && result.recommendations?.allCandidates && (
                  <div className="space-y-6">
                    {/* Profit Chart */}
                    <div className="bg-gray-800/40 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Profit Comparison
                        (₹/Acre)
                      </h4>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={[...result.recommendations.allCandidates].sort(
                            (a, b) => b.profit - a.profit
                          )}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="crop"
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                            axisLine={{ stroke: "#4b5563" }}
                            tickLine={false}
                            tickFormatter={prettifyCrop}
                          />
                          <YAxis
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v / 1000}K`}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                            formatter={(v) => [`₹${v.toLocaleString()}`, "Profit"]}
                          />
                          <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                            {[...result.recommendations.allCandidates]
                              .sort((a, b) => b.profit - a.profit)
                              .map((_, i) => (
                                <Cell key={i} fill={PROFIT_COLORS[i]} />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Cost Chart */}
                    <div className="bg-gray-800/40 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Investment Cost (₹/Acre)
                      </h4>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={[...result.recommendations.allCandidates].sort(
                            (a, b) => a.cost - b.cost
                          )}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="crop"
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                            axisLine={{ stroke: "#4b5563" }}
                            tickLine={false}
                            tickFormatter={prettifyCrop}
                          />
                          <YAxis
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v / 1000}K`}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                            formatter={(v) => [`₹${v.toLocaleString()}`, "Cost"]}
                          />
                          <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                            {[...result.recommendations.allCandidates]
                              .sort((a, b) => a.cost - b.cost)
                              .map((_, i) => (
                                <Cell key={i} fill={COST_COLORS[i]} />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Reliability Chart */}
                    <div className="bg-gray-800/40 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Safety Score (Suitability ×
                        Safety)
                      </h4>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={[...result.recommendations.allCandidates].sort(
                            (a, b) => b.reliability - a.reliability
                          )}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="crop"
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                            axisLine={{ stroke: "#4b5563" }}
                            tickLine={false}
                            tickFormatter={prettifyCrop}
                          />
                          <YAxis
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                            formatter={(v) => [v, "Reliability"]}
                          />
                          <Bar dataKey="reliability" radius={[6, 6, 0, 0]}>
                            {[...result.recommendations.allCandidates]
                              .sort((a, b) => b.reliability - a.reliability)
                              .map((_, i) => (
                                <Cell key={i} fill={SAFETY_COLORS[i]} />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* All Candidates Table */}
                {result.recommendations?.allCandidates && (
                  <div className="bg-gray-800/40 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">
                      All Candidates
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-700">
                            <th className="text-left py-2 pr-2">Crop</th>
                            <th className="text-right py-2 px-1">Match</th>
                            <th className="text-right py-2 px-1">Cost</th>
                            <th className="text-right py-2 pl-1">Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.recommendations.allCandidates.map((c, i) => (
                            <tr
                              key={i}
                              className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="py-2 pr-2 text-white font-medium capitalize">
                                {prettifyCrop(c.crop)}
                              </td>
                              <td className="py-2 px-1 text-right text-green-400">
                                {c.suitability}%
                              </td>
                              <td className="py-2 px-1 text-right text-gray-400">
                                ₹{(c.cost / 1000).toFixed(0)}K
                              </td>
                              <td className="py-2 pl-1 text-right text-emerald-400 font-semibold">
                                ₹{(c.profit / 1000).toFixed(0)}K
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─────────── YIELD PREDICTION SECTION ─────────── */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg space-y-5 mt-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Gauge className="h-5 w-5 text-violet-400" />
                Yield Prediction
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                ML-powered yield estimate using your crop, soil &amp; weather forecast.
              </p>
            </div>

            {/* Initial button */}
            {!showYieldForm && !yieldResult && (
              <button
                onClick={() => setShowYieldForm(true)}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700
                           transition-all duration-300 text-white font-medium py-3 rounded-lg
                           flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
              >
                <Gauge className="h-5 w-5" />
                Start Yield Prediction
              </button>
            )}

            {/* FORM */}
            {showYieldForm && !yieldResult && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setYieldLoading(true);
                  setYieldError("");
                  setYieldResult(null);
                  try {
                    const res = await fetch(`${url}/farm/yp`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        token: localStorage.getItem("token"),
                      },
                      body: JSON.stringify({
                        farmId: id,
                        crop_variety: ypCropVariety,
                        seed_type: ypSeedType,
                        irrigation_type: ypIrrigationType,
                        use_fertilizer: ypUseFertilizer,
                        fertilizer_n: ypFertN,
                        fertilizer_p: ypFertP,
                        fertilizer_k: ypFertK,
                        soil_ph: ypSoilPh,
                      }),
                    });
                    const data = await res.json();
                    if (data.status === "success") {
                      setYieldResult(data);
                    } else {
                      setYieldError(data.msg || "Yield prediction failed");
                    }
                  } catch (err) {
                    setYieldError("Failed to connect. Make sure both servers are running.");
                  } finally {
                    setYieldLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <p className="text-xs text-gray-500">
                  Fill crop details below. Weather is auto-fetched for the next 6 months.
                </p>

                {/* Crop Variety */}
                <div>
                  <Label className="text-gray-300 text-sm">Crop Variety</Label>
                  <select
                    value={ypCropVariety}
                    onChange={(e) => setYpCropVariety(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {CROP_VARIETY_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Seed Type */}
                <div>
                  <Label className="text-gray-300 text-sm">Seed Type</Label>
                  <select
                    value={ypSeedType}
                    onChange={(e) => setYpSeedType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Traditional">Traditional</option>
                    <option value="HYV">HYV (High Yield Variety)</option>
                  </select>
                </div>

                {/* Irrigation Type */}
                <div>
                  <Label className="text-gray-300 text-sm">Irrigation Type</Label>
                  <select
                    value={ypIrrigationType}
                    onChange={(e) => setYpIrrigationType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-700 bg-gray-800 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="Flood">Flood</option>
                    <option value="Rainfed">Rainfed</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Drip">Drip</option>
                  </select>
                </div>

                {/* Soil pH */}
                <div>
                  <Label className="text-gray-300 text-sm">
                    Soil pH <span className="text-gray-500 font-normal">(0–14)</span>
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="range" min="0" max="14" step="0.1"
                      value={ypSoilPh}
                      onChange={(e) => setYpSoilPh(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number" step="0.1" value={ypSoilPh}
                      onChange={(e) => setYpSoilPh(Number(e.target.value))}
                      className="h-9 w-16 text-center rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>

                {/* Fertilizer Checkbox + sliders */}
                <div className="border border-gray-700 rounded-lg p-3 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ypUseFertilizer}
                      onChange={(e) => setYpUseFertilizer(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-800 accent-violet-500 cursor-pointer"
                    />
                    <span className="text-gray-300 text-sm font-medium">Include Fertilizer Usage</span>
                  </label>
                  <p className="text-xs text-gray-500 pl-7">
                    Check to include chemical fertilizer amounts. Unchecked = no external fertilizer.
                  </p>

                  {ypUseFertilizer && (
                    <div className="space-y-3 pt-1">
                      {/* N */}
                      <div>
                        <Label className="text-gray-400 text-xs">
                          Fertilizer Nitrogen (N) <span className="text-gray-600">kg/ha</span>
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input type="range" min="0" max="200" value={ypFertN}
                            onChange={(e) => setYpFertN(Number(e.target.value))} className="flex-1" />
                          <input type="number" value={ypFertN}
                            onChange={(e) => setYpFertN(Number(e.target.value))}
                            className="h-9 w-16 text-center rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
                        </div>
                      </div>
                      {/* P */}
                      <div>
                        <Label className="text-gray-400 text-xs">
                          Fertilizer Phosphorus (P) <span className="text-gray-600">kg/ha</span>
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input type="range" min="0" max="150" value={ypFertP}
                            onChange={(e) => setYpFertP(Number(e.target.value))} className="flex-1" />
                          <input type="number" value={ypFertP}
                            onChange={(e) => setYpFertP(Number(e.target.value))}
                            className="h-9 w-16 text-center rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
                        </div>
                      </div>
                      {/* K */}
                      <div>
                        <Label className="text-gray-400 text-xs">
                          Fertilizer Potassium (K) <span className="text-gray-600">kg/ha</span>
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input type="range" min="0" max="750" value={ypFertK}
                            onChange={(e) => setYpFertK(Number(e.target.value))} className="flex-1" />
                          <input type="number" value={ypFertK}
                            onChange={(e) => setYpFertK(Number(e.target.value))}
                            className="h-9 w-16 text-center rounded-md border border-gray-700 bg-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analyze button */}
                <button
                  type="submit"
                  disabled={yieldLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700
                             disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed
                             transition-all duration-300 text-white font-medium py-3 rounded-lg
                             flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
                >
                  {yieldLoading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Gauge className="h-5 w-5" /> Analyze Yield</>
                  )}
                </button>
              </form>
            )}

            {/* Error */}
            {yieldError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{yieldError}</p>
              </div>
            )}

            {/* RESULTS */}
            {yieldResult && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full font-medium">
                    Season: {yieldResult.season}
                  </span>
                  <button
                    onClick={() => { setYieldResult(null); setShowYieldForm(true); }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline"
                  >
                    Re-analyze
                  </button>
                </div>

                {/* Big yield number */}
                <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/40 rounded-xl p-5 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Predicted Yield</p>
                  <p className="text-4xl font-bold text-white">
                    {yieldResult.yield_per_ha}
                    <span className="text-lg text-violet-300 ml-1">t/ha</span>
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Total: <span className="text-violet-300 font-semibold">{yieldResult.total_yield_tons} tons</span> for your farm
                  </p>
                </div>

                {/* Crop & farm info */}
                <div className="bg-gray-800/60 rounded-lg p-3 flex justify-between text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Variety</p>
                    <p className="text-white font-medium">{yieldResult.crop_variety}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Farm Area</p>
                    <p className="text-white font-medium">{yieldResult.farm_size_ha?.toFixed(2)} ha</p>
                  </div>
                </div>

                {/* 6-month weather used */}
                {yieldResult.weatherUsed && (
                  <div className="bg-gray-800/60 rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Temp</p>
                      <p className="text-sm text-white font-semibold">{yieldResult.weatherUsed.temp_avg}°C</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rainfall</p>
                      <p className="text-sm text-white font-semibold">{yieldResult.weatherUsed.rainfall_mm}mm</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sunshine</p>
                      <p className="text-sm text-white font-semibold">{yieldResult.weatherUsed.sunshine_hours}h/day</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Min Temp</p>
                      <p className="text-sm text-white font-semibold">{yieldResult.weatherUsed.temp_min}°C</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Max Temp</p>
                      <p className="text-sm text-white font-semibold">{yieldResult.weatherUsed.temp_max}°C</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Humidity</p>
                      <p className="text-sm text-white font-semibold">{yieldResult.weatherUsed.humidity}%</p>
                    </div>
                  </div>
                )}

                {/* Fertilizer detail */}
                {yieldResult.inputs_used?.use_fertilizer && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs">
                    <p className="text-emerald-300 font-semibold mb-1">Fertilizer Applied</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-gray-500">N</p>
                        <p className="text-white">{yieldResult.inputs_used.fertilizer_n} kg/ha</p>
                      </div>
                      <div>
                        <p className="text-gray-500">P</p>
                        <p className="text-white">{yieldResult.inputs_used.fertilizer_p} kg/ha</p>
                      </div>
                      <div>
                        <p className="text-gray-500">K</p>
                        <p className="text-white">{yieldResult.inputs_used.fertilizer_k} kg/ha</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* ─────────── END YIELD PREDICTION ─────────── */}

        </div>
      </div>
    </div>
  );
}