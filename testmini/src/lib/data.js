// Mock data
let farms = [
  {
    id: '1',
    name: 'Green Valley Farms',
    location: 'California, USA',
    landAreaAcres: 150,
    soilType: 'Loamy',
    climate: 'Temperate',
    waterAvailability: 'Good irrigation system',
    previousCrops: [
      { id: 'c1', name: 'Corn', year: 2023 },
      { id: 'c2', name: 'Soybeans', year: 2022 },
    ],
  },
  {
    id: '2',
    name: 'Sunrise Meadows',
    location: 'Iowa, USA',
    landAreaAcres: 300,
    soilType: 'Silty clay loam',
    climate: 'Continental',
    waterAvailability: 'Rain-fed with backup well',
    previousCrops: [
      { id: 'c3', name: 'Wheat', year: 2023 },
      { id: 'c4', name: 'Alfalfa', year: 2022 },
    ],
  },
  {
    id: '3',
    name: 'Golden Fields',
    location: 'Kansas, USA',
    landAreaAcres: 500,
    soilType: 'Sandy loam',
    climate: 'Semi-arid',
    waterAvailability: 'Limited, center-pivot irrigation',
    previousCrops: [{ id: 'c5', name: 'Sorghum', year: 2023 }],
  },
];

export async function getFarms() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return farms;
}

export const getFarmById = async (id) => {
  try {
    const response = await fetch(`http://localhost:5000/farm/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "id": localStorage.getItem("farmerId"), // 👈 important (auth)
      },
    });

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};

export async function addFarm(farmData) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  const newFarm = {
    ...farmData,
    id: (farms.length + 1).toString(),
    previousCrops: [],
  };
  farms.push(newFarm);
  return newFarm;
}
