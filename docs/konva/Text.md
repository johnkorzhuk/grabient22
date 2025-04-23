# Konva Text Component API Reference

The `Text` component in Konva renders text on HTML5 Canvas with configurable styling and positioning options.

## Features

- Text rendering on canvas
- Font styling (family, size, style, variant)
- Text alignment and wrapping
- Fill and stroke options
- Shadow effects
- Gradient and pattern support

## API Reference

##### Parameters:

NameTypeDescription`config`Object

###### Properties

| Name | Type | Argument | Description |
| --- | --- | --- | --- |
| `direction` | String | <optional> | default is inherit |
| `fontFamily` | String | <optional> | default is Arial |
| `fontSize` | Number | <optional> | in pixels. Default is 12 |
| `fontStyle` | String | <optional> | can be 'normal', 'italic', or 'bold', '500' or even 'italic bold'. 'normal' is the default. |
| `fontVariant` | String | <optional> | can be normal or small-caps. Default is normal |
| `textDecoration` | String | <optional> | can be line-through, underline or empty string. Default is empty string. |
| `text` | String |     |     |
| `align` | String | <optional> | can be left, center, or right |
| `verticalAlign` | String | <optional> | can be top, middle or bottom |
| `padding` | Number | <optional> |     |
| `lineHeight` | Number | <optional> | default is 1 |
| `wrap` | String | <optional> | can be "word", "char", or "none". Default is word |
| `ellipsis` | Boolean | <optional> | can be true or false. Default is false. if Konva.Text config is set to wrap="none" and ellipsis=true, then it will add "..." to the end |
| `fill` | String | <optional> | fill color |
| `fillPatternImage` | Image | <optional> | fill pattern image |
| `fillPatternX` | Number | <optional> |     |
| `fillPatternY` | Number | <optional> |     |
| `fillPatternOffset` | Object | <optional> | object with x and y component |
| `fillPatternOffsetX` | Number | <optional> |     |
| `fillPatternOffsetY` | Number | <optional> |     |
| `fillPatternScale` | Object | <optional> | object with x and y component |
| `fillPatternScaleX` | Number | <optional> |     |
| `fillPatternScaleY` | Number | <optional> |     |
| `fillPatternRotation` | Number | <optional> |     |
| `fillPatternRepeat` | String | <optional> | can be "repeat", "repeat-x", "repeat-y", or "no-repeat". The default is "no-repeat" |
| `fillLinearGradientStartPoint` | Object | <optional> | object with x and y component |
| `fillLinearGradientStartPointX` | Number | <optional> |     |
| `fillLinearGradientStartPointY` | Number | <optional> |     |
| `fillLinearGradientEndPoint` | Object | <optional> | object with x and y component |
| `fillLinearGradientEndPointX` | Number | <optional> |     |
| `fillLinearGradientEndPointY` | Number | <optional> |     |
| `fillLinearGradientColorStops` | Array | <optional> | array of color stops |
| `fillRadialGradientStartPoint` | Object | <optional> | object with x and y component |
| `fillRadialGradientStartPointX` | Number | <optional> |     |
| `fillRadialGradientStartPointY` | Number | <optional> |     |
| `fillRadialGradientEndPoint` | Object | <optional> | object with x and y component |
| `fillRadialGradientEndPointX` | Number | <optional> |     |
| `fillRadialGradientEndPointY` | Number | <optional> |     |
| `fillRadialGradientStartRadius` | Number | <optional> |     |
| `fillRadialGradientEndRadius` | Number | <optional> |     |
| `fillRadialGradientColorStops` | Array | <optional> | array of color stops |
| `fillEnabled` | Boolean | <optional> | flag which enables or disables the fill. The default value is true |
| `fillPriority` | String | <optional> | can be color, linear-gradient, radial-graident, or pattern. The default value is color. The fillPriority property makes it really easy to toggle between different fill types. For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration |
| `stroke` | String | <optional> | stroke color |
| `strokeWidth` | Number | <optional> | stroke width |
| `fillAfterStrokeEnabled` | Boolean | <optional> | Should we draw fill AFTER stroke? Default is false. |
| `hitStrokeWidth` | Number | <optional> | size of the stroke on hit canvas. The default is "auto" - equals to strokeWidth |
| `strokeHitEnabled` | Boolean | <optional> | flag which enables or disables stroke hit region. The default is true |
| `perfectDrawEnabled` | Boolean | <optional> | flag which enables or disables using buffer canvas. The default is true |
| `shadowForStrokeEnabled` | Boolean | <optional> | flag which enables or disables shadow for stroke. The default is true |
| `strokeScaleEnabled` | Boolean | <optional> | flag which enables or disables stroke scale. The default is true |
| `strokeEnabled` | Boolean | <optional> | flag which enables or disables the stroke. The default value is true |
| `lineJoin` | String | <optional> | can be miter, round, or bevel. The default  <br>is miter |
| `lineCap` | String | <optional> | can be butt, round, or square. The default  <br>is butt |
| `shadowColor` | String | <optional> |     |
| `shadowBlur` | Number | <optional> |     |
| `shadowOffset` | Object | <optional> | object with x and y component |
| `shadowOffsetX` | Number | <optional> |     |
| `shadowOffsetY` | Number | <optional> |     |
| `shadowOpacity` | Number | <optional> | shadow opacity. Can be any real number  <br>between 0 and 1 |
| `shadowEnabled` | Boolean | <optional> | flag which enables or disables the shadow. The default value is true |
| `dash` | Array | <optional> |     |
| `dashEnabled` | Boolean | <optional> | flag which enables or disables the dashArray. The default value is true |
| `x` | Number | <optional> |     |
| `y` | Number | <optional> |     |
| `width` | Number | <optional> |     |
| `height` | Number | <optional> |     |
| `visible` | Boolean | <optional> |     |
| `listening` | Boolean | <optional> | whether or not the node is listening for events |
| `id` | String | <optional> | unique id |
| `name` | String | <optional> | non-unique name |
| `opacity` | Number | <optional> | determines node opacity. Can be any number between 0 and 1 |
| `scale` | Object | <optional> | set scale |
| `scaleX` | Number | <optional> | set scale x |
| `scaleY` | Number | <optional> | set scale y |
| `rotation` | Number | <optional> | rotation in degrees |
| `offset` | Object | <optional> | offset from center point and rotation point |
| `offsetX` | Number | <optional> | set offset x |
| `offsetY` | Number | <optional> | set offset y |
| `draggable` | Boolean | <optional> | makes the node draggable. When stages are draggable, you can drag and drop  <br>the entire stage by dragging any portion of the stage |
| `dragDistance` | Number | <optional> |     |
| `dragBoundFunc` | function | <optional> |     |

Source:

konva.js

##### Example

var text \= new Konva.Text({
  x: 10,
  y: 15,
  text: 'Simple Text',
  fontSize: 30,
  fontFamily: 'Calibri',
  fill: 'green'
});
