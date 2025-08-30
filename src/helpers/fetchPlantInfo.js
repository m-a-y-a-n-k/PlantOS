import plantApiService from './plantApiService';

// Enhanced plant information fetcher with multiple API sources
export async function fetchPlantInfo(plantLabel, capturedImage = null) {
  try {
    // If we have a captured image, use it for better identification
    if (capturedImage) {
      const result = await plantApiService.identifyPlant(capturedImage, plantLabel);
      return result;
    }
    
    // Otherwise, just get care information based on the label
    const result = await plantApiService.getPlantCareInfo(plantLabel);
    return result;
    
  } catch (error) {
    console.error('Plant info fetch failed:', error);
    
    // Return fallback information
    return plantApiService.getFallbackPlantInfo(plantLabel);
  }
}

// Legacy function for backward compatibility
export async function fetchPlantInfoLegacy(plantLabel) {
  try {
    // Try the old Trefle API approach as a fallback
    const token = await getToken();
    const response = await fetch(
      `https://trefle.io/api/v1/plants?token=${token}&q=${encodeURIComponent(plantLabel)}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Trefle API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const plant = data.data[0];
      return {
        label: plant.common_name || plant.scientific_name,
        scientificName: plant.scientific_name,
        description: `${plant.family_common_name || plant.family} family plant`,
        family: plant.family,
        genus: plant.genus,
        image: plant.image_url,
        source: 'Trefle'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Trefle API failed:', error);
    return null;
  }
}

async function getToken() {
  const params = {
    origin: window.location.origin,
    token: process.env.REACT_APP_TREFLE_TOKEN,
  };
  
  try {
    const response = await fetch("https://trefle.io/api/auth/claim", {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }
    
    const { token } = await response.json();
    return token;
  } catch (error) {
    console.error('Token generation failed:', error);
    throw error;
  }
}
