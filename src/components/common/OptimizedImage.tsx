import React, { useState, useRef, useEffect, useCallback } from 'react';
import './OptimizedImage.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  onClick?: () => void;
  placeholder?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
}

const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  src,
  alt,
  width,
  height,
  className = '',
  onClick,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjI3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  quality = 0.8,
  loading = 'lazy'
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Compress image if it's a base64 string
  const compressImage = useCallback((base64: string, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width)
        const maxWidth = 800;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
      img.src = base64;
    });
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, isInView]);

  // Load and compress image when in view
  useEffect(() => {
    if (!isInView) return;

    const loadImage = async () => {
      try {
        setIsLoaded(false);
        setHasError(false);

        // If it's a base64 image, compress it
        if (src.startsWith('data:image/')) {
          const compressedSrc = await compressImage(src, quality);
          setImageSrc(compressedSrc);
        } else {
          setImageSrc(src);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load image:', error);
        setHasError(true);
        setImageSrc(placeholder);
      }
    };

    loadImage();
  }, [src, isInView, compressImage, quality, placeholder]);

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setHasError(true);
    setImageSrc(placeholder);
  }, [placeholder]);

  return (
    <div 
      className={`optimized-image-container ${className} ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`}
      style={{ width, height }}
      onClick={onClick}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className="optimized-image"
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={loading}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      {!isLoaded && !hasError && (
        <div className="image-loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
      {hasError && (
        <div className="image-error-overlay">
          <span>⚠️</span>
          <p>Failed to load image</p>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
