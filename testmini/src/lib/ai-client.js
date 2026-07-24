/**
 * Client-side AI crop recommendation.
 * 
 * This replaces the server-side Genkit flow with a client-side stub.
 * In a production app, this would call your backend API endpoint instead.
 * 
 * To connect to a real backend, replace the mock logic below with:
 *   const response = await fetch('/api/recommend', { method: 'POST', body: JSON.stringify(input) });
 *   return response.json();
 */
export async function cropRecommendation(input) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate mock recommendations based on farm data
  const cropSuggestions = getCropSuggestions(input);

  return {
    recommendedCrops: cropSuggestions,
    generalAdvice: generateAdvice(input),
  };
}

function getCropSuggestions(input) {
  const soilLower = (input.soilType || '').toLowerCase();
  const climateLower = (input.climateData || '').toLowerCase();
  const waterLower = (input.waterAvailability || '').toLowerCase();

  const crops = [];

  // Soil-based suggestions
  if (soilLower.includes('loam') || soilLower.includes('clay')) {
    crops.push({
      cropName: 'Corn (Maize)',
      reason: `Loamy and clay-rich soils in ${input.location} are excellent for corn cultivation. The soil retains moisture well while providing adequate drainage, which corn requires for optimal root development.`,
      optimalConditions: 'Requires well-drained loamy soil with pH 6.0-6.8, temperatures between 60-95°F during growing season, and consistent moisture especially during silking and grain fill stages.',
      estimatedYieldPotential: `High - approximately 180-220 bushels per acre on ${input.landAreaAcres} acres with proper management and irrigation.`,
    });
  }

  if (soilLower.includes('sandy') || soilLower.includes('loam')) {
    crops.push({
      cropName: 'Soybeans',
      reason: `The soil conditions at ${input.name || input.farmName} are well-suited for soybeans. This legume also fixes nitrogen in the soil, improving fertility for subsequent crops and making it an excellent rotation choice.`,
      optimalConditions: 'Thrives in well-drained soils with pH 6.0-7.0. Requires moderate water during flowering and pod development. Tolerates various soil types but prefers loamy textures.',
      estimatedYieldPotential: `Moderate to High - estimated 45-60 bushels per acre, contributing to soil health through nitrogen fixation.`,
    });
  }

  // Climate-based suggestions
  if (climateLower.includes('temperate') || climateLower.includes('continental')) {
    crops.push({
      cropName: 'Winter Wheat',
      reason: `The ${input.climateData || 'temperate'} climate in ${input.location} provides the cold vernalization period that winter wheat requires. This crop can use residual soil moisture efficiently.`,
      optimalConditions: 'Requires vernalization (cold period of 30-60 days below 40°F), moderate rainfall during spring growth, and dry conditions during harvest. Optimal soil pH 6.0-7.0.',
      estimatedYieldPotential: `Moderate - approximately 50-70 bushels per acre with proper fertilization and pest management.`,
    });
  }

  if (climateLower.includes('arid') || climateLower.includes('dry') || waterLower.includes('limited')) {
    crops.push({
      cropName: 'Sorghum',
      reason: `Sorghum is highly drought-tolerant and ideal for the ${input.climateData || 'semi-arid'} conditions. It requires significantly less water than corn while still providing good grain yields.`,
      optimalConditions: 'Tolerates drought well, requires soil temperatures above 60°F for germination. Grows in various soil types with pH 5.5-7.5. Needs only 15-20 inches of rainfall during growing season.',
      estimatedYieldPotential: `Moderate - approximately 70-100 bushels per acre, with excellent drought resilience providing consistent yields even in dry years.`,
    });
  }

  // Default if no specific matches
  if (crops.length === 0) {
    crops.push(
      {
        cropName: 'Vegetables (Mixed)',
        reason: `Given the conditions at ${input.farmName}, a diverse vegetable farm operation could maximize returns per acre. Consider tomatoes, peppers, and leafy greens for local market sales.`,
        optimalConditions: 'Requires well-amended soil rich in organic matter, consistent irrigation, and protection from extreme weather. Raised beds recommended for improved drainage.',
        estimatedYieldPotential: `Variable - depends on specific crops chosen. Expected $5,000-$15,000 revenue per acre for high-value vegetables.`,
      },
      {
        cropName: 'Cover Crops (Clover/Rye)',
        reason: `Planting cover crops will improve soil health, prevent erosion, and build organic matter. This is especially important for long-term farm sustainability.`,
        optimalConditions: 'Minimal inputs required. Plant after harvest of main crop. Crimson clover fixes nitrogen while cereal rye provides excellent ground cover.',
        estimatedYieldPotential: `Not harvested for yield - instead provides $50-100/acre equivalent in soil health benefits and reduced input costs for following crops.`,
      }
    );
  }

  // Ensure at least 2 recommendations
  if (crops.length < 2) {
    crops.push({
      cropName: 'Alfalfa',
      reason: `Alfalfa is a versatile forage crop that fixes nitrogen, improves soil structure, and provides high-quality feed. It works well in rotation with grain crops on ${input.farmName}.`,
      optimalConditions: 'Deep-rooted perennial that requires well-drained soil with pH 6.5-7.5. Once established, it is relatively drought-tolerant and can produce 3-5 cuttings per year.',
      estimatedYieldPotential: `Moderate - 4-8 tons of hay per acre annually, with stand life of 3-5 years. Current alfalfa hay prices range from $200-$300 per ton.`,
    });
  }

  return crops.slice(0, 3);
}

function generateAdvice(input) {
  const adviceParts = [];

  adviceParts.push(`Based on the analysis of ${input.farmName} (${input.landAreaAcres} acres in ${input.location}), here are some general recommendations:`);

  if (input.previousCrops && input.previousCrops.length > 0) {
    adviceParts.push(`Since you've previously grown ${input.previousCrops.join(', ')}, consider implementing a robust crop rotation strategy to prevent soil nutrient depletion and reduce pest pressure.`);
  }

  adviceParts.push('Regular soil testing (at least annually) is recommended to monitor pH levels, nutrient content, and organic matter percentage.');
  adviceParts.push('Consider implementing precision agriculture techniques such as variable rate fertilization and GPS-guided planting to optimize input costs and yields.');
  adviceParts.push('Maintain records of all inputs, yields, and weather patterns to make data-driven decisions for future seasons.');

  return adviceParts.join(' ');
}
