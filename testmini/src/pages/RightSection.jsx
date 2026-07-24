import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  TvMinimal,
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
import { toast } from "react-toastify";

const PROFIT_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];
const COST_COLORS = ["#f59e0b", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7"];
const SAFETY_COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

function RightSection({n: initialN, p: initialP, k: initialK}) {
  const { id: farmId } = useParams();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showCharts, setShowCharts] = useState(false);

  const [n, setN] = useState(initialN);
  const [p, setP] = useState(initialP);
  const [k, setK] = useState(initialK);
  const [ph, setPh] = useState(6.5);

  const url = import.meta.env.VITE_API_URL;

  const handleAddCrop = async(rec) => {
    console.log(rec)
    const t = localStorage.getItem("token");
    if(!t){
      toast.error("Please Login First");
    }
    const response = await fetch(`${url}/crop/addcrop`,{
      method:"POST",
      headers:{
        "Content-Type": "application/json",
        "token": t
      },
      body:JSON.stringify({"cname":rec.crop})
    })
    const res = await response.json();
    if(response.ok){

    }else{
      
    }
  }

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
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
          farmId,
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
      setLoading(false);
    }
  };

  const getStrategyIcon = (type) => {
    switch (type) {
      case "safest":
        return <Shield className="h-5 w-5" />;
      case "cheapest":
        return <Wallet className="h-5 w-5" />;
      case "profitable":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Sprout className="h-5 w-5" />;
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
      case "safest":
        return "🛡️ Safest Bet";
      case "cheapest":
        return "💰 Lowest Investment";
      case "profitable":
        return "📈 Maximum Profit";
      default:
        return type;
    }
  };

  useEffect(() => {
  setN(initialN);
  setP(initialP);
  setK(initialK);
}, [initialN, initialP, initialK]);

  return (
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
                  max="200"
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
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                         disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed
                         transition-all duration-300 text-white font-medium py-3 rounded-lg 
                         flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
            >
              {loading ? (
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
                        {rec.crop}
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
                      onClick={() => handleAddCrop(rec)}
                      className="mt-1 text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white"
                    >Add To Crop</button>
                  </div>

                  {/* Safety rating dots */}
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] text-gray-500 mr-1">
                      Safety:
                    </span>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${
                          i < rec.safety ? "bg-green-400" : "bg-gray-700"
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
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        axisLine={{ stroke: "#4b5563" }}
                        tickLine={false}
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
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        axisLine={{ stroke: "#4b5563" }}
                        tickLine={false}
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
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        axisLine={{ stroke: "#4b5563" }}
                        tickLine={false}
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
                  All Top 5 Candidates
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
                            {c.crop}
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
    </div>
  );
}

export default RightSection;