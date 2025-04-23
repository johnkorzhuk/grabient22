## HTML5 Canvas Shape Resize With Ratio Preserved

## How to resize shape with savings its proportion?

By default when you resize with corner anchors (`top-left`, `top-right`, `bottom-left` or `bottom-right`) Transformer will save ratio of a node.

You can set `keepRatio` to `false` if you don't need that behavior.

Even if you set `keepRatio` to `false` you can hold `SHIFT` to still keep ratio.

**Instructions:** Try to resize texts.

### Konva Shape Transform and Keep Ratio Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Keep Ratio Demo</title>
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
        text: 'keepRatio = true',
        draggable: true,
      });
      layer.add(text1);
  
      var tr1 = new Konva.Transformer({
        nodes: [text1],
        keepRatio: true,
        enabledAnchors: [
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
        ],
      });
      layer.add(tr1);
  
      var text2 = new Konva.Text({
        x: 50,
        y: 200,
        fontSize: 30,
        text: 'keepRatio = false',
        draggable: true,
      });
      layer.add(text2);
  
      var tr2 = new Konva.Transformer({
        nodes: [text2],
        keepRatio: false,
        enabledAnchors: [
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
        ],
      });
      layer.add(tr2);
    </script>
  </body>
</html>