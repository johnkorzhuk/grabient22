# Example 1: Events

With react-konva you can attach any events that Konva supports to canvas nodes

To do that you can use the onEventName scheme, like onMouseDown for mousedown, onDragEnd for dragend, etc.

For the full list of events take a look into the on() method documentation.

In this demo you can see how we are using dragstart and dragend events.

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Star, Text } from 'react-konva';

function generateShapes() {
  return [...Array(10)].map((_, i) => ({
    id: i.toString(),
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    rotation: Math.random() * 180,
    isDragging: false,
  }));
}

const INITIAL_STATE = generateShapes();

const App = () => {
  const [stars, setStars] = React.useState(INITIAL_STATE);

  const handleDragStart = (e) => {
    const id = e.target.id();
    setStars(
      stars.map((star) => {
        return {
          ...star,
          isDragging: star.id === id,
        };
      })
    );
  };
  const handleDragEnd = (e) => {
    setStars(
      stars.map((star) => {
        return {
          ...star,
          isDragging: false,
        };
      })
    );
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Text text="Try to drag a star" />
        {stars.map((star) => (
          <Star
            key={star.id}
            id={star.id}
            x={star.x}
            y={star.y}
            numPoints={5}
            innerRadius={20}
            outerRadius={40}
            fill="#89b717"
            opacity={0.8}
            draggable
            rotation={star.rotation}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.6}
            shadowOffsetX={star.isDragging ? 10 : 5}
            shadowOffsetY={star.isDragging ? 10 : 5}
            scaleX={star.isDragging ? 1.2 : 1}
            scaleY={star.isDragging ? 1.2 : 1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </Layer>
    </Stage>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

# Example 2:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Star, Text } from 'react-konva';

function generateShapes() {
  return [...Array(10)].map((_, i) => ({
    id: i.toString(),
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    rotation: Math.random() * 180,
    isDragging: false,
  }));
}

const INITIAL_STATE = generateShapes();

const App = () => {
  const [stars, setStars] = React.useState(INITIAL_STATE);

  const handleDragStart = (e) => {
    const id = e.target.id();
    setStars(
      stars.map((star) => {
        return {
          ...star,
          isDragging: star.id === id,
        };
      })
    );
  };
  const handleDragEnd = (e) => {
    setStars(
      stars.map((star) => {
        return {
          ...star,
          isDragging: false,
        };
      })
    );
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        <Text text="Try to drag a star" />
        {stars.map((star) => (
          <Star
            key={star.id}
            id={star.id}
            x={star.x}
            y={star.y}
            numPoints={5}
            innerRadius={20}
            outerRadius={40}
            fill="#89b717"
            opacity={0.8}
            draggable
            rotation={star.rotation}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.6}
            shadowOffsetX={star.isDragging ? 10 : 5}
            shadowOffsetY={star.isDragging ? 10 : 5}
            scaleX={star.isDragging ? 1.2 : 1}
            scaleY={star.isDragging ? 1.2 : 1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </Layer>
    </Stage>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

# Example 3: Basic shapes
All react-konva components correspond to Konva components of the same name.
All the parameters available for Konva objects are valid props for
corresponding react-konva components, unless noted otherwise.

Core shapes are: Rect, Circle, Ellipse, Line, Image, Text, TextPath, Star,
Label, SVG Path, RegularPolygon. You can also create custom shapes.

```tsx
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

# Example 4: Custom shapes

To create a custom shape with react-konva, we should use the Shape component.

When creating a custom shape, we need to define a drawing function that is passed to a Konva.Canvas renderer.

We can use the renderer to access the HTML5 Canvas context, and to use special methods like context.fillStrokeShape(shape) which automatically handle filling, stroking, and applying shadows.

```tsx
import React, { Component } from 'react';
import Konva from 'konva';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Shape } from 'react-konva';

class App extends Component {
  render() {
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Shape
            width={260}
            height={170}
            sceneFunc={function (context, shape) {
              const width = shape.width();
              const height = shape.height();
              context.beginPath();
              context.moveTo(0, 0);
              context.lineTo(width - 40, height - 90);
              context.quadraticCurveTo(width - 110, height - 70, width, height);
              context.closePath();

              // (!) Konva specific method, it is very important
              context.fillStrokeShape(shape);
            }}
            fill="#00D2FF"
            stroke="black"
            strokeWidth={4}
          />
        </Layer>
      </Stage>
    );
  }
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

Example 5: Images
If you take a look into the image tutorial and API docs you will see that you need to use a window.Image instance as the image attribute for Konva.Image. So you need to create and download it manually.

Also, you can use the brand new react hook use-image to handle loading your images or you can use the lifecycle methods of React and create your own custom component.

```tsx
import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Image } from 'react-konva';
import useImage from 'use-image';

// the first very simple and recommended way:
const LionImage = () => {
  const [image] = useImage('https://konvajs.org/assets/lion.png');
  return <Image image={image} />;
};

// custom component that will handle loading image from url
// you may add more logic here to handle "loading" state
// or if loading is failed
// VERY IMPORTANT NOTES:
// at first we will set image state to null
// and then we will set it to native image instance when it is loaded
class URLImage extends React.Component {
  state = {
    image: null,
  };
  componentDidMount() {
    this.loadImage();
  }
  componentDidUpdate(oldProps) {
    if (oldProps.src !== this.props.src) {
      this.loadImage();
    }
  }
  componentWillUnmount() {
    this.image.removeEventListener('load', this.handleLoad);
  }
  loadImage() {
    // save to "this" to remove "load" handler on unmount
    this.image = new window.Image();
    this.image.src = this.props.src;
    this.image.addEventListener('load', this.handleLoad);
  }
  handleLoad = () => {
    // after setState react-konva will update canvas and redraw the layer
    // because "image" property is changed
    this.setState({
      image: this.image,
    });
    // if you keep same image object during source updates
    // you will have to update layer manually:
    // this.imageNode.getLayer().batchDraw();
  };
  render() {
    return (
      <Image
        x={this.props.x}
        y={this.props.y}
        image={this.state.image}
        ref={(node) => {
          this.imageNode = node;
        }}
      />
    );
  }
}

class App extends Component {
  render() {
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <URLImage src="https://konvajs.org/assets/yoda.jpg" x={150} />
          <LionImage />
        </Layer>
      </Stage>
    );
  }
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

# Example 6: Drag and drop
To enable drag&drop for any node on the canvas you just need to pass the draggable property into the component.

When you drag&drop a shape it is recommended to save its position into your app store. You can use the onDragMove and onDragEnd events for that purpose.

```tsx
import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Text } from 'react-konva';

class App extends Component {
  state = {
    isDragging: false,
    x: 50,
    y: 50,
  };

  render() {
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Text
            text="Draggable Text"
            x={this.state.x}
            y={this.state.y}
            draggable
            fill={this.state.isDragging ? 'green' : 'black'}
            onDragStart={() => {
              this.setState({
                isDragging: true,
              });
            }}
            onDragEnd={(e) => {
              this.setState({
                isDragging: false,
                x: e.target.x(),
                y: e.target.y(),
              });
            }}
          />
        </Layer>
      </Stage>
    );
  }
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

# Example 7: Refs and Konva Nodes
In some cases you may need to use the Konva API directly. For example for exporting canvases or animations.

There are two ways to access Konva nodes/shapes from react-konva.

Using the refs API.
You can use the refs API to get access to a Konva node.

```tsx
import { Circle } from 'react-konva';
const App = () => {
  const shapeRef = React.useRef(null);
  React.useEffect(() => {
    // it will log `Konva.Circle` instance
    console.log(shapeRef.current);
  });
  return <Circle ref={shapeRef} />;
}
```
Using an event object inside of the event callback
Another common way to access a Konva node is to just use an event object that you have as an argument in any event:
```tsx
import { Circle } from 'react-konva';
const App = () => {
  const handleClick = (e) => {
    // logs clicked Konva.Circle instance
    console.log(e.target);
  }
  return <Circle onClick={handleClick} />;
}
```

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Circle, Text } from 'react-konva';

const pulseShape = (shape) => {
  // use Konva methods to animate a shape
  shape.to({
    scaleX: 1.5,
    scaleY: 1.5,
    onFinish: () => {
      shape.to({
        scaleX: 1,
        scaleY: 1,
      });
    },
  });
};

const App = () => {
  const circleRef = React.useRef(null);

  const handleStageClick = () => {
    // this event demonstrates how to access Konva node using ref
    const shape = circleRef.current;
    pulseShape(shape);
  };

  const handleCircleClick = (e) => {
    // another way to access Konva nodes is to just use event object
    const shape = e.target;
    pulseShape(shape);
    // prevent click on stage
    e.cancelBubble = true;
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onClick={handleStageClick}
      onTap={handleStageClick}
    >
      <Layer>
        <Text text="Click on any place to see an animation" />
        <Circle
          ref={circleRef}
          x={window.innerWidth / 2}
          y={window.innerHeight / 2}
          radius={80}
          fill="red"
          onClick={handleCircleClick}
          onTap={handleCircleClick}
        />
      </Layer>
    </Stage>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

Example 8: Transformer 
Currently there is no good, pure declarative “react-way” to use the Transformer tool.
But you can still use it with some small manual requests to the Konva nodes.
And it will work just fine.

The Idea: you need to create a Konva.Transformer node, and attach it to the required node manually.

Instructions: Click on one of the shapes to select it.

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Rect, Transformer } from 'react-konva';

const Rectangle = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();

  React.useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Rect
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            // set minimal value
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const initialRectangles = [
  {
    x: 10,
    y: 10,
    width: 100,
    height: 100,
    fill: 'red',
    id: 'rect1',
  },
  {
    x: 150,
    y: 150,
    width: 100,
    height: 100,
    fill: 'green',
    id: 'rect2',
  },
];

const App = () => {
  const [rectangles, setRectangles] = React.useState(initialRectangles);
  const [selectedId, selectShape] = React.useState(null);

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={checkDeselect}
      onTouchStart={checkDeselect}
    >
      <Layer>
        {rectangles.map((rect, i) => {
          return (
            <Rectangle
              key={i}
              shapeProps={rect}
              isSelected={rect.id === selectedId}
              onSelect={() => {
                selectShape(rect.id);
              }}
              onChange={(newAttrs) => {
                const rects = rectangles.slice();
                rects[i] = newAttrs;
                setRectangles(rects);
              }}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

# DOM Portal
How to put DOM elements (like inputs or divs) inside of a Konva stage?
If you want to have some DOM nodes as part of your canvas tree you can use <Html /> component from react-konva-utils package.

Remember that DOM nodes are not direct children of Konva containers. <Html /> is just a wrapper to work with a Portal-like API. HTML content will be not visible if you try to export canvas as image.

```tsx
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Stage, Layer, Rect } from 'react-konva';
import { Html } from 'react-konva-utils';

class App extends Component {
  render() {
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Html>
            <input placeholder="DOM input from Konva nodes" />
          </Html>
          <Rect
            x={20}
            y={20}
            width={50}
            height={50}
            fill="red"
            shadowBlur={5}
          />
        </Layer>
      </Stage>
    );
  }
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
```

# Export into Image
How to save a drawing from react-konva?
To export any Konva node into an image you can either use the node.toDataURL() or the node.toImage() API. Take a look into the vanilla Konva image export demo.

You will need to use the Refs API to access a Konva node directly in order to call these methods.

```tsx
import React, { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Rect } from 'react-konva';

// function from https://stackoverflow.com/a/15832662/512042
function downloadURI(uri, name) {
  var link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const App = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const stageRef = React.useRef(null);

  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    console.log(uri);
    // we also can save uri as file
    // but in the demo on Konva website it will not work
    // because of iframe restrictions
    // but feel free to use it in your apps:
    // downloadURI(uri, 'stage.png');
  };

  return (
    <Fragment>
      <button onClick={handleExport}>Click here to log stage data URL</button>
      <Stage width={width} height={height} ref={stageRef}>
        <Layer>
          <Rect x={0} y={0} width={80} height={80} fill="red" />
          <Rect x={width - 80} y={0} width={80} height={80} fill="red" />
          <Rect
            x={width - 80}
            y={height - 80}
            width={80}
            height={80}
            fill="red"
          />
          <Rect x={0} y={height - 80} width={80} height={80} fill="red" />
        </Layer>
      </Stage>
    </Fragment>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

# Changing zIndex
How to change the zIndex and reorder components in react-konva?
When you are working with Konva directly you have many methods to change the order of nodes like node.zIndex(5), node.moveToTop(), etc. Tutorial.

But it is not recommended to use these methods when you are working with the React framework.

react-konva is trying to follow the order of the nodes exactly as you described them in render(). So instead of changing the zIndex manually, you just need to update the state of the app correctly, so the render() returns the correct order.

Don’t use the zIndex for your canvas components.

If you want to temporarily move a node into another container, for example when you want to show an overlay, take a look into the Canvas Portal demo.

Instructions: Try to drag a circle. See how it goes to the top. We are doing this by manipulating the state so that the render() method returns the correct order.

```tsx
import React, { Component } from 'react';
import Konva from 'konva';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Circle } from 'react-konva';

function generateItems() {
  const items = [];
  for (let i = 0; i < 10; i++) {
    items.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      id: 'node-' + i,
      color: Konva.Util.getRandomColor(),
    });
  }
  return items;
}

class App extends Component {
  state = {
    items: generateItems(),
  };
  handleDragStart = (e) => {
    const id = e.target.name();
    const items = this.state.items.slice();
    const item = items.find((i) => i.id === id);
    const index = items.indexOf(item);
    // remove from the list:
    items.splice(index, 1);
    // add to the top
    items.push(item);
    this.setState({
      items,
    });
  };
  onDragEnd = (e) => {
    const id = e.target.name();
    const items = this.state.items.slice();
    const item = this.state.items.find((i) => i.id === id);
    const index = this.state.items.indexOf(item);
    // update item position
    items[index] = {
      ...item,
      x: e.target.x(),
      y: e.target.y(),
    };
    this.setState({ items });
  };
  render() {
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {this.state.items.map((item) => (
            <Circle
              key={item.id}
              name={item.id}
              draggable
              x={item.x}
              y={item.y}
              fill={item.color}
              radius={50}
              onDragStart={this.handleDragStart}
              onDragEnd={this.handleDragEnd}
            />
          ))}
        </Layer>
      </Stage>
    );
  }
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

# Drop DOM image into Canvas

You can use native html5 drag&drop features to drop images (or other elements) from the page into the canvas area.

Note: this demo may not work well as it is injected into the page as an iframe.

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Image } from 'react-konva';
import useImage from 'use-image';

const URLImage = ({ image }) => {
  const [img] = useImage(image.src);
  return (
    <Image
      image={img}
      x={image.x}
      y={image.y}
      // I will use offset to set origin to the center of the image
      offsetX={img ? img.width / 2 : 0}
      offsetY={img ? img.height / 2 : 0}
    />
  );
};

const App = () => {
  const dragUrl = React.useRef();
  const stageRef = React.useRef();
  const [images, setImages] = React.useState([]);
  return (
    <div>
      Try to trag and image into the stage:
      <br />
      <img
        alt="lion"
        src="https://konvajs.org/assets/lion.png"
        draggable="true"
        onDragStart={(e) => {
          dragUrl.current = e.target.src;
        }}
      />
      <div
        onDrop={(e) => {
          e.preventDefault();
          // register event position
          stageRef.current.setPointersPositions(e);
          // add image
          setImages(
            images.concat([
              {
                ...stageRef.current.getPointerPosition(),
                src: dragUrl.current,
              },
            ])
          );
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          style={{ border: '1px solid grey' }}
          ref={stageRef}
        >
          <Layer>
            {images.map((image) => {
              return <URLImage image={image} />;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

# Free Drawing
This demo shows how to implement a free drawing app the “react-way” with full vector representation.

Such an implementation should work ok for many whiteboard apps. It allows you to simply add undo/redo functions and save the full state to the backend.

It will get slower if you have too many lines in the state. So you will have to do some extra optimizations if you want to enable drawings of hundreds or thousands of lines.

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Stage, Layer, Line, Text } from 'react-konva';

const App = () => {
  const [tool, setTool] = React.useState('pen');
  const [lines, setLines] = React.useState([]);
  const isDrawing = React.useRef(false);

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
      >
        <Layer>
          <Text text="Just start drawing" x={5} y={30} />
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#df4b26"
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>
      <select
        value={tool}
        onChange={(e) => {
          setTool(e.target.value);
        }}
      >
        <option value="pen">Pen</option>
        <option value="eraser">Eraser</option>
      </select>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```