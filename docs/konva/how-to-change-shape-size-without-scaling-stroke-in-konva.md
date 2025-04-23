# How to Change Shape Size Without Scaling Stroke in Konva

## Do you want to change size of a shape without changing its stroke size?

Remember, that `Konva.Transformer` is changing `scaleX` and `scaleY` properties of a node.  
By default, if you are transforming a shape, its stroke will be scaled too. It some cases that is not a good behavior.

There are two ways to prevent stroke scaling: (1) reset scale of a shape or (2) use combination of `shape.strokeScaleEnabled(false)` and `transformer.ignoreStroke(false)`.

**Instructions: there are two rectangles to resize. The green one will reset it scale. The red one will just disable stroke scaling.**

### Konva Ignore Stroke on Transform Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Resize Text Demo</title>
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
        x: 50,
        y: 60,
        width: 100,
        height: 100,
        draggable: true,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 5,
      });
      layer.add(rect1);
  
      var tr1 = new Konva.Transformer({
        nodes: [rect1],
        // ignore stroke in size calculations
        ignoreStroke: true,
        // manually adjust size of transformer
        padding: 5,
      });
      layer.add(tr1);
  
      // first way to skip stroke resize, is just by resetting scale
      // and setting width/height instead
      rect1.on('transform', () => {
        rect1.setAttrs({
          width: Math.max(rect1.width() * rect1.scaleX(), 5),
          height: Math.max(rect1.height() * rect1.scaleY(), 5),
          scaleX: 1,
          scaleY: 1,
        });
      });
  
      // another solution is to use combination of strokeScaleEnabled and ignoreStroke
      var rect2 = new Konva.Rect({
        x: 250,
        y: 60,
        width: 100,
        height: 100,
        draggable: true,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 5,
        // do not scale strokes
        strokeScaleEnabled: false,
      });
      layer.add(rect2);
  
      var tr2 = new Konva.Transformer({
        nodes: [rect2],
        // ignore stroke in size calculations
        ignoreStroke: true,
        // manually adjust size of transformer
        padding: 5,
      });
      layer.add(tr2);
    </script>
  </body>
</html>