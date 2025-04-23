# How to Limit Size Changes of a Shape in Konva

## How to limit size changes of a shape?

To limit or change resize and transform behavior you can use `boundBoxFunc` property.  
It works a bit similar to [dragBoundFunc](/docs/drag_and_drop/Simple_Drag_Bounds.html).

**Instructions:** Try to resize a shape. You will see that its width is limited to 200.

Also you can control movement of every anchors individually. See [Resize Snap Demo](https://konvajs.org/docs/select_and_transform/Resize_Snaps.html).

### Konva Shape Transform and Size Limits Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Transform Limits Demo</title>
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
  
      var rect = new Konva.Rect({
        x: 160,
        y: 60,
        width: 100,
        height: 90,
        fill: 'red',
        name: 'rect',
        stroke: 'black',
        draggable: true,
      });
      layer.add(rect);
  
      var MAX_WIDTH = 200;
      // create new transformer
      var tr = new Konva.Transformer({
        boundBoxFunc: function (oldBoundBox, newBoundBox) {
          // "boundBox" is an object with
          // x, y, width, height and rotation properties
          // transformer tool will try to fit nodes into that box
  
          // the logic is simple, if new width is too big
          // we will return previous state
          if (Math.abs(newBoundBox.width) > MAX_WIDTH) {
            return oldBoundBox;
          }
  
          return newBoundBox;
        },
      });
      layer.add(tr);
      tr.nodes([rect]);
    </script>
  </body>
</html>
```

[Prev](/docs/select_and_transform/Transform_Events.html "Transform Events")[Next](/docs/select_and_transform/Rotation_Snaps.html "Rotation Snaps")

Enjoying Konva? Please consider to [support](/docs/donate.html) the project.