import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { PlusCircle } from "lucide-react";
import { addFarm } from "@/lib/data.js";
import { useToast } from "@/hooks/use-toast.js";
import { Textarea } from "./ui/textarea.jsx";

export function AddFarmDialog({ onFarmAdded }) {
  const { toast } = useToast();
  const formRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [nit,setNit] = useState(250);

  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    setErrors({});

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const newErrors = {};
    if (!data.name) newErrors.name = ["Farm name is required."];
    if (!data.location) newErrors.location = ["Location is required."];
    if (!data.landAreaAcres || Number(data.landAreaAcres) <= 0)
      newErrors.landAreaAcres = ["Land area must be a positive number."];
    if (!data.soilType) newErrors.soilType = ["Soil type is required."];
    if (!data.climate) newErrors.climate = ["Climate is required."];
    if (!data.waterAvailability)
      newErrors.waterAvailability = ["Water availability is required."];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setPending(false);
      return;
    }

    try {
      await addFarm({
        name: data.name,
        location: data.location,
        landAreaAcres: Number(data.landAreaAcres),
        soilType: data.soilType,
        climate: data.climate,
        waterAvailability: data.waterAvailability,
      });

      toast({
        title: "Success!",
        description: "Your farm has been added.",
      });

      formRef.current?.reset();
      closeButtonRef.current?.click();
      if (onFarmAdded) onFarmAdded();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 gap-1 bg-green-500 hover:bg-green-600 text-white"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Farm
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-gray-200">

        <DialogHeader>
          <DialogTitle className="text-white">
            Add a New Farm
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Fill in the details about your new farm.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-gray-300">
              Farm Name
            </Label>

            <Input
              id="name"
              name="name"
              className="col-span-3 bg-gray-800 border-gray-700 text-white"
            />

            {errors?.name && (
              <p className="col-span-4 text-xs text-red-400 text-right">
                {errors.name}
              </p>
            )}
          </div>


          <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor="name" className="text-right text-gray-300">
              Nitrogen (Kg/ha)
            </Label>

            <Input
        id="nitrogen"
        type="range"
        min="0"
        max="700"
        value={nit}
        onChange={(e) => setNit(e.target.value)}
        className="col-span-3 bg-gray-800 border-gray-700"
      />


          <Input type="textbox" value={nit} onChange={(e)=>setNit(e.target.value)} />

            <div className="w-12 text-center bg-gray-700 text-white rounded-md py-1">
        {nit}
      </div>



          </div>



          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right text-gray-300">
              Location
            </Label>

            <Input
              id="location"
              name="location"
              className="col-span-3 bg-gray-800 border-gray-700 text-white"
            />

            {errors?.location && (
              <p className="col-span-4 text-xs text-red-400 text-right">
                {errors.location}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="landAreaAcres"
              className="text-right text-gray-300"
            >
              Area (Acres)
            </Label>

            <Input
              id="landAreaAcres"
              name="landAreaAcres"
              type="number"
              className="col-span-3 bg-gray-800 border-gray-700 text-white"
            />

            {errors?.landAreaAcres && (
              <p className="col-span-4 text-xs text-red-400 text-right">
                {errors.landAreaAcres}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="soilType" className="text-right text-gray-300">
              Soil Type
            </Label>

            <Textarea
              id="soilType"
              name="soilType"
              className="col-span-3 bg-gray-800 border-gray-700 text-white"
            />

            {errors?.soilType && (
              <p className="col-span-4 text-xs text-red-400 text-right">
                {errors.soilType}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="climate" className="text-right text-gray-300">
              Climate
            </Label>

            <Textarea
              id="climate"
              name="climate"
              className="col-span-3 bg-gray-800 border-gray-700 text-white"
            />

            {errors?.climate && (
              <p className="col-span-4 text-xs text-red-400 text-right">
                {errors.climate}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="waterAvailability"
              className="text-right text-gray-300"
            >
              Water
            </Label>

            <Textarea
              id="waterAvailability"
              name="waterAvailability"
              className="col-span-3 bg-gray-800 border-gray-700 text-white"
            />

            {errors?.waterAvailability && (
              <p className="col-span-4 text-xs text-red-400 text-right">
                {errors.waterAvailability}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                ref={closeButtonRef}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="submit"
              disabled={pending}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {pending ? "Adding Farm..." : "Add Farm"}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}