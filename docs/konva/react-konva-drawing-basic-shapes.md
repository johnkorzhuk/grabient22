# Drawing Canvas Shapes with React Konva

## Overview

React Konva components directly correspond to Konva components of the same name. All parameters available for Konva objects are valid props for corresponding React Konva components, unless noted otherwise.

## Available Shapes

Core shapes in React Konva include:
- Rect
- Circle
- Ellipse
- Line
- Image
- Text
- TextPath
- Star
- Label
- SVG Path
- RegularPolygon

You can also create custom shapes as needed.

## Example: Basic Shapes

The following example demonstrates how to create various basic shapes using React Konva:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Rect, Text, Circle, Line } from 'react-konva';

const App = () => {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Text text="Some text on canvas" fontSize={15} />
        <Rect
          x={20}
          y={50}
          width={100}
          height={100}
          fill="red"
          shadowBlur={10}
        />
        <Circle x={200} y={100} radius={50} fill="green" />
        <Line
          x={20}
          y={200}
          points={[0, 0, 100, 0, 100, 100]}
          tension={0.5}
          closed
          stroke="black"
          fillLinearGradientStartPoint={{ x: -50, y: -50 }}
          fillLinearGradientEndPoint={{ x: 50, y: 50 }}
          fillLinearGradientColorStops={[0, 'red', 1, 'yellow']}
        />
      </Layer>
    </Stage>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

This example creates a stage with a text element, a red rectangle with shadow, a green circle, and a line with gradient fill.
