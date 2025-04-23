# How to Stop Transformation in Konva

## Using stopTransform Method in Konva Transformer

If you need to stop transforming immediately you can use `stopTransform` methods of `Konva.Transformer` instance.

**Instructions:** Try to resize a shape. If width of the shape is bigger then 200 transforming will be stopped.

### Konva Stop Transform Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Stop Transform Demo</title>
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
  
      // create new transformer
      var tr = new Konva.Transformer();
      layer.add(tr);
      tr.nodes([rect]);
      tr.on('transform', function () {
        var width = rect.width() * rect.scaleX();
        if (width > 200) {
          tr.stopTransform();
          // reset visible width to 200
          // so future transform is possible
          var scaleX = 200 / rect.width();
          rect.scaleX(scaleX);
        }
      });
    </script>
  </body>
</html>
```

[Prev](/docs/select_and_transform/Resize_Snaps.html "Resize Snaps")[Next](/docs/select_and_transform/Force_Update.html "Force Update")

Enjoying Konva? Please consider to [support](/docs/donate.html) the project.