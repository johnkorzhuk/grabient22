## Style Konva Transformer

You can adjust styles of `Konva.Transformer` for your web app. You can change stroke, size and fill of all anchors.  
Also you can change stroke color and size of border.

Also take a look into [Complex Transformer Styling](/docs/select_and_transform/Transformer_Complex_Styling.html) for fine tuning.

### Konva Shape Transform and Styling Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Select and Transform Styling Demo</title>
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
  
      var circle = new Konva.Circle({
        x: 150,
        y: 150,
        radius: 70,
        fill: 'red',
        draggable: true,
      });
      layer.add(circle);
  
      // create new transformer
      var tr = new Konva.Transformer({
        anchorStroke: 'red',
        anchorFill: 'yellow',
        anchorSize: 20,
        borderStroke: 'green',
        borderDash: [3, 3],
        nodes: [circle],
      });
      layer.add(tr);
    </script>
  </body>
</html>