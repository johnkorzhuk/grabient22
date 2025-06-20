import { cn } from '~/lib/utils';
import { useEffect, useRef } from 'react';
import type { AppCollection, CosineCoeffs } from '~/types';
import { observer, use$ } from '@legendapp/state/react';
import { uiTempStore$ } from '~/stores/ui';
import { collectionStore$ } from '~/stores/collection';
import { useMatches, useRouteContext, useSearch } from '@tanstack/react-router';
import { applyGlobals, cosineGradient } from '~/lib/cosineGradient';
import { DEFAULT_STEPS } from '~/validators';

interface AnimatedGrabientLogoProps {
  className?: string;
}

export const GrabientLogo = observer(function GrabientLogo({
  className,
}: AnimatedGrabientLogoProps) {
  const matches = useMatches();
  const isSeedRoute = matches.some((match) => match.routeId === '/$seed/');
  const activeCollectionId = use$(uiTempStore$.activeCollectionId);
  const collections = use$(collectionStore$.collections);
  let collection = collections.find((c) => c._id === activeCollectionId);
  const context = useRouteContext({
    from: isSeedRoute ? '/$seed' : '/_layout',
  });

  const search = useSearch({
    from: isSeedRoute ? '/$seed' : '/_layout',
  });

  const steps = search.steps === 'auto' ? DEFAULT_STEPS : search.steps;

  if (isSeedRoute && 'seedData' in context) {
    collection = context.seedData.collection as AppCollection;
  }

  // Only process coefficients if collection exists
  const processedCoeffs = collection ? applyGlobals(collection.coeffs, collection.globals) : [];
  const gradientColors = collection ? cosineGradient(steps, processedCoeffs) : [];

  // Check if we have a valid collection with coefficients
  const hasValidCollection = collection && collection.coeffs && collection.globals;

  // Use collection colors or fallback to animation
  const useCollectionColors = Boolean(hasValidCollection);

  // Only create animation refs if we're using animation
  const gradientRef = useRef<SVGLinearGradientElement | null>(null);
  const animationRef = useRef<number | null>(null);
  // Initialize with a random time value to start at a random point in the animation
  const timeRef = useRef<number>(Math.random() * COEFFS.length);

  // We're now directly using the gradientColors array to create the gradient
  // No need to use getCollectionStyleCSS anymore

  // Generate initial random colors on component creation (before first render)
  const TAU = Math.PI * 2;

  // Get a random initial position in the coefficient space
  const t = timeRef.current;
  const baseIndex = Math.floor(t % COEFFS.length);
  const nextIndex = (baseIndex + 1) % COEFFS.length;
  const progress = t % 1;

  // Apply easing to the progress
  const easedProgress = progress * progress * progress * (progress * (progress * 6 - 15) + 10);

  // Get interpolated coefficients
  const initialCoeffs = interpolateCoeffs(
    COEFFS[baseIndex] as CosineCoeffs,
    COEFFS[nextIndex] as CosineCoeffs,
    easedProgress,
  );

  // Helper function to smoothly interpolate coefficients
  function interpolateCoeffs(
    coeffsA: CosineCoeffs,
    coeffsB: CosineCoeffs,
    progress: number,
  ): CosineCoeffs {
    return coeffsA.map((vector, i) =>
      vector.map((value, j) => {
        // Special handling for phase values (index 3)
        if (i === 3) {
          const targetValue = coeffsB[i][j];
          // Handle phase wrapping for continuous rotation
          let delta = targetValue - value;

          // Normalize to find the shortest angular path
          if (Math.abs(delta) > Math.PI) {
            delta = delta > 0 ? delta - TAU : delta + TAU;
          }

          return value + delta * progress;
        }

        // Linear interpolation for other values
        return value + (coeffsB[i][j] - value) * progress;
      }),
    ) as CosineCoeffs;
  }

  // Generate gradient colors using the cosine formula
  function generateColor(t: number, coeffs: CosineCoeffs): [number, number, number] {
    const color: [number, number, number] = [0, 0, 0];

    for (let i = 0; i < 3; i++) {
      // a + b * cos(2π(c*t + d))
      color[i] = coeffs[0][i] + coeffs[1][i] * Math.cos(TAU * (coeffs[2][i] * t + coeffs[3][i]));
      // Clamp values between 0 and 1
      color[i] = Math.max(0, Math.min(1, color[i]));
    }

    return color;
  }

  // Convert RGB array to hex color string
  function rgbToHex(rgb: [number, number, number]): string {
    return `#${rgb
      .map((x) =>
        Math.round(x * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`;
  }

  // Generate the initial colors
  const startColor = generateColor(0, initialCoeffs);
  const endColor = generateColor(1, initialCoeffs);

  const initialColors = {
    startColor: rgbToHex(startColor),
    endColor: rgbToHex(endColor),
  };

  useEffect(() => {
    // Even when using collection colors, we'll keep the animation running
    // This ensures a smooth transition if we switch back to animated mode

    const TAU = Math.PI * 2;
    let lastTimestamp = 0;

    // Animation speed control
    const ANIMATION_SPEED = 0.0001; // Lower = slower, more fluid animation

    const animate = (timestamp: number): void => {
      // Initialize on first frame
      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
      }

      // Calculate elapsed time since last frame
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Continuously increment time value for smooth motion
      timeRef.current += deltaTime * ANIMATION_SPEED;

      // Calculate the smooth index into the coefficient array
      // This creates a continuous path through all coefficients
      const t = timeRef.current;

      // Get the base coefficient index and the interpolation progress
      const baseIndex = Math.floor(t % COEFFS.length);
      const nextIndex = (baseIndex + 1) % COEFFS.length;
      const progress = t % 1; // Fractional part for smooth interpolation

      // Use a smoother easing function
      const easedProgress = smootherstep(progress);

      // Generate the interpolated coefficients
      const interpolatedCoeffs = smoothInterpolateCoeffs(
        COEFFS[baseIndex] as CosineCoeffs,
        COEFFS[nextIndex] as CosineCoeffs,
        easedProgress,
      );

      // Generate gradient colors
      const startColor = generateColor(0, interpolatedCoeffs);
      const endColor = generateColor(1, interpolatedCoeffs);

      // Apply colors to gradient
      if (gradientRef.current) {
        const stops = gradientRef.current.querySelectorAll('stop');
        if (stops && stops.length >= 2) {
          stops[0].setAttribute('stop-color', rgbToHex(startColor));
          stops[1].setAttribute('stop-color', rgbToHex(endColor));
        }
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Improved interpolation between coefficient sets
    const smoothInterpolateCoeffs = (
      coeffsA: CosineCoeffs,
      coeffsB: CosineCoeffs,
      progress: number,
    ): CosineCoeffs => {
      return coeffsA.map((vector, i) =>
        vector.map((value, j) => {
          // Special handling for phase values (index 3)
          if (i === 3) {
            const targetValue = coeffsB[i][j];
            // Handle phase wrapping for continuous rotation
            let delta = targetValue - value;

            // Normalize to find the shortest angular path
            if (Math.abs(delta) > Math.PI) {
              delta = delta > 0 ? delta - TAU : delta + TAU;
            }

            return value + delta * progress;
          }

          // Linear interpolation for other values
          return value + (coeffsB[i][j] - value) * progress;
        }),
      ) as CosineCoeffs;
    };

    // Improved easing function for smoother transitions
    // (smootherstep is smoother than easeInOutCubic)
    const smootherstep = (x: number): number => {
      // Improved smootherstep (Ken Perlin)
      return x * x * x * (x * (x * 6 - 15) + 10);
    };

    // Generate a color using the cosine gradient formula
    const generateColor = (t: number, coeffs: CosineCoeffs): [number, number, number] => {
      const color: [number, number, number] = [0, 0, 0];

      for (let i = 0; i < 3; i++) {
        // a + b * cos(2π(c*t + d))
        color[i] = coeffs[0][i] + coeffs[1][i] * Math.cos(TAU * (coeffs[2][i] * t + coeffs[3][i]));
        // Clamp values between 0 and 1
        color[i] = Math.max(0, Math.min(1, color[i]));
      }

      return color;
    };

    // Convert RGB array to hex color string
    const rgbToHex = (rgb: [number, number, number]): string => {
      return `#${rgb
        .map((x) =>
          Math.round(x * 255)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')}`;
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('inline-flex items-center', className)} aria-label="Grabient Logo">
      <svg
        width="220"
        height="50"
        viewBox="0 0 220 50"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          {/* Always define both gradients */}
          <linearGradient id="animatedGradient" x1="0%" y1="0%" x2="100%" y2="0%" ref={gradientRef}>
            <stop offset="0%" stopColor={initialColors.startColor} suppressHydrationWarning />
            <stop offset="100%" stopColor={initialColors.endColor} suppressHydrationWarning />
          </linearGradient>

          <linearGradient id="collectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientColors.length > 0 &&
              gradientColors.map((color, index) => (
                <stop
                  key={index}
                  offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                  stopColor={`rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`}
                />
              ))}
          </linearGradient>
        </defs>
        <g fill="none" fillRule="evenodd">
          <path d={LOGO_PATH} fill="currentColor" />

          {/* Render both rectangles with opacity transitions */}
          <rect
            x="93"
            y="43"
            width="34"
            height="7"
            fill="url(#collectionGradient)"
            style={{
              opacity: useCollectionColors ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
              position: 'relative',
              zIndex: useCollectionColors ? 2 : 1,
            }}
          />

          {/* Animated gradient is always running in the background */}
          <rect
            x="93"
            y="43"
            width="34"
            height="7"
            fill="url(#animatedGradient)"
            style={{
              opacity: useCollectionColors ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
              position: 'relative',
              zIndex: useCollectionColors ? 1 : 2,
            }}
          />
        </g>
      </svg>
    </div>
  );
});

const LOGO_PATH =
  'M17.0015787 16.3699871v7.4230271h10.7969796c-.9771022 3.5394567-4.0549742 5.8499353-8.6473547 5.8499353-4.5435253 0-9.91758758-3.293661-9.91758758-10.9133247 0-7.1772315 5.32520708-10.56921083 9.86873248-10.56921083 3.9084089 0 6.5465849 2.16300133 7.9633831 4.71927553h10.3572836C35.4199556 5.84993532 27.9939787 0 19.3466241 0 8.6962098 0 0 7.86545925 0 18.7296248c0 10.4708927 8.2565138 19.0737387 19.2000587 19.0737387 10.0152978 0 19.297769-7.3247089 19.297769-19.5161707 0-.7373868 0-1.2781372-.0488552-1.9172057H17.0015787zm26.0056541 20.6959896h8.1099485V22.072445c0-4.1293661 2.638176-4.915912 6.4000195-5.0142303V8.84864166c-4.6900906 0-6.1068889 2.50711514-6.7908604 3.83441134h-.0977103V9.78266494h-7.6213973V37.0659767zM89.3854683 9.78266494V37.0659767h-8.1099485v-2.9495472h-.0977102C79.8098665 36.771022 76.4388638 38 73.2632816 38c-8.5984996 0-13.6305761-6.7839586-13.6305761-14.6002587 0-8.9469599 6.4000196-14.55109964 13.6305761-14.55109964 4.4458151 0 6.9374257 2.16300124 7.914528 3.83441134h.0977102V9.78266494h8.1099485zM67.742654 23.4980595c0 2.5562743 1.8564942 6.8822769 6.7420053 6.8822769 5.0809316 0 6.7908605-4.3260026 6.7908605-6.9805951 0-3.2936611-2.2473351-6.931436-6.8397156-6.931436-4.6412355 0-6.6931502 3.9327296-6.6931502 7.0297542zm27.9110034 13.5679172V.68822768h8.1099486V11.9456662c2.882451-3.09702454 6.742005-3.09702454 7.865673-3.09702454 5.667193 0 13.337445 4.08020694 13.337445 14.40362224C124.966724 33.084088 118.175864 38 111.287293 38c-3.810699 0-6.742005-1.8680466-7.767963-3.8344114h-.09771v2.9003881h-7.7679626zm7.8168176-13.7153946c0 3.7852523 2.540466 7.0297543 6.59544 7.0297543 4.152685 0 6.790861-3.3919793 6.790861-6.9805951 0-3.5394567-2.638176-6.931436-6.644295-6.931436-4.29925 0-6.742006 3.4902975-6.742006 6.8822768zm34.262168-13.56791716h-8.109948V37.0659767h8.109948V9.78266494zm0-9.09443726h-8.109948v6.19404916h8.109948V.68822768zm23.807174 27.82406212h8.305369c-1.319088 3.0478654-3.224437 5.4075032-5.520628 6.9805951-2.247335 1.6222509-4.934366 2.457956-7.719107 2.457956-7.767963 0-14.363403-6.3415265-14.363403-14.4527814 0-7.6196636 5.960324-14.64941784 14.216838-14.64941784 8.256513 0 14.314547 6.58732214 14.314547 14.89521344 0 1.0815007-.09771 1.5239327-.19542 2.1630013h-20.323727c.488552 3.2445019 3.175583 5.1617076 6.351165 5.1617076 2.491611 0 3.810699-1.1306597 4.934366-2.5562742zm-11.18782-8.1112549h12.311488c-.341986-1.6222509-1.954205-4.6701164-6.155744-4.6701164-4.20154 0-5.813759 3.0478655-6.155744 4.6701164zm25.028552 16.6649418h8.109948V22.2199224c0-1.6714101 0-5.702458 4.641236-5.702458 4.250394 0 4.250394 3.7360932 4.250394 5.6532989v14.8952134h8.109949V20.007762c0-5.3583441-1.661074-7.5213454-3.126727-8.7994826-1.465654-1.2781371-4.348105-2.35963774-6.937426-2.35963774-4.836656 0-6.546585 2.50711514-7.377122 3.83441134h-.09771V9.78266494h-7.572542V37.0659767zM216.091591.68822768h-8.109948v9.09443726h-4.006119v6.19404916h4.006119v21.0892626h8.109948V15.9767141H220V9.78266494h-3.908409V.68822768z';

const COEFFS = [
  [
    [0.682, 0.485, 0.224, 1],
    [-0.318, -0.296, 0.028, 1],
    [0.449, 0.57, 0.08, 1],
    [2.967, 1.05, 2.323, 1],
  ],
  [
    [0.751, 0.919, 0.898, 1],
    [0.27, 0.417, 0.344, 1],
    [0.318, 0.285, 0.382, 1],
    [4.665, 5.092, 0.139, 1],
  ],
  [
    [0.512, 0.495, 0.704, 1],
    [-0.067, -0.297, -0.158, 1],
    [-0.315, 0.316, 0.672, 1],
    [-0.78, -0.773, -0.869, 1],
  ],
  [
    [0.492, 0.204, 0.378, 1],
    [0.158, 0.245, 0.152, 1],
    [0.522, 0.613, 0.37, 1],
    [5.823, 4.138, 1.491, 1],
  ],
  [
    [0.844, 1.13, 0.691, 1],
    [0.879, 0.856, 0.202, 1],
    [0.212, 0.188, 0.475, 1],
    [3.853, 2.543, 1.428, 1],
  ],
  [
    [0.369, 0.356, 0.17, 1],
    [0.109, 0.228, -0.822, 1],
    [-0.329, -0.464, 0.088, 1],
    [0.447, 0.694, 0.647, 1],
  ],
  [
    [0.247, 0.412, 0.044, 1],
    [1.233, 1.203, 0.335, 1],
    [0.035, 0.055, 0.056, 1],
    [1.749, 5.739, 2.387, 1],
  ],
  [
    [0.086, 0.779, 0.622, 1],
    [0.229, 0.286, 0.109, 1],
    [0.276, 0.182, 0.826, 1],
    [-0.31, 1.782, 1.593, 1],
  ],
  [
    [0.773, 0.337, 0.341, 1],
    [0.388, 0.313, 0.205, 1],
    [0.771, 1.168, 0.518, 1],
    [6.619, 6.413, 2.151, 1],
  ],
  [
    [0.671, 0.706, 0.232, 1],
    [0.312, 0.536, 0.332, 1],
    [0.558, 0.488, 0.57, 1],
    [5.129, 0.385, 2.687, 1],
  ],
  [
    [0.397, 0.167, 0.127, 1],
    [0.298, 0.121, 0.213, 1],
    [0.588, 0.127, 0.09, 1],
    [3.396, 0.759, 1.798, 1],
  ],
  [
    [0.987, 0.671, 0.611, 1],
    [0.408, 0.361, 0.028, 1],
    [0.544, 0.704, 0.669, 1],
    [1.0, -0.092, 4.852, 1],
  ],
  [
    [0.635, 1.004, 0.368, 1],
    [0.209, 0.736, 0.01, 1],
    [0.104, 0.239, 0.773, 1],
    [1.854, 0.571, 5.27, 1],
  ],
  [
    [0.55, 0.396, 0.588, 1],
    [0.777, 0.088, 0.144, 1],
    [0.24, 0.794, 0.134, 1],
    [4.037, 2.806, 4.797, 1],
  ],
  [
    [0.536, 0.607, 0.232, 1],
    [0.599, 0.434, 0.206, 1],
    [0.006, 0.546, 0.385, 1],
    [2.884, 3.138, 4.892, 1],
  ],
  [
    [0.533, 0.566, 0.97, 1],
    [0.297, 0.495, 0.789, 1],
    [0.028, 0.111, 0.336, 1],
    [3.579, 1.047, 4.604, 1],
  ],
  [
    [0.425, 0.508, 0.757, 1],
    [0.382, 0.902, 0.308, 1],
    [0.201, 0.037, 0.292, 1],
    [2.696, 2.727, 4.431, 1],
  ],
];
