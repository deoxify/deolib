[CodePen.io template](https://codepen.io/deoxify/pen/azopLaa?layout=left&editors=0011)
```js
// Initialize canvas, context2d, listeners etc.
dl.initCanvas({ width: 640, height: 480, noContextMenu: true, autoScale: false });

// Your stuff here
let fontSize = 200;
let textColor = dl.SKYBLUE;

// Main loop
dl.main = () => {
  // Update
  if (dl.isMouseButtonPressed(dl.MOUSE_RIGHT_BUTTON)) {
    fontSize = dl.getRandomInt(128, 256);
    textColor = dl.getRandomColor();
  }
  // Draw
  dl.clearBackground(dl.COAL);
  dl.drawTextCentered("ğğ", 320, 240, fontSize, textColor);
  dl.drawFPS(10, 10, 500);
};

```
