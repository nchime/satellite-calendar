'use client';

import { useEffect } from 'react';

export default function BackgroundImage() {
  useEffect(() => {
    const setApiBackgroundImage = (imageUrl: string) => {
        document.body.style.background = ''; // Clear gradient
        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    };

    const setFallbackBackground = () => {
        document.body.style.backgroundImage = ''; // Clear image
        document.body.style.background = 'linear-gradient(to bottom, #ffffff, #f0f2f5)';
        document.body.style.backgroundAttachment = 'fixed';
    };

    const fetchAndSetImage = async () => {
      const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

      if (!accessKey || accessKey === 'Your_Access_Key_Here') {
        console.warn('Unsplash Access Key is not configured. Using fallback gradient background.');
        setFallbackBackground();
        return;
      }

      try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=coding,technology,developer`,
          {
            headers: {
              Authorization: `Client-ID ${accessKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const data = await response.json();
        setApiBackgroundImage(data.urls.regular);
      } catch (error) {
        console.error("Unsplash background failed, using fallback gradient:", error);
        setFallbackBackground();
      }
    };

    fetchAndSetImage();

    // Cleanup function
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
    };
  }, []);

  return null;
}