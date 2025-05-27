import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import SuperJSON from 'superjson';
import { serializeCoeffs, deserializeCoeffs } from '../src/lib/serialization';
import { applyGlobals } from '../src/lib/cosineGradient';
import { getCollectionStyleCSS } from '../src/lib/getCollectionStyleCSS';
import { DEFAULT_STYLE, DEFAULT_STEPS, DEFAULT_ANGLE, DEFAULT_GLOBALS } from '../src/validators';
import type { CollectionStyle } from '../src/types';

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

      // Get optional parameters from query string with defaults
      const style = query.style as CollectionStyle;
      const steps = query.steps ? parseInt(query.steps) : DEFAULT_STEPS;
      const angle = query.angle ? parseInt(query.angle) : DEFAULT_ANGLE;

      // Deserialize the seed to get coefficients and globals
      const { coeffs } = deserializeCoeffs(seed);

      // Apply globals to get processed colors
      const processedColors = applyGlobals(coeffs, DEFAULT_GLOBALS);

      // Generate CSS for the gradient
      const { cssString } = getCollectionStyleCSS(style, processedColors, angle, {
        seed,
        href: '',
      });

      // Create an HTML template for the OG image
      // Note: This is a simple HTML template that will be rendered by browsers
      // For production, you might want to use a proper image generation library
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .og-container {
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      ${cssString.replace('background:', '')}
    }
    .content {
      background: rgba(0, 0, 0, 0.7);
      padding: 2rem 3rem;
      border-radius: 1rem;
      text-align: center;
      backdrop-filter: blur(10px);
    }
    h1 {
      color: white;
      font-size: 3rem;
      margin: 0 0 1rem 0;
    }
    p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.5rem;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="og-container">
    <div class="content">
      <h1>Grabient</h1>
      <p>Beautiful gradient generator</p>
    </div>
  </div>
</body>
</html>`;

      // Return the HTML with appropriate headers
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
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
