type CollectionStyle = 'linearGradient' | 'linearSwatches' | 'angularGradient' | 'angularSwatches';

export function getCollectionStyleCSS(
  type: CollectionStyle = 'linearGradient',
  processedColors: number[][],
  angle: number = 90,
  creditProps: { seed: string; searchString: string },
  activeIndex?: number | null,
): { cssString: string; styles: React.CSSProperties; gradientString: string } {
  // Convert RGB values from 0-1 range to 0-255 range for CSS
  const getRgbString = (color: number[]) =>
    `${Math.round(color[0] * 255)}, ${Math.round(color[1] * 255)}, ${Math.round(color[2] * 255)}`;

  // Use the RGB string with alpha
  const getRgbaString = (color: number[], alpha: number = 1) =>
    `rgba(${getRgbString(color)}, ${alpha.toFixed(3)})`;

  // Alpha value for inactive color stops when activeIndex exists
  const inactiveAlpha = 0.5;

  // Credit comment for gradient inspiration
  const creditComment = `/* https://grabient.com/${creditProps.seed}${creditProps.searchString} */`;

  if (processedColors.length === 0) {
    return {
      cssString: `${creditComment}\n\nbackground: none`,
      styles: { background: 'none' },
      gradientString: '',
    };
  }

  if (processedColors.length === 1) {
    const bgValue = getRgbaString(processedColors[0]);
    return {
      cssString: `${creditComment}\n\nbackground: ${bgValue}`,
      styles: { background: bgValue },
      gradientString: '',
    };
  }

  switch (type) {
    case 'linearGradient': {
      // For linear gradients, create a smooth transition with configurable angle
      let gradientString = `linear-gradient(${angle}deg,`;

      // If activeIndex is specified, handle special rendering
      if (
        typeof activeIndex === 'number' &&
        activeIndex >= 0 &&
        activeIndex < processedColors.length
      ) {
        const segmentSize = (100 / processedColors.length).toFixed(3);
        const activeStartPos = (activeIndex * Number(segmentSize)).toFixed(3);
        const activeEndPos = ((activeIndex + 1) * Number(segmentSize)).toFixed(3);

        // Create a gradient with a solid color segment for the active index
        if (activeIndex === 0) {
          // If first segment is active
          // Start with the active segment with hard stops
          gradientString += ` ${getRgbaString(processedColors[0])} 0%,`;
          gradientString += ` ${getRgbaString(processedColors[0])} ${activeEndPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[0], inactiveAlpha)} ${activeEndPos}%`;

          // Continue with the rest of the gradient with reduced alpha
          for (let i = 1; i < processedColors.length; i++) {
            const position = ((i / (processedColors.length - 1)) * 100).toFixed(3);
            gradientString += `,`;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${position}%`;
          }
        } else if (activeIndex === processedColors.length - 1) {
          // If last segment is active
          // Start with reduced alpha gradient
          for (let i = 0; i < processedColors.length - 1; i++) {
            const position = ((i / (processedColors.length - 1)) * 100).toFixed(3);
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${position}%`;
            gradientString += ',';
          }

          // Add the active segment
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeStartPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeStartPos}%`;
        } else {
          // If middle segment is active
          // Start with reduced alpha gradient up to active segment
          for (let i = 0; i < activeIndex; i++) {
            const position = ((i / (processedColors.length - 1)) * 100).toFixed(3);
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${position}%`;
            gradientString += ',';
          }

          // Add the active segment with hard stops
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeStartPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeStartPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeEndPos}%,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeEndPos}%`;

          // Continue with the rest of the gradient with reduced alpha
          for (let i = activeIndex + 1; i < processedColors.length; i++) {
            const position = ((i / (processedColors.length - 1)) * 100).toFixed(3);
            gradientString += `,`;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${position}%`;
          }
        }
      } else {
        // Standard gradient rendering
        processedColors.forEach((color, index) => {
          const position = ((index / (processedColors.length - 1)) * 100).toFixed(3);
          gradientString += ` ${getRgbaString(color)} ${position}%`;
          if (index < processedColors.length - 1) {
            gradientString += ',';
          }
        });
      }

      gradientString += ')';
      return {
        cssString: `${creditComment}\n\nbackground: ${gradientString}`,
        styles: { background: gradientString },
        gradientString,
      };
    }

    case 'linearSwatches': {
      // For swatches, create distinct color blocks with configurable angle
      let gradientString = `linear-gradient(${angle}deg,`;

      // Calculate the segment size
      const segmentSize = 100 / processedColors.length;

      processedColors.forEach((color, index) => {
        // Calculate start and end positions for this color
        const startPos = (index * Number(segmentSize)).toFixed(3);
        const endPos = ((index + 1) * Number(segmentSize)).toFixed(3);

        // Determine alpha value based on activeIndex
        const alpha =
          typeof activeIndex === 'number' ? (index === activeIndex ? 1 : inactiveAlpha) : 1;

        // Add color with its segment position
        if (index === 0) {
          // For first color, use single position
          gradientString += ` ${getRgbaString(color, alpha)} ${startPos}%`;
        } else {
          // For subsequent colors, add a hard stop
          gradientString += `, ${getRgbaString(color, alpha)} ${startPos}%`;
        }

        // If not the last color, add end position
        if (index < processedColors.length - 1) {
          gradientString += `, ${getRgbaString(color, alpha)} ${endPos}%`;
        } else {
          // Last color needs its endpoint too
          gradientString += ` ${endPos}%`;
        }
      });

      gradientString += ')';
      return {
        cssString: `${creditComment}\n\nbackground: ${gradientString}`,
        styles: { background: gradientString },
        gradientString,
      };
    }

    case 'angularGradient': {
      // For angular gradients, create a smooth transition using conic gradient with configurable starting angle
      let gradientString = `conic-gradient(from ${angle}deg,`;

      // If activeIndex is specified, handle special rendering
      if (
        typeof activeIndex === 'number' &&
        activeIndex >= 0 &&
        activeIndex < processedColors.length
      ) {
        const segmentSize = (360 / processedColors.length).toFixed(2);
        const activeStartAngle = (activeIndex * Number(segmentSize)).toFixed(3);
        const activeEndAngle = ((activeIndex + 1) * Number(segmentSize)).toFixed(3);

        // Create a gradient with a solid color segment for the active index
        if (activeIndex === 0) {
          // If first segment is active
          // Start with the active segment with hard stops
          gradientString += ` ${getRgbaString(processedColors[0])} 0deg,`;
          gradientString += ` ${getRgbaString(processedColors[0])} ${activeEndAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[0], inactiveAlpha)} ${activeEndAngle}deg`;

          // Continue with the rest of the gradient with reduced alpha
          for (let i = 1; i < processedColors.length; i++) {
            const anglePos = ((i / (processedColors.length - 1)) * 360).toFixed(3);
            gradientString += `,`;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${anglePos}deg`;
          }
        } else if (activeIndex === processedColors.length - 1) {
          // If last segment is active
          // Start with reduced alpha gradient
          for (let i = 0; i < processedColors.length - 1; i++) {
            const anglePos = ((i / (processedColors.length - 1)) * 360).toFixed(3);
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${anglePos}deg`;
            gradientString += ',';
          }

          // Add the active segment
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeStartAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeStartAngle}deg`;
        } else {
          // If middle segment is active
          // Start with reduced alpha gradient up to active segment
          for (let i = 0; i < activeIndex; i++) {
            const anglePos = ((i / (processedColors.length - 1)) * 360).toFixed(3);
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${anglePos}deg`;
            gradientString += ',';
          }

          // Add the active segment with hard stops
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeStartAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeStartAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex])} ${activeEndAngle}deg,`;
          gradientString += ` ${getRgbaString(processedColors[activeIndex], inactiveAlpha)} ${activeEndAngle}deg`;

          // Continue with the rest of the gradient with reduced alpha
          for (let i = activeIndex + 1; i < processedColors.length; i++) {
            const anglePos = ((i / (processedColors.length - 1)) * 360).toFixed(3);
            gradientString += `,`;
            gradientString += ` ${getRgbaString(processedColors[i], inactiveAlpha)} ${anglePos}deg`;
          }
        }
      } else {
        // Standard gradient rendering
        processedColors.forEach((color, index) => {
          const anglePos = ((index / (processedColors.length - 1)) * 360).toFixed(3);
          gradientString += ` ${getRgbaString(color)} ${anglePos}deg`;
          if (index < processedColors.length - 1) {
            gradientString += ',';
          }
        });
      }

      gradientString += ')';
      return {
        cssString: `${creditComment}\n\nbackground: ${gradientString}`,
        styles: { background: gradientString },
        gradientString,
      };
    }

    case 'angularSwatches': {
      // For angular swatches, create distinct angular segments with configurable starting angle
      let gradientString = `conic-gradient(from ${angle}deg,`;

      // Calculate the segment size
      const segmentSize = 360 / processedColors.length;

      processedColors.forEach((color, index) => {
        // Calculate start and end angles for this color
        const startAngle = (index * Number(segmentSize)).toFixed(3);
        const endAngle = ((index + 1) * Number(segmentSize)).toFixed(3);

        // Determine alpha value based on activeIndex
        const alpha =
          typeof activeIndex === 'number' ? (index === activeIndex ? 1 : inactiveAlpha) : 1;

        // Add color with its segment position
        if (index === 0) {
          // For first color, use single position
          gradientString += ` ${getRgbaString(color, alpha)} ${startAngle}deg`;
        } else {
          // For subsequent colors, add a hard stop
          gradientString += `, ${getRgbaString(color, alpha)} ${startAngle}deg`;
        }

        // If not the last color, add end position
        if (index < processedColors.length - 1) {
          gradientString += `, ${getRgbaString(color, alpha)} ${endAngle}deg`;
        } else {
          // Last color needs its endpoint too
          gradientString += ` ${endAngle}deg`;
        }
      });

      gradientString += ')';
      return {
        cssString: `${creditComment}\n\nbackground: ${gradientString}`,
        styles: { background: gradientString },
        gradientString,
      };
    }

    default:
      return {
        cssString: `${creditComment}\nbackground: none`,
        styles: { background: 'none' },
        gradientString: '',
      };
  }
}
