## HTML5 Canvas Shape Select, Resize, and Rotate Basic Example

`Transformer` is a special kind of `Konva.Group`. It allows you easily resize and rotate any node or set of nodes.

To enable it you need to:

1. Create new instance with `new Konva.Transformer()`
2. Add it to layer
3. Attach to node with `transformer.nodes([shape]);`
4. Update the layer with `layer.batchDraw()`

_Note:_ Transforming tool is not changing `width` and `height` properties of nodes when you resize them. Instead it changes `scaleX` and `scaleY` properties.

**Instructions:** Try to resize and rotate shapes. Click on empty area to remove selection. Use SHIFT or CTRL to add/remove shapes into/from selection. Try to select area on a canvas.

### Konva Shape Transform and Selection Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Select and Transform Demo</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #f0f0f0;
      }
    </style>
  </head>
  
  <body>
    <div id="container"></div>
    <script>
      var width = window.innerWidth;
      var height = window.innerHeight;
  
      var stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height,
      });
  
      var layer = new Konva.Layer();
      stage.add(layer);
  
      var rect1 = new Konva.Rect({
        x: 60,
        y: 60,
        width: 100,
        height: 90,
        fill: 'red',
        name: 'rect',
        draggable: true,
      });
      layer.add(rect1);
  
      var rect2 = new Konva.Rect({
        x: 250,
        y: 100,
        width: 150,
        height: 90,
        fill: 'green',
        name: 'rect',
        draggable: true,
      });
      layer.add(rect2);
  
      var tr = new Konva.Transformer();
      layer.add(tr);
  
      // by default select all shapes
      tr.nodes([rect1, rect2]);
  
      // add a new feature, lets add ability to draw selection rectangle
      var selectionRectangle = new Konva.Rect({
        fill: 'rgba(0,0,255,0.5)',
        visible: false,
        // disable events to not interrupt with events
        listening: false,
      });
      layer.add(selectionRectangle);
  
      var x1, y1, x2, y2;
      var selecting = false;
      stage.on('mousedown touchstart', (e) => {
        // do nothing if we mousedown on any shape
        if (e.target !== stage) {
          return;
        }
        e.evt.preventDefault();
        x1 = stage.getPointerPosition().x;
        y1 = stage.getPointerPosition().y;
        x2 = stage.getPointerPosition().x;
        y2 = stage.getPointerPosition().y;
  
        selectionRectangle.width(0);
        selectionRectangle.height(0);
        selecting = true;
      });
  
      stage.on('mousemove touchmove', (e) => {
        // do nothing if we didn't start selection
        if (!selecting) {
          return;
        }
        e.evt.preventDefault();
        x2 = stage.getPointerPosition().x;
        y2 = stage.getPointerPosition().y;
  
        selectionRectangle.setAttrs({
          visible: true,
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.abs(x2 - x1),
          height: Math.abs(y2 - y1),
        });
      });
  
      stage.on('mouseup touchend', (e) => {
        // do nothing if we didn't start selection
        selecting = false;
        if (!selectionRectangle.visible()) {
          return;
        }
        e.evt.preventDefault();
        // update visibility in timeout, so we can check it in click event
        selectionRectangle.visible(false);
        var shapes = stage.find('.rect');
        var box = selectionRectangle.getClientRect();
        var selected = shapes.filter((shape) =>
          Konva.Util.haveIntersection(box, shape.getClientRect())
        );
        tr.nodes(selected);
      });
  
      // clicks should select/deselect shapes
      stage.on('click tap', function (e) {
        // if we are selecting with rect, do nothing
        if (selectionRectangle.visible()) {
          return;
        }
  
        // if click on empty area - remove all selections
        if (e.target === stage) {
          tr.nodes([]);
          return;
        }
  
        // do nothing if clicked NOT on our rectangles
        if (!e.target.hasName('rect')) {
          return;
        }
  
        // do we pressed shift or ctrl?
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = tr.nodes().indexOf(e.target) >= 0;
  
        if (!metaPressed && !isSelected) {
          // if no key pressed and the node is not selected
          // select just one
          tr.nodes([e.target]);
        } else if (metaPressed && isSelected) {
          // if we pressed keys and node was selected
          // we need to remove it from selection:
          const nodes = tr.nodes().slice(); // use slice to have new copy of array
          // remove node from array
          nodes.splice(nodes.indexOf(e.target), 1);
          tr.nodes(nodes);
        } else if (metaPressed && !isSelected) {
          // add the node into selection
          const nodes = tr.nodes().concat([e.target]);
          tr.nodes(nodes);
        }
      });
    </script>
  </body>
</html>