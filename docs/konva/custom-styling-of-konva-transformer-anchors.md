# Advanced Styling of Konva Transformer Anchors

## Deep Style Konva Transformer

You can use `anchorStyleFunc` property of `Konva.Transformer` to have deeper control on styling of anchors.

Also take a look into [Transformer Styling](/docs/select_and_transform/Transformer_Styling.html) for simpler use cases.

### Konva Shape Transform and Complex Styling Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Select and Transform Complex Styling Demo</title>
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
        anchorStyleFunc: (anchor) => {
          // anchor is Konva.Rect instance
          // you manually change its styling
          anchor.cornerRadius(10);
          if (anchor.hasName('top-center') || anchor.hasName('bottom-center')) {
            anchor.height(6);
            anchor.offsetY(3);
            anchor.width(30);
            anchor.offsetX(15);
          }
          if (anchor.hasName('middle-left') || anchor.hasName('middle-right')) {
            anchor.height(30);
            anchor.offsetY(15);
            anchor.width(6);
            anchor.offsetX(3);
          }
          // you also can set other properties
          // e.g. you can set fillPatternImage to set icon to the anchor
        },
        nodes: [circle],
      });
      layer.add(tr);
    </script>
  </body>
</html>
```

[Prev](/docs/select_and_transform/Transformer_Styling.html "Styling")[Next](/docs/select_and_transform/Transform_Events.html "Transform Events")

Enjoying Konva? Please consider to [support](/docs/donate.html) the project.