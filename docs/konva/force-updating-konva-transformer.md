# Force Updating Konva Transformer

## When to Use forceUpdate Method

`Konva.Transformer` automatically track properties of attached nodes.  
So it will adopt its own properties automatically.

But in some cases `Konva.Transformer` can't do this. Currently `Konva.Transformer` can not track deep changes inside `Konva.Group` node. In this case you will need to use `forceUpdate` method to reset transforming tools

**Instructions:** Click the button. See how transformer is changed.

### Transformer Force Update Demo

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Transform Events Demo</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #f0f0f0;
      }
  
      #button {
        position: absolute;
        top: 5px;
        left: 10px;
      }
    </style>
  </head>
  
  <body>
    <div id="container"></div>
    <input type="button" id="button" value="Add random shape" />
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
  
      var group = new Konva.Group({
        x: 50,
        y: 50,
        draggable: true,
      });
      layer.add(group);
  
      // create new transformer
      var tr = new Konva.Transformer();
      layer.add(tr);
      tr.nodes([group]);
  
      document.getElementById('button').addEventListener('click', addShape);
      addShape();
  
      function addShape() {
        group.add(
          new Konva.Circle({
            x: Math.random() * 100,
            y: Math.random() * 100,
            radius: Math.random() * 100,
            fill: Konva.Util.getRandomColor(),
            stroke: 'black',
            strokeWidth: Math.random() * 10,
          })
        );
        // force update manually
        tr.forceUpdate();
      }
    </script>
  </body>
</html>
```

[Prev](/docs/select_and_transform/Stop_Transform.html "Stop Transform")[Next](/docs/select_and_transform/Resize_Text.html "Text Resizing")

Enjoying Konva? Please consider to [support](/docs/donate.html) the project.