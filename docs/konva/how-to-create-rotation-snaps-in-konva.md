# How to Create Rotation Snaps in Konva

## Rotation Snapping in Konva Transformer

In some application, you may want to snap rotation near some values. Snapping makes a shape "sticky" near provided values and works like rounding.

Most common snaps are 0, 45, 90, 135, 180, etc decreases. Snaps we allow to simpler set rotation it exactly these values.

For instance, if you have snap point at 45 deg, a user will be not able to set rotation to 43 deg. It will be rounded to 45 deg. But a user still will be able to set rotation to 35 deg, as it is too far from 45 so it will be not snapped.

**Instructions:** Try to rotate a shape. See snapping at 0, 90, 180 and 270 deg.

### Konva Shape Rotation Snap Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Rotation snap Demo</title>
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
  
      var text = new Konva.Text({
        x: 50,
        y: 70,
        fontSize: 30,
        text: 'Rotate me',
        draggable: true,
      });
      layer.add(text);
  
      var tr1 = new Konva.Transformer({
        nodes: [text],
        centeredScaling: true,
        rotationSnaps: [0, 90, 180, 270],
        resizeEnabled: false,
      });
      layer.add(tr1);
    </script>
  </body>
</html>
```

[Prev](/docs/select_and_transform/Resize_Limits.html "Resize Limits")[Next](/docs/select_and_transform/Resize_Snaps.html "Resize Snaps")

Enjoying Konva? Please consider to [support](/docs/donate.html) the project.