## How to change width of the text with transforming tool?

Remember, that `Konva.Transformer` is changing `scaleX` and `scaleY` properties of a node.  
If you want to change width of the text, without changing its size, you should reset scale of a text back to 1 and adjust `width` accordantly.

You can use `transform` event to update text's properties as you need it.

**Instructions:** Try to resize a text.

### Konva Text resize Demo
[view raw](/downloads/code/select_and_transform/Resize_Text.html)

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- USE DEVELOPMENT VERSION -->
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

      var text = new Konva.Text({
        x: 50,
        y: 60,
        fontSize: 20,
        text: 'Hello from the Konva framework. Try to resize me.',
        draggable: true,
      });
      layer.add(text);

      var MIN_WIDTH = 20;
      var tr = new Konva.Transformer({
        nodes: [text],
        padding: 5,
        flipEnabled: false,
        // enable only side anchors
        enabledAnchors: ['middle-left', 'middle-right'],
        // limit transformer size
        boundBoxFunc: (oldBox, newBox) => {
          if (Math.abs(newBox.width) < MIN_WIDTH) {
            return oldBox;
          }
          return newBox;
        },
      });
      layer.add(tr);
      text.on('transform', () => {
        // with enabled anchors we can only change scaleX
        // so we don't need to reset height
        // just width
        text.setAttrs({
          width: Math.max(text.width() * text.scaleX(), MIN_WIDTH),
          scaleX: 1,
          scaleY: 1,
        });
      });
    </script>
  </body>
</html>