# Managing Z-Index in React Konva

## How to Change Component Order and Z-Index

When working with Konva directly, you have several methods to change the order of nodes:
- `node.zIndex(5)`
- `node.moveToTop()`
- And others (see the [Konva ordering tutorial](https://konvajs.org/docs/drag_and_drop/Drag_a_Group.html))

However, when using React Konva, it's **not recommended** to use these methods directly. Instead, React Konva follows the order of nodes as defined in your `render()` method.

## Best Practices

1. **Don't use manual zIndex methods** - Instead of changing the zIndex manually, update your component's state so that the `render()` method returns nodes in the correct order.

2. **Avoid using zIndex property** - Don't rely on the zIndex property for your canvas components.

3. **For overlays** - If you need to temporarily move a node to another container (e.g., for overlays), consider using the Canvas Portal pattern.

## Example: Drag to Bring to Front

The example below demonstrates how to bring a circle to the front when dragging it. This is achieved by manipulating the state so that the `render()` method returns the circles in the correct order.

```jsx
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

**Instructions:** Try to drag a circle. Notice how it moves to the top layer. This is achieved by manipulating the state so that the `render()` method returns the circles in the correct order.
