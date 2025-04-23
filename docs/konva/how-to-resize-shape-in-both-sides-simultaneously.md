## How to resize shape in both sides simultaneously?

To resize a node into both sides at the same time you can set `centeredScaling` to true or hold `ALT` key while moving an anchor (even if `centeredScaling` is false).

**Instructions:** Try to resize texts.

### Konva Shape Transform and Centered Scaling Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Centered Scaling Demo</title>
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
  
      var text1 = new Konva.Text({
        x: 50,
        y: 70,
        fontSize: 30,
        text: 'centeredScaling = true',
        draggable: true,
      });
      layer.add(text1);
  
      var tr1 = new Konva.Transformer({
        nodes: [text1],
        centeredScaling: true,
      });
      layer.add(tr1);
  
      var text2 = new Konva.Text({
        x: 50,
        y: 200,
        fontSize: 30,
        text: 'centeredScaling = false',
        draggable: true,
      });
      layer.add(text2);
  
      var tr2 = new Konva.Transformer({
        nodes: [text2],
        centeredScaling: false,
      });
      layer.add(tr2);
    </script>
  </body>
</html>