# Konva Transformer Component API Reference

The Transformer component in Konva provides an interactive way to resize, rotate, and transform shapes on the canvas. It adds control points (anchors) around a node that users can drag to manipulate the node.

## API Reference

### Parameters

| Name | Type | Argument | Description |
| --- | --- | --- | --- |
| `resizeEnabled` | Boolean | <optional> | Default is true |
| `rotateEnabled` | Boolean | <optional> | Default is true |
| `rotateLineVisible` | Boolean | <optional> | Default is true |
| `rotationSnaps` | Array | <optional> | Array of angles for rotation snaps. Default is [] |
| `rotationSnapTolerance` | Number | <optional> | Snapping tolerance. If closer than this it will snap. Default is 5 |
| `rotateAnchorOffset` | Number | <optional> | Default is 50 |
| `rotateAnchorCursor` | String | <optional> | Default is crosshair |
| `padding` | Number | <optional> | Default is 0 |
| `borderEnabled` | Boolean | <optional> | Should we draw border? Default is true |
| `borderStroke` | String | <optional> | Border stroke color |
| `borderStrokeWidth` | Number | <optional> | Border stroke size |
| `borderDash` | Array | <optional> | Array for border dash |
| `anchorFill` | String | <optional> | Anchor fill color |
| `anchorStroke` | String | <optional> | Anchor stroke color |
| `anchorCornerRadius` | String | <optional> | Anchor corner radius |
| `anchorStrokeWidth` | Number | <optional> | Anchor stroke size |
| `anchorSize` | Number | <optional> | Default is 10 |
| `keepRatio` | Boolean | <optional> | Should we keep ratio when we are moving edges? Default is true |
| `shiftBehavior` | String | <optional> | How does transformer react on shift key press when we are moving edges? Default is 'default' |
| `centeredScaling` | Boolean | <optional> | Should we resize relative to node's center? Default is false |
| `enabledAnchors` | Array | <optional> | Array of names of enabled handles |
| `flipEnabled` | Boolean | <optional> | Can we flip/mirror shape on transform? True by default |
| `boundBoxFunc` | function | <optional> | Bounding box function |
| `ignoreStroke` | function | <optional> | Should we ignore stroke size? Default is false |
| `useSingleNodeRotation` | Boolean | <optional> | When just one node attached, should we use its rotation for transformer? |
| `shouldOverdrawWholeArea` | Boolean | <optional> | Should we fill whole transformer area with fake transparent shape to enable dragging from empty spaces? |

## Example

```javascript
var transformer = new Konva.Transformer({
  nodes: [rectangle],
  rotateAnchorOffset: 60,
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
});
layer.add(transformer);