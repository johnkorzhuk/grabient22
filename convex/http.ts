import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import SuperJSON from 'superjson';
import { serializeCoeffs, deserializeCoeffs } from '../src/lib/serialization';
import { applyGlobals, cosineGradient } from '../src/lib/cosineGradient';
import { getCollectionStyleSVG } from '../src/lib/getCollectionStyleSVG';
import { DEFAULT_STYLE, DEFAULT_STEPS, DEFAULT_ANGLE, DEFAULT_GLOBALS } from '../src/validators';
import type { CollectionStyle } from '../src/types';
// Using the WebAssembly version for Convex environment
import { Resvg, initWasm } from '@resvg/resvg-wasm';
const http = httpRouter();

// OG Image endpoint for dynamic social media previews
http.route({
  path: '/og',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    // Extract parameters from the request
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const seed = searchParams.get('seed') || '';
    const query = {
      style: searchParams.get('style') || DEFAULT_STYLE,
      steps: searchParams.get('steps'),
      angle: searchParams.get('angle'),
    };
    try {
      // Validate seed parameter
      if (!seed) {
        return new Response('Missing seed parameter', { status: 400 });
      }

      // Initialize WebAssembly for resvg
      // We need to fetch the WASM file from a CDN since we can't import it directly in Convex
      await initWasm(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'));

      // Get optional parameters from query string with defaults
      const style = query.style as CollectionStyle;
      const steps = query.steps ? parseInt(query.steps) : DEFAULT_STEPS;
      const angle = query.angle ? parseInt(query.angle) : DEFAULT_ANGLE;

      // Deserialize the seed to get coefficients and globals
      const { coeffs, globals } = deserializeCoeffs(seed);

      // Apply globals to get processed colors
      const processedColors = applyGlobals(coeffs, globals);
      const gradientColors = cosineGradient(steps, processedColors);

      // Generate SVG for the gradient
      const svgString = getCollectionStyleSVG(
        style,
        gradientColors,
        angle,
        {
          seed,
          href: '',
        },
        null,
        1200,
        630,
      );

      // Create an SVG with the Grabient logo overlay for the OG image
      // Create gradient stops like in GrabientLogo component
      const gradientStops =
        gradientColors.length > 0
          ? gradientColors.map((color, index) => {
              const offset = `${(index / (gradientColors.length - 1)) * 100}%`;
              const stopColor = `rgb(${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)})`;
              return { offset, stopColor };
            })
          : [
              { offset: '0%', stopColor: 'rgb(255, 255, 255)' },
              { offset: '100%', stopColor: 'rgb(255, 255, 255)' },
            ];

      // Calculate average brightness to determine logo color (white or black)
      // Sum all RGB values across all gradient steps, similar to RGBTabs logic
      const totalBrightness =
        gradientColors.length > 0
          ? gradientColors.reduce((sum, color) => {
              // Calculate luminance using the standard formula: 0.299*R + 0.587*G + 0.114*B
              const luminance = color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114;
              return sum + luminance;
            }, 0)
          : 0;

      const averageBrightness =
        gradientColors.length > 0 ? totalBrightness / gradientColors.length : 0.5;

      // Use white text on dark backgrounds (average < 0.5), black text on light backgrounds (average >= 0.5)
      const logoTextColor = averageBrightness < 0.5 ? 'white' : 'black';

      // Extract the inner content of the SVG without the outer <svg> tags
      // The issue is that different style types format their SVGs differently
      let svgInnerContent = '';

      // Check if the SVG string contains the opening and closing tags
      if (svgString.includes('<svg') && svgString.includes('</svg>')) {
        // Extract everything between the opening <svg> tag and closing </svg> tag
        const openTagEndIndex = svgString.indexOf('>', svgString.indexOf('<svg')) + 1;
        const closeTagStartIndex = svgString.lastIndexOf('</svg>');

        if (openTagEndIndex > 0 && closeTagStartIndex > 0) {
          svgInnerContent = svgString.substring(openTagEndIndex, closeTagStartIndex);
        }
      }

      // Define the logo path constant (from GrabientLogo.tsx)
      const LOGO_PATH =
        'M17.0015787 16.3699871v7.4230271h10.7969796c-.9771022 3.5394567-4.0549742 5.8499353-8.6473547 5.8499353-4.5435253 0-9.91758758-3.293661-9.91758758-10.9133247 0-7.1772315 5.32520708-10.56921083 9.86873248-10.56921083 3.9084089 0 6.5465849 2.16300133 7.9633831 4.71927553h10.3572836C35.4199556 5.84993532 27.9939787 0 19.3466241 0 8.6962098 0 0 7.86545925 0 18.7296248c0 10.4708927 8.2565138 19.0737387 19.2000587 19.0737387 10.0152978 0 19.297769-7.3247089 19.297769-19.5161707 0-.7373868 0-1.2781372-.0488552-1.9172057H17.0015787zm26.0056541 20.6959896h8.1099485V22.072445c0-4.1293661 2.638176-4.915912 6.4000195-5.0142303V8.84864166c-4.6900906 0-6.1068889 2.50711514-6.7908604 3.83441134h-.0977103V9.78266494h-7.6213973V37.0659767zM89.3854683 9.78266494V37.0659767h-8.1099485v-2.9495472h-.0977102C79.8098665 36.771022 76.4388638 38 73.2632816 38c-8.5984996 0-13.6305761-6.7839586-13.6305761-14.6002587 0-8.9469599 6.4000196-14.55109964 13.6305761-14.55109964 4.4458151 0 6.9374257 2.16300124 7.914528 3.83441134h.0977102V9.78266494h8.1099485zM67.742654 23.4980595c0 2.5562743 1.8564942 6.8822769 6.7420053 6.8822769 5.0809316 0 6.7908605-4.3260026 6.7908605-6.9805951 0-3.2936611-2.2473351-6.931436-6.8397156-6.931436-4.6412355 0-6.6931502 3.9327296-6.6931502 7.0297542zm27.9110034 13.5679172V.68822768h8.1099486V11.9456662c2.882451-3.09702454 6.742005-3.09702454 7.865673-3.09702454 5.667193 0 13.337445 4.08020694 13.337445 14.40362224C124.966724 33.084088 118.175864 38 111.287293 38c-3.810699 0-6.742005-1.8680466-7.767963-3.8344114h-.09771v2.9003881h-7.7679626zm7.8168176-13.7153946c0 3.7852523 2.540466 7.0297543 6.59544 7.0297543 4.152685 0 6.790861-3.3919793 6.790861-6.9805951 0-3.5394567-2.638176-6.931436-6.644295-6.931436-4.29925 0-6.742006 3.4902975-6.742006 6.8822768zm34.262168-13.56791716h-8.109948V37.0659767h8.109948V9.78266494zm0-9.09443726h-8.109948v6.19404916h8.109948V.68822768zm23.807174 27.82406212h8.305369c-1.319088 3.0478654-3.224437 5.4075032-5.520628 6.9805951-2.247335 1.6222509-4.934366 2.457956-7.719107 2.457956-7.767963 0-14.363403-6.3415265-14.363403-14.4527814 0-7.6196636 5.960324-14.64941784 14.216838-14.64941784 8.256513 0 14.314547 6.58732214 14.314547 14.89521344 0 1.0815007-.09771 1.5239327-.19542 2.1630013h-20.323727c.488552 3.2445019 3.175583 5.1617076 6.351165 5.1617076 2.491611 0 3.810699-1.1306597 4.934366-2.5562742zm-11.18782-8.1112549h12.311488c-.341986-1.6222509-1.954205-4.6701164-6.155744-4.6701164-4.20154 0-5.813759 3.0478655-6.155744 4.6701164zm25.028552 16.6649418h8.109948V22.2199224c0-1.6714101 0-5.702458 4.641236-5.702458 4.250394 0 4.250394 3.7360932 4.250394 5.6532989v14.8952134h8.109949V20.007762c0-5.3583441-1.661074-7.5213454-3.126727-8.7994826-1.465654-1.2781371-4.348105-2.35963774-6.937426-2.35963774-4.836656 0-6.546585 2.50711514-7.377122 3.83441134h-.09771V9.78266494h-7.572542V37.0659767zM216.091591.68822768h-8.109948v9.09443726h-4.006119v6.19404916h4.006119v21.0892626h8.109948V15.9767141H220V9.78266494h-3.908409V.68822768z';

      const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        ${svgInnerContent}
        <!-- Gradient definition needs to be at the top level -->
        <defs>
          <linearGradient x1="0%" y1="0%" x2="100%" y2="0%" id="logoGradient">
            ${gradientStops
              .map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.stopColor}" />`)
              .join('')}
          </linearGradient>
        </defs>
        <!-- Center the logo in the OG image -->
        <g transform="translate(325, 290)">
          <!-- Scale the logo appropriately -->
          <g transform="scale(2.5)">
            <g fill="none" fillRule="evenodd">
              <!-- Logo text with dynamic color based on background brightness -->
              <path d="${LOGO_PATH}" fill="${logoTextColor}" />
              <!-- Gradient bar under the logo, matching the GrabientLogo component -->
              <rect x="93" y="43" width="34" height="7" fill="url(#logoGradient)" />
            </g>
          </g>
        </g>
      </svg>`;

      // Convert SVG to PNG using resvg-wasm
      const resvg = new Resvg(fullSvg, {
        background: 'transparent',
        fitTo: {
          mode: 'width',
          value: 1200,
        },
        font: {
          loadSystemFonts: true,
        },
      });

      // Render the PNG
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();

      // Return the PNG with appropriate headers
      return new Response(pngBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (error) {
      console.error('Error generating OG image:', error);
      return new Response('Error generating image', { status: 500 });
    }
  }),
});

export default http;
