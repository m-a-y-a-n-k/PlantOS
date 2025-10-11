// Performance monitoring utilities for PlantOS

interface PerformanceMetrics {
  componentRenderTime: number;
  imageLoadTime: number;
  apiResponseTime: number;
  bundleSize: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Monitor component render times
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure'] });
      this.observers.set('measure', observer);
    }
  }

  // Measure component render time
  measureComponentRender(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.metrics.componentRenderTime = duration;
    performance.mark(`${componentName}-render-end`);
    performance.measure(`${componentName}-render`, `${componentName}-render-start`, `${componentName}-render-end`);
    
    return duration;
  }

  // Measure image load time
  measureImageLoad(imageSrc: string): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const img = new Image();
      
      img.onload = () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.metrics.imageLoadTime = duration;
        resolve(duration);
      };
      
      img.onerror = () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        resolve(duration);
      };
      
      img.src = imageSrc;
    });
  }

  // Measure API response time
  async measureApiCall<T>(apiCall: () => Promise<T>, apiName: string): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.metrics.apiResponseTime = duration;
      console.log(`API ${apiName} took ${duration}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`API ${apiName} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {};
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component performance
export const usePerformanceMeasure = (componentName: string) => {
  const measureRender = (renderFn: () => void) => {
    return performanceMonitor.measureComponentRender(componentName, renderFn);
  };

  return { measureRender };
};

// Utility for measuring image compression
export const measureImageCompression = async (
  originalSrc: string, 
  compressedSrc: string
): Promise<{ originalSize: number; compressedSize: number; compressionRatio: number }> => {
  const originalSize = originalSrc.length;
  const compressedSize = compressedSrc.length;
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
  
  return {
    originalSize,
    compressedSize,
    compressionRatio
  };
};

// Bundle size monitoring
export const getBundleSize = (): number => {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    return jsResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
  }
  
  return 0;
};

// Memory usage monitoring
export const getMemoryUsage = (): any => {
  if ('memory' in performance) {
    return {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit
    };
  }
  
  return null;
};

// Performance recommendations
export const getPerformanceRecommendations = (metrics: Partial<PerformanceMetrics>): string[] => {
  const recommendations: string[] = [];
  
  if (metrics.componentRenderTime && metrics.componentRenderTime > 16) {
    recommendations.push('Consider optimizing component rendering - target <16ms for 60fps');
  }
  
  if (metrics.imageLoadTime && metrics.imageLoadTime > 1000) {
    recommendations.push('Image loading is slow - consider compression or lazy loading');
  }
  
  if (metrics.apiResponseTime && metrics.apiResponseTime > 2000) {
    recommendations.push('API responses are slow - consider caching or optimization');
  }
  
  return recommendations;
};
