import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  MapContainer, TileLayer, Marker,
  useMapEvents, useMap
} from "react-leaflet";

import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";

// 🔥 FIX MARKER ICON ISSUE
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 🔥 FIX MAP SIZE ISSUE
const FixMapSize = () => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);

  return null;
};

const LocationDialog = ({ open, setOpen, loc, setLoc }) => {

  const [tempLoc, setTempLoc] = useState(loc);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTempLoc(loc);
  }, [loc]);

  const MapClickHandler = () => {
    useMapEvents({
      async click(e) {
        const { lat, lng } = e.latlng;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
        );
        const data = await res.json();

        const name =
          data.address?.city ||
          data.address?.district ||
          data.display_name;

        setTempLoc({
          name,
          lat,
          lon: lng,
        });
      },
    });

    return null;
  };

  // 🔍 Search
  const handleSearch = async () => {
    if (!search) return;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${search}&accept-language=en`
    );

    const data = await res.json();

    if (data.length === 0) {
      toast.warning("Location not found");
      return;
    }

    const place = data[0];

    setTempLoc({
      name: place.display_name,
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
    });
  };

  const confirmLocation = () => {
    setLoc(tempLoc);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-900 text-white max-w-lg overflow-hidden">

        <DialogHeader>
          <DialogTitle>Select Location</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {/* Map */}
        <MapContainer
          key={`${tempLoc?.lat}-${tempLoc?.lon}`}
          center={[tempLoc?.lat || 16.5, tempLoc?.lon || 80.6]}
          zoom={13}
          style={{ height: "300px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker
            position={[
              tempLoc?.lat || 16.5,
              tempLoc?.lon || 80.6
            ]}
          />

          <MapClickHandler />
          <FixMapSize />
        </MapContainer>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button onClick={confirmLocation}>
            Confirm Location
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default LocationDialog;