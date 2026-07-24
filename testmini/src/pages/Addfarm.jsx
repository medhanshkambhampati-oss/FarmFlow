import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import LocationDialog from "./LocationDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Addfarm = ({ onFarmAdded }) => {

  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [n, setN] = useState(250);
  const [p, setP] = useState(30);
  const [k, setK] = useState(200);

  const [loc, setLoc] = useState({
    name: "",
    lat: null,
    lon: null,
  });

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const nav = useNavigate();
  const url = import.meta.env.VITE_API_URL;

  // 📍 Get current location
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`
      );

      const data = await res.json();

      const name =
        data.address?.city ||
        data.address?.district ||
        data.display_name;

      setLoc({ name, lat, lon });
    });
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const t = localStorage.getItem("token");

      if (!t) {
        toast.error("Please Login first");
        nav('/');
        return;
      }

      const response = await fetch(`${url}/farm/addfarm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: t
        },
        body: JSON.stringify({
          name,
          size: area,
          n,
          p,
          k,
          locname: loc.name,
          lan: loc.lon,
          lat: loc.lat
        })
      });

      const res = await response.json();

      if (response.ok) {
        toast.success(res.mssg);

        // ✅ Close dialog
        setOpen(false);

        // ✅ Reset form
        setName("");
        setArea("");

        // ✅ Update dashboard instantly
        if (onFarmAdded) {
          onFarmAdded();
        }

      } else {
        toast.error(res.mssg);
      }

    } catch (error) {
      console.log(error);
      toast.error("Internal Server Error");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild >
          <Button className="bg-green-500 text-white cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Farm 
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-gray-900 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Farm (🌱)</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">

            <div>
              <Label>Farm Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <Label>Area (Acres)</Label>
              <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} required />
            </div>

            <div>
              <Label>Nitrogen</Label>
              <div className="flex gap-2">
                <Input type="range" min="0" max="700" value={n}
                  onChange={(e) => setN(Number(e.target.value))} />
                <input type="textbox" value={n} className="flex h-10 w-15 text-center rounded-md border border-input bg-background text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  onChange={(e) => setN(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label>Phosphorus</Label>
              <div className="flex gap-2">
                <Input type="range" min="0" max="80" value={p}
                  onChange={(e) => setP(Number(e.target.value))} />
                <input type="textbox" value={p} className="flex h-10 w-15 text-center rounded-md border border-input bg-background text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  onChange={(e) => setP(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label>Potassium</Label>
              <div className="flex gap-2">
                <Input type="range" min="0" max="900" value={k}
                  onChange={(e) => setK(Number(e.target.value))} />
                <input type="textbox" value={k} className="flex h-10 w-15 text-center rounded-md border border-input bg-background text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  onChange={(e) => setK(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input value={loc?.name || "Fetching..."} readOnly />
            </div>

            <Button
              type="button"
              onClick={() => setLocationDialogOpen(true)}
              className="bg-blue-500 cursor-pointer"
            >
              Change Location
            </Button>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="cursor-pointer">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" className="bg-green-500 cursor-pointer">
                Add Farm
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      <LocationDialog
        open={locationDialogOpen}
        setOpen={setLocationDialogOpen}
        loc={loc}
        setLoc={setLoc} 
        required
      />
    </>
  );
};

export default Addfarm;