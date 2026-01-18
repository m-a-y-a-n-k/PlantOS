import { PlantDetails, ApiKeys, BaseUrls, CachedData } from '../types/plant';

// Enhanced Plant API Service with multiple providers
class PlantApiService {
  private apiKeys: ApiKeys;
  private baseUrls: BaseUrls;
  private cache: Map<string, CachedData<any>>;
  private cacheTimeout: number;

  constructor() {
    this.apiKeys = {
      plantId: process.env.REACT_APP_PLANT_ID_API_KEY,
      perenual: process.env.REACT_APP_PERENUAL_API_KEY,
      plantNet: process.env.REACT_APP_PLANTNET_API_KEY
    };
    
    this.baseUrls = {
      plantId: 'https://api.plant.id/v3',
      perenual: 'https://perenual.com/api',
      plantNet: 'https://my-api.plantnet.org/v1',
      trefle: 'https://trefle.io/api/v1'
    };
    
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Convert base64 image to blob for API upload
  base64ToBlob(base64String: string): Blob {
    const byteCharacters = atob(base64String.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/jpeg' });
  }

  // Plant.id API - Most accurate for plant identification
  async identifyWithPlantId(base64Image: string): Promise<PlantDetails | null> {
    if (!this.apiKeys.plantId) {
      throw new Error('Plant.id API key not configured');
    }

    const blob = this.base64ToBlob(base64Image);
    const formData = new FormData();
    
    formData.append('images', blob);
    // Plant.id v3 parameters (Kindwise). These enable meaningful health stats.
    // Note: multipart/form-data values are strings.
    formData.append('language', 'en');
    formData.append('health', 'all'); // include identification + health assessment
    formData.append('disease_level', 'all');
    formData.append('symptoms', 'true');
    formData.append('similar_images', 'true');
    formData.append(
      'details',
      [
        'common_names',
        'url',
        'description',
        'taxonomy',
        'rank',
        'gbif_id',
        'inaturalist_id',
        'image',
        'synonyms',
        'edible_parts',
        'watering',
        'propagation_methods',
      ].join(',')
    );
    formData.append(
      'disease_details',
      ['common_names', 'classification', 'description', 'treatment', 'local_name'].join(',')
    );

    try {
      const response = await fetch(`${this.baseUrls.plantId}/identify`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKeys.plantId,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Plant.id API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatPlantIdResponse(data);
    } catch (error) {
      console.error('Plant.id identification failed:', error);
      throw error;
    }
  }

  // Perenual API - Good for plant care information
  async getPlantCareInfo(plantName: string): Promise<PlantDetails | null> {
    if (!this.apiKeys.perenual) {
      console.warn('Perenual API key not configured, using fallback data');
      return this.getFallbackPlantInfo(plantName);
    }

    const cacheKey = `perenual_${plantName}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const searchResponse = await fetch(
        `${this.baseUrls.perenual}/species-list?key=${this.apiKeys.perenual}&q=${encodeURIComponent(plantName)}`
      );

      if (!searchResponse.ok) {
        throw new Error(`Perenual search error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      if (searchData.data && searchData.data.length > 0) {
        const plantId = searchData.data[0].id;
        
        const detailResponse = await fetch(
          `${this.baseUrls.perenual}/species/details/${plantId}?key=${this.apiKeys.perenual}`
        );

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          const formatted = this.formatPerenualResponse(detailData);
          this.setCachedData(cacheKey, formatted);
          return formatted;
        }
      }

      return this.getFallbackPlantInfo(plantName);
    } catch (error) {
      console.error('Perenual API failed:', error);
      return this.getFallbackPlantInfo(plantName);
    }
  }

  // PlantNet API - Open source plant identification
  async identifyWithPlantNet(base64Image: string): Promise<PlantDetails | null> {
    if (!this.apiKeys.plantNet) {
      throw new Error('PlantNet API key not configured');
    }

    const blob = this.base64ToBlob(base64Image);
    const formData = new FormData();
    
    formData.append('images', blob);
    formData.append('organs', 'leaf');
    formData.append('nb-results', '5');

    try {
      const response = await fetch(
        `${this.baseUrls.plantNet}/identify/weurope?api-key=${this.apiKeys.plantNet}`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`PlantNet API error: ${response.status}`);
      }

      const data = await response.json();
      return this.formatPlantNetResponse(data);
    } catch (error) {
      console.error('PlantNet identification failed:', error);
      throw error;
    }
  }

  // Main identification method that tries multiple APIs
  async identifyPlant(base64Image: string, plantLabel: string | null = null): Promise<PlantDetails | null> {
    const results = [];

    // Try Plant.id first (most accurate)
    try {
      const plantIdResult = await this.identifyWithPlantId(base64Image);
      if (plantIdResult && plantIdResult.confidence > 0.3) {
        results.push({ ...plantIdResult, source: 'Plant.id' });
      }
    } catch (error) {
      console.warn('Plant.id failed, trying alternatives');
    }

    // Try PlantNet as backup
    try {
      const plantNetResult = await this.identifyWithPlantNet(base64Image);
      if (plantNetResult && plantNetResult.confidence > 0.2) {
        results.push({ ...plantNetResult, source: 'PlantNet' });
      }
    } catch (error) {
      console.warn('PlantNet failed');
    }

    // If we have a plant label from ML5, get care info
    if (plantLabel) {
      try {
        const careInfo = await this.getPlantCareInfo(plantLabel);
        if (careInfo) {
          results.push({ ...careInfo, source: 'Perenual', fromML: true });
        }
      } catch (error) {
        console.warn('Care info retrieval failed');
      }
    }

    // Return best result or fallback
    if (results.length > 0) {
      return results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    }

    return this.getFallbackPlantInfo(plantLabel || 'Unknown Plant');
  }

  // Format Plant.id API response
  formatPlantIdResponse(data: any): PlantDetails | null {
    const suggestion =
      data?.result?.classification?.suggestions?.[0] ??
      data?.suggestions?.[0]; // tolerate older response shapes

    if (!suggestion) {
      return null;
    }

    const plant = suggestion?.details ?? suggestion?.plant_details ?? {};
    const taxonomy = plant?.taxonomy ?? {};
    const isPlant = data?.result?.is_plant ?? data?.result?.isPlant ?? undefined;
    const isHealthy = data?.result?.is_healthy ?? data?.result?.isHealthy ?? undefined;
    const disease = data?.result?.disease ?? undefined;

    const diseases =
      disease?.suggestions?.map((s: any) => ({
        id: s.id,
        name: String(s.name ?? 'Unknown issue'),
        probability: typeof s.probability === 'number' ? s.probability : undefined,
        nonHarmful: typeof s.non_harmful === 'boolean' ? s.non_harmful : undefined,
        details: s.details,
        similarImages: s.similar_images,
      })) ?? [];

    return {
      label: plant.common_names?.[0] || plant.scientific_name || suggestion.name,
      scientificName: plant.scientific_name || suggestion.name,
      confidence: suggestion.probability,
      description: plant.description?.value || plant.description || 'No description available',
      commonNames: plant.common_names || [],
      family: taxonomy?.family,
      genus: taxonomy?.genus,
      watering: plant.watering?.max || plant.watering || 'Regular watering',
      light: 'Bright indirect light', // Default as not provided by Plant.id
      propagation: plant.propagation_methods || [],
      edibleParts: plant.edible_parts || [],
      image: plant.image?.value || plant.image,
      gbifId: plant.gbif_id,
      inaturalistId: plant.inaturalist_id,
      synonyms: plant.synonyms || [],
      isPlant: isPlant
        ? { binary: isPlant.binary, probability: isPlant.probability }
        : undefined,
      healthAssessment: isHealthy || diseases.length > 0
        ? {
            isHealthy: isHealthy
              ? { binary: isHealthy.binary, probability: isHealthy.probability }
              : undefined,
            diseases,
            defectScore: disease?.defect_score,
          }
        : undefined,
      source: 'Plant.id',
    };
  }

  // Format PlantNet API response
  formatPlantNetResponse(data: any): PlantDetails | null {
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const species = result.species;

    return {
      label: species.commonNames?.[0] || species.scientificNameWithoutAuthor,
      scientificName: species.scientificNameWithoutAuthor,
      confidence: result.score,
      description: `${species.genus.scientificNameWithoutAuthor} species`,
      family: species.family.scientificNameWithoutAuthor,
      genus: species.genus.scientificNameWithoutAuthor,
      images: result.images?.map((img: any) => img.url.o) || [],
      source: 'PlantNet'
    };
  }

  // Format Perenual API response
  formatPerenualResponse(data: any): PlantDetails {
    return {
      label: data.common_name || data.scientific_name?.[0],
      scientificName: data.scientific_name?.[0],
      confidence: 0.7,
      description: data.description || 'No description available',
      watering: data.watering || 'Regular watering',
      light: data.sunlight?.join(', ') || 'Bright indirect light',
      source: 'Perenual',
      care: {
        hardiness: data.hardiness?.min && data.hardiness?.max 
          ? `Zones ${data.hardiness.min}-${data.hardiness.max}` 
          : 'Unknown',
        maintenance: data.maintenance || 'Medium',
        growthRate: data.growth_rate || 'Medium',
        droughtTolerant: data.drought_tolerant || false,
        saltTolerant: data.salt_tolerant || false,
        thorny: data.thorny || false,
        invasive: data.invasive || false,
        tropical: data.tropical || false,
        indoor: data.indoor || false,
        careLevel: data.care_level || 'Medium'
      },
      dimensions: {
        minHeight: data.dimension?.min_value,
        maxHeight: data.dimension?.max_value,
        unit: data.dimension?.unit
      },
      image: data.default_image?.original_url,
      cycle: data.cycle,
      attracts: data.attracts || [],
      propagation: data.propagation || [],
      pruningMonth: data.pruning_month || [],
      pruningCount: data.pruning_count || [],
      seeds: data.seeds || 0,
      flowers: data.flowers || false,
      flowering_season: data.flowering_season,
      color: data.flower_color,
      soilRequirements: data.soil || []
    };
  }

  // Fallback plant information when APIs fail
  getFallbackPlantInfo(plantName: string): PlantDetails {
    const fallbackData: Record<string, Partial<PlantDetails>> = {
      'daisy': {
        label: 'Daisy',
        scientificName: 'Bellis perennis',
        description: 'A common flowering plant with white petals and yellow center.',
        light: 'Full sun to partial shade',
        watering: 'Regular watering, allow soil to dry between waterings',
        uses: 'Ornamental, medicinal (traditional use)'
      },
      'rose': {
        label: 'Rose',
        scientificName: 'Rosa spp.',
        description: 'Popular flowering shrub known for its fragrant blooms.',
        light: 'Full sun (6+ hours daily)',
        watering: 'Deep watering 1-2 times per week',
        uses: 'Ornamental, cut flowers, essential oils'
      },
      'sunflower': {
        label: 'Sunflower',
        scientificName: 'Helianthus annuus',
        description: 'Large flowering plant that follows the sun across the sky.',
        light: 'Full sun',
        watering: 'Regular watering, drought tolerant when established',
        uses: 'Seeds for food and oil, ornamental'
      }
    };

    const normalizedName = plantName.toLowerCase().replace(/[^a-z]/g, '');
    
    // Try to find a match in fallback data
    for (const [key, data] of Object.entries(fallbackData)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return { 
          confidence: 0.5, 
          source: 'Fallback',
          ...data
        } as PlantDetails;
      }
    }

    // Generic fallback
    return {
      label: plantName || 'Unknown Plant',
      scientificName: 'Species not identified',
      description: 'This appears to be a plant, but we could not identify the specific species. Consider consulting a local botanist or plant identification expert.',
      light: 'Varies by species - observe current growing conditions',
      watering: 'Monitor soil moisture - most plants prefer soil that dries slightly between waterings',
      uses: 'Unknown - research before consumption or medicinal use',
      confidence: 0.1,
      source: 'Generic Fallback'
    };
  }

  // Cache management
  getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

const plantApiService = new PlantApiService();
export default plantApiService;
