How to draw external font on html5 canvas?
If you want to use custom font for Konva.Text you just need to:

Add font style to your page
Set fontFamily attribute to required font-face.
But there is one important thing here. When you set font for DOM elements (like div or span) browsers will automatically update that elements when font is loaded. But it doesn’t work the same for canvas text. You need to redraw canvas again.

To detect that font is loaded you can use something like FontObserver.

But for the demo I will use simpler font loading detection. It work ok for many fonts and much smaller in size.

Is even simpler solution you can redraw after delay with setTimeout, but it doesn’t guarantee that font is loaded.

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/konva@9.3.18/konva.min.js"></script>
    <meta charset="utf-8" />
    <title>Konva Custom font loading Demo</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #f0f0f0;
      }
    </style>

    <!-- CUSTOM FONT STYLES -->
    <link
      href="https://fonts.googleapis.com/css?family=Kavivanar"
      rel="stylesheet"
    />
  </head>

  <body>
    <div id="container"></div>
    <script>
      // FONT LOADING DETECTION CODE:
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.font = 'normal 20px Kavivanar';

      var isFontLoaded = false;
      var TEXT_TEXT = 'Some test text;';
      var initialMeasure = ctx.measureText(TEXT_TEXT);
      var initialWidth = initialMeasure.width;

      // here is how the function works
      // different fontFamily may have different width of symbols
      // when font is not loaded a browser will use startard font as a fallback
      // probably Arial
      // when font is loaded measureText will return another width
      function whenFontIsLoaded(callback, attemptCount) {
        if (attemptCount === undefined) {
          attemptCount = 0;
        }
        if (attemptCount >= 20) {
          callback();
          return;
        }
        if (isFontLoaded) {
          callback();
          return;
        }
        const metrics = ctx.measureText(TEXT_TEXT);
        const width = metrics.width;
        if (width !== initialWidth) {
          isFontLoaded = true;
          callback();
        } else {
          setTimeout(function () {
            whenFontIsLoaded(callback, attemptCount + 1);
          }, 1000);
        }
      }

      // NOW build our stage

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
        y: 50,
        fontSize: 40,
        text: 'A text with custom font.',
        width: 250,
      });

      layer.add(text);

      whenFontIsLoaded(function () {
        // set font style when font is loaded
        // so Konva will recalculate text wrapping if it has limited width
        text.fontFamily('Kavivanar');
      });
    </script>
  </body>
</html>
```