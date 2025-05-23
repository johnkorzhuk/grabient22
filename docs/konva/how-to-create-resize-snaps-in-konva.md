# How to Create Resize Snaps in Konva

## Implementing Resize Snapping with Konva Transformer

In some application, you may want to snap rotation near some values. Snapping makes a shape "sticky" near provided values and works like rounding.  
You can control anchor position behavior with [anchorDragBoundFunc](https://konvajs.org/api/Konva.Transformer.html#anchorDragBoundFunc__anchor) method.

```javascript
transformer.anchorDragBoundFunc(function (oldAbsPos, newAbsPos, event) {  
  // limit any another position on the x axis  
  return {  
    x: 0,  
    y: newAbsolutePosition.y,  
  };  
});  
```

In the demo we will try to implement snapping for resizing. There are many implementations possible.

**Instructions: Try to resize a shape. You will see how transformer is trying to snap to guide lines.**

### Konva Shape Resize Snap Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Resize Snap Demo</title>
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
  
      const layer = new Konva.Layer();
      stage.add(layer);
  
      const xSnaps = Math.round(stage.width() / 100);
      const ySnaps = Math.round(stage.height() / 100);
      const cellWidth = stage.width() / xSnaps;
      const cellHeight = stage.height() / ySnaps;
  
      for (var i = 0; i < xSnaps; i++) {
        layer.add(
          new Konva.Line({
            x: i * cellWidth,
            points: [0, 0, 0, stage.height()],
            stroke: 'rgba(0, 0, 0, 0.2)',
            strokeWidth: 1,
          })
        );
      }
  
      for (var i = 0; i < ySnaps; i++) {
        layer.add(
          new Konva.Line({
            y: i * cellHeight,
            points: [0, 0, stage.width(), 0],
            stroke: 'rgba(0, 0, 0, 0.2)',
            strokeWidth: 1,
          })
        );
      }
  
      const rect = new Konva.Rect({
        x: 90,
        y: 90,
        width: 100,
        height: 100,
        fill: 'red',
        draggable: true,
      });
      layer.add(rect);
  
      const tr = new Konva.Transformer({
        nodes: [rect],
        anchorDragBoundFunc: function (oldPos, newPos, event) {
          // oldPos - is old absolute position of the anchor
          // newPos - is a new (possible) absolute position of the anchor based on pointer position
          // it is possible that anchor will have a different absolute position after this function
          // because every anchor has its own limits on position, based on resizing logic
  
          // do not snap rotating point
          if (tr.getActiveAnchor() === 'rotater') {
            return newPos;
          }
  
          const dist = Math.sqrt(
            Math.pow(newPos.x - oldPos.x, 2) + Math.pow(newPos.y - oldPos.y, 2)
          );
  
          // do not do any snapping with new absolute position (pointer position)
          // is too far away from old position
          if (dist > 10) {
            return newPos;
          }
  
          const closestX = Math.round(newPos.x / cellWidth) * cellWidth;
          const diffX = Math.abs(newPos.x - closestX);
  
          const closestY = Math.round(newPos.y / cellHeight) * cellHeight;
          const diffY = Math.abs(newPos.y - closestY);
  
          const snappedX = diffX < 10;
          const snappedY = diffY < 10;
  
          // a bit different snap strategies based on snap direction
          // we need to reuse old position for better UX
          if (snappedX && !snappedY) {
            return {
              x: closestX,
              y: oldPos.y,
            };
          } else if (snappedY && !snappedX) {
            return {
              x: oldPos.x,
              y: closestY,
            };
          } else if (snappedX && snappedY) {
            return {
              x: closestX,
              y: closestY,
            };
          }
          return newPos;
        },
      });
      layer.add(tr);
    </script>
  </body>
</html>
```

[Prev](/docs/select_and_transform/Rotation_Snaps.html "Rotation Snaps")[Next](/docs/select_and_transform/Stop_Transform.html "Stop Transform")

Enjoying Konva? Please consider to [support](/docs/donate.html) the project.