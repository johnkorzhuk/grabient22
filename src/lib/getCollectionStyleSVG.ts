type CollectionStyle = 'linearGradient' | 'linearSwatches' | 'angularGradient' | 'angularSwatches';

export function getCollectionStyleSVG(
  type: CollectionStyle = 'linearGradient',
  processedColors: number[][],
  angle: number = 90,
  creditProps?: { seed: string; searchString: string },
  activeIndex?: number | null,
  width: number = 800,
  height: number = 400,
): string {
  // Convert RGB values from 0-1 range to 0-255 range for SVG
  const getRgbString = (color: number[]) =>
    `${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)}`;

  // Alpha value for inactive color stops when activeIndex exists
  const inactiveAlpha = 0.5;

  // Credit comment for gradient inspiration
  const creditComment = creditProps
    ? `<!-- https://grabient.com/${creditProps.seed}${creditProps.searchString} -->`
    : '';

  if (processedColors.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${creditComment}
    </svg>`;
  }

  if (processedColors.length === 1) {
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          ${creditComment}
          <rect x="0" y="0" width="${width}" height="${height}" fill="rgb(${getRgbString(processedColors[0])})"/>
        </svg>
      `;
  }

  switch (type) {
    case 'linearGradient': {
      // Convert 0-360 degree angle to SVG coordinates (x1,y1,x2,y2)
      // Normalize the angle to 0-360 range
      const normalizedAngle = ((angle % 360) + 360) % 360;

      // Convert angle to radians
      const radians = (normalizedAngle - 90) * (Math.PI / 180);

      // Calculate the SVG gradient coordinates
      const x1 = (0.5 - 0.5 * Math.cos(radians)).toFixed(3);
      const y1 = (0.5 - 0.5 * Math.sin(radians)).toFixed(3);
      const x2 = (0.5 + 0.5 * Math.cos(radians)).toFixed(3);
      const y2 = (0.5 + 0.5 * Math.sin(radians)).toFixed(3);

      let svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            ${creditComment}
            <defs>
              <linearGradient id="gradient" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        `;

      // Standard gradient rendering
      if (
        typeof activeIndex !== 'number' ||
        activeIndex < 0 ||
        activeIndex >= processedColors.length
      ) {
        // Create a smooth gradient with all colors
        processedColors.forEach((color, index) => {
          const position = (index / (processedColors.length - 1)).toFixed(3);
          svgContent += `<stop offset="${position}" stop-color="rgb(${getRgbString(color)})" />`;
        });
      } else {
        // Handle active index highlighting
        const segmentSize = (1 / processedColors.length).toFixed(3);
        const activeStartPos = (activeIndex * Number(segmentSize)).toFixed(3);
        const activeEndPos = ((activeIndex + 1) * Number(segmentSize)).toFixed(3);

        if (activeIndex === 0) {
          // First segment is active
          svgContent += `<stop offset="${(0).toFixed(3)}" stop-color="rgb(${getRgbString(processedColors[0])})" />`;
          svgContent += `<stop offset="${activeEndPos}" stop-color="rgb(${getRgbString(processedColors[0])})" />`;

          // Rest with reduced opacity
          for (let i = 1; i < processedColors.length; i++) {
            const position = (i / (processedColors.length - 1)).toFixed(3);
            svgContent += `<stop offset="${position}" stop-color="rgb(${getRgbString(processedColors[i])})" stop-opacity="${inactiveAlpha.toFixed(3)}" />`;
          }
        } else if (activeIndex === processedColors.length - 1) {
          // Last segment is active
          // Start with reduced opacity
          for (let i = 0; i < processedColors.length - 1; i++) {
            const position = (i / (processedColors.length - 1)).toFixed(3);
            svgContent += `<stop offset="${position}" stop-color="rgb(${getRgbString(processedColors[i])})" stop-opacity="${inactiveAlpha.toFixed(3)}" />`;
          }

          // Active segment
          svgContent += `<stop offset="${activeStartPos}" stop-color="rgb(${getRgbString(processedColors[activeIndex])})" stop-opacity="${inactiveAlpha.toFixed(3)}" />`;
          svgContent += `<stop offset="${activeStartPos}" stop-color="rgb(${getRgbString(processedColors[activeIndex])})" />`;
          svgContent += `<stop offset="${(1).toFixed(3)}" stop-color="rgb(${getRgbString(processedColors[activeIndex])})" />`;
        } else {
          // Middle segment is active
          // Start with reduced opacity
          for (let i = 0; i < activeIndex; i++) {
            const position = (i / (processedColors.length - 1)).toFixed(3);
            svgContent += `<stop offset="${position}" stop-color="rgb(${getRgbString(processedColors[i])})" stop-opacity="${inactiveAlpha.toFixed(3)}" />`;
          }

          // Active segment
          svgContent += `<stop offset="${activeStartPos}" stop-color="rgb(${getRgbString(processedColors[activeIndex])})" stop-opacity="${inactiveAlpha.toFixed(3)}" />`;
          svgContent += `<stop offset="${activeStartPos}" stop-color="rgb(${getRgbString(processedColors[activeIndex])})" />`;
          svgContent += `<stop offset="${activeEndPos}" stop-color="rgb(${getRgbString(processedColors[activeIndex])})" />`;
          svgContent += `<stop offset="${activeEndPos}" stop-color="rgb(${getRgbString(processedColors[activeIndex])})" stop-opacity="${inactiveAlpha.toFixed(3)}" />`;

          // Continue with reduced opacity
          for (let i = activeIndex + 1; i < processedColors.length; i++) {
            const position = (i / (processedColors.length - 1)).toFixed(3);
            svgContent += `<stop offset="${position}" stop-color="rgb(${getRgbString(processedColors[i])})" stop-opacity="${inactiveAlpha.toFixed(3)}" />`;
          }
        }
      }

      // Close the gradient and SVG
      svgContent += `
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="${width}" height="${height}" fill="url(#gradient)" />
          </svg>
        `;

      return svgContent;
    }

    case 'linearSwatches': {
      // For linear swatches, we'll calculate the exact band size needed

      let svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
              ${creditComment}
        `;

      // Normalize the angle to 0-360 range
      const normalizedAngle = ((angle % 360) + 360) % 360;

      // Determine if we need horizontal or diagonal bands
      if (normalizedAngle === 0) {
        // For horizontal bands (angle = 0), simply divide the height equally
        const bandHeight = height / processedColors.length;

        processedColors.forEach((color, index) => {
          // Calculate band position
          const y = index * bandHeight;

          // Determine alpha value based on activeIndex
          const alpha =
            typeof activeIndex === 'number' ? (index === activeIndex ? 1 : inactiveAlpha) : 1;

          // Add rectangle for this color band
          svgContent += `<rect x="0" y="${y}" width="${width}" height="${bandHeight}" fill="rgb(${getRgbString(color)})" fill-opacity="${alpha}" />`;
        });
      } else if (normalizedAngle === 90) {
        // For vertical bands (angle = 90), divide the width equally
        const bandWidth = width / processedColors.length;

        processedColors.forEach((color, index) => {
          // Calculate band position
          const x = index * bandWidth;

          // Determine alpha value based on activeIndex
          const alpha =
            typeof activeIndex === 'number' ? (index === activeIndex ? 1 : inactiveAlpha) : 1;

          // Add rectangle for this color band
          svgContent += `<rect x="${x}" y="0" width="${bandWidth}" height="${height}" fill="rgb(${getRgbString(color)})" fill-opacity="${alpha}" />`;
        });
      } else {
        // For diagonal bands, use a different approach with properly sized bands
        // Calculate the number of bands needed to cover the entire SVG
        // For diagonal bands, we need more bands than colors to ensure full coverage

        // First, determine how many actual bands we'll need to cover the area
        const diagonal = Math.sqrt(width * width + height * height);
        const angleRadians = (normalizedAngle * Math.PI) / 180;

        // Calculate the band width perpendicular to the angle
        const perpendicularBandWidth = diagonal / processedColors.length;

        // Calculate center of SVG
        const centerX = width / 2;
        const centerY = height / 2;

        // For each color, create a parallelogram/band at the appropriate angle
        processedColors.forEach((color, index) => {
          // Calculate the position along the perpendicular axis
          const distanceFromCenter =
            (index - (processedColors.length - 1) / 2) * perpendicularBandWidth;

          // Calculate the start and end points of the band
          // We'll draw a parallelogram for each band

          // Direction vector perpendicular to the angle
          const perpX = Math.cos(angleRadians + Math.PI / 2);
          const perpY = Math.sin(angleRadians + Math.PI / 2);

          // Direction vector along the angle
          const dirX = Math.cos(angleRadians);
          const dirY = Math.sin(angleRadians);

          // Calculate the corners of the parallelogram
          // We'll create a parallelogram that's wide enough to cover the diagonal
          const halfDiagonal = diagonal / 2;

          // Center point of the band
          const bandCenterX = centerX + distanceFromCenter * perpX;
          const bandCenterY = centerY + distanceFromCenter * perpY;

          // Four corners of the parallelogram
          const x1 = bandCenterX - halfDiagonal * dirX - (perpendicularBandWidth / 2) * perpX;
          const y1 = bandCenterY - halfDiagonal * dirY - (perpendicularBandWidth / 2) * perpY;

          const x2 = bandCenterX + halfDiagonal * dirX - (perpendicularBandWidth / 2) * perpX;
          const y2 = bandCenterY + halfDiagonal * dirY - (perpendicularBandWidth / 2) * perpY;

          const x3 = bandCenterX + halfDiagonal * dirX + (perpendicularBandWidth / 2) * perpX;
          const y3 = bandCenterY + halfDiagonal * dirY + (perpendicularBandWidth / 2) * perpY;

          const x4 = bandCenterX - halfDiagonal * dirX + (perpendicularBandWidth / 2) * perpX;
          const y4 = bandCenterY - halfDiagonal * dirY + (perpendicularBandWidth / 2) * perpY;

          // Determine alpha value based on activeIndex
          const alpha =
            typeof activeIndex === 'number' ? (index === activeIndex ? 1 : inactiveAlpha) : 1;

          // Create a polygon for the band
          svgContent += `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="rgb(${getRgbString(color)})" fill-opacity="${alpha}" />`;
        });
      }

      // Close the SVG
      svgContent += `</svg>`;

      return svgContent;
    }

    case 'angularGradient':
    case 'angularSwatches': {
      // For angular gradients, we'll create a square with angular slices
      let svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            ${creditComment}
        `;

      // Use a clipping path to ensure the result is a square
      svgContent += `
          <defs>
            <clipPath id="squareClip">
              <rect x="0" y="0" width="${width}" height="${height}" />
            </clipPath>
          </defs>
          <g clip-path="url(#squareClip)">
        `;

      const centerX = (width / 2).toFixed(3);
      const centerY = (height / 2).toFixed(3);
      const diagonal = Math.sqrt(width * width + height * height);
      const radius = (diagonal / 2).toFixed(3); // Ensure corners are covered

      // Adjust the starting angle - in SVG, 0 degrees is at 3 o'clock position
      // We need to adjust it based on the input angle
      const startingAngle = angle - 90;

      // For angular swatches, we create angular segments
      if (type === 'angularSwatches') {
        const segmentSize = (360 / processedColors.length).toFixed(3);

        processedColors.forEach((color, index) => {
          // Calculate start and end angles for this segment
          const segmentStartAngle = (startingAngle + index * Number(segmentSize)).toFixed(3);
          const segmentEndAngle = (startingAngle + (index + 1) * Number(segmentSize)).toFixed(3);

          // Convert to radians
          const startRad = (Number(segmentStartAngle) * Math.PI) / 180;
          const endRad = (Number(segmentEndAngle) * Math.PI) / 180;

          // Determine alpha value based on activeIndex
          const alpha =
            typeof activeIndex === 'number' ? (index === activeIndex ? 1 : inactiveAlpha) : 1;

          // Calculate points
          const startX = (Number(centerX) + Number(radius) * Math.cos(startRad)).toFixed(3);
          const startY = (Number(centerY) + Number(radius) * Math.sin(startRad)).toFixed(3);
          const endX = (Number(centerX) + Number(radius) * Math.cos(endRad)).toFixed(3);
          const endY = (Number(centerY) + Number(radius) * Math.sin(endRad)).toFixed(3);

          // Use large arc flag if the segment is more than 180 degrees
          const largeArcFlag = Number(segmentEndAngle) - Number(segmentStartAngle) > 180 ? 1 : 0;

          const pathData = `
              M ${centerX},${centerY}
              L ${startX},${startY}
              A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}
              Z
            `;

          svgContent += `<path d="${pathData}" fill="rgb(${getRgbString(color)})" fill-opacity="${alpha.toFixed(3)}" />`;
        });
      }
      // For smooth angular gradient, create many segments with interpolated colors
      else {
        // Similar approach but with more segments for smoother gradient
        const totalSegments = processedColors.length * 8; // More segments for smoother transition
        const segmentSize = (360 / totalSegments).toFixed(3);

        // Generate interpolated colors for smoother transition
        const interpolatedColors: number[][] = [];
        for (let i = 0; i < totalSegments; i++) {
          const position = (i / totalSegments) * processedColors.length;
          const index = Math.floor(position);
          const nextIndex = (index + 1) % processedColors.length;
          const fraction = position - index;

          const color = [
            processedColors[index][0] * (1 - fraction) + processedColors[nextIndex][0] * fraction,
            processedColors[index][1] * (1 - fraction) + processedColors[nextIndex][1] * fraction,
            processedColors[index][2] * (1 - fraction) + processedColors[nextIndex][2] * fraction,
          ];

          interpolatedColors.push(color);
        }

        // Create segments with the interpolated colors
        interpolatedColors.forEach((color, index) => {
          // Calculate start and end angles for this segment
          const segmentStartAngle = (startingAngle + index * Number(segmentSize)).toFixed(3);
          const segmentEndAngle = (startingAngle + (index + 1) * Number(segmentSize)).toFixed(3);

          // Convert to radians
          const startRad = (Number(segmentStartAngle) * Math.PI) / 180;
          const endRad = (Number(segmentEndAngle) * Math.PI) / 180;

          // Determine if the segment belongs to the active color
          const originalIndex = Math.floor((index / totalSegments) * processedColors.length);
          const alpha =
            typeof activeIndex === 'number'
              ? originalIndex === activeIndex
                ? 1
                : inactiveAlpha
              : 1;

          // Calculate points
          const startX = (Number(centerX) + Number(radius) * Math.cos(startRad)).toFixed(3);
          const startY = (Number(centerY) + Number(radius) * Math.sin(startRad)).toFixed(3);
          const endX = (Number(centerX) + Number(radius) * Math.cos(endRad)).toFixed(3);
          const endY = (Number(centerY) + Number(radius) * Math.sin(endRad)).toFixed(3);

          const largeArcFlag = Number(segmentEndAngle) - Number(segmentStartAngle) > 180 ? 1 : 0;

          const pathData = `
              M ${centerX},${centerY}
              L ${startX},${startY}
              A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}
              Z
            `;

          svgContent += `<path d="${pathData}" fill="rgb(${getRgbString(color)})" fill-opacity="${alpha.toFixed(3)}" />`;
        });
      }

      // Close the clipping group and SVG
      svgContent += `
          </g>
        </svg>
        `;

      return svgContent;
    }

    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        ${creditComment}
      </svg>`;
  }
}
