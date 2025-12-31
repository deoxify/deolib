# `dl.initCanvas(configObject) → configObject`
Initializes the canvas, 2D rendering context, and input/audio systems.

## configObject

```ts
width  : number
height : number
title  : string

showContextMenu? : boolean = false
autoExpand?      : boolean = false
antiAliasing?    : boolean = true
pageBgColor?     : string  = "#282828"
borderColor?     : string  = "transparent"
```

# `dl.main()`
`dl.main` **must be assigned by the user.**

If defined, it is invoked every frame by the internal game loop, which uses [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)

## Minimal Example
### index.html
```html
<html>
    <head>
        <script src="https://cdn.jsdelivr.net/gh/deoxify/deolib@latest/deolib.js"></script>
    </head>
    <body>
        <script src="script.js"></script>
    </body>
</html>
```
### script.js
```js
const config = dl.initCanvas({ width: 640, height: 480, title: "test" });

dl.main = () => {
    dl.clearBackground(dl.BLACK);
    dl.drawTextCentered("Hello, World!", config.width/2, config.height/2, 48, dl.GOLD);
};
```

# Data Types
## dl.Vector2
Represents a 2D vector with X and Y components.

```ts
{
    x? : number = 0
    y? : number = 0
}
```

## dl.Rectangle
```ts
{
    x : number
    y : number
    width  : number
    height : number
}
```

# Input
## Keyboard

### `dl.isKeyDown(code: string) → boolean`
Returns true while the key is held down.

### `dl.isKeyUp(code: string) → boolean`
Returns true while the key is not pressed.

### `dl.isKeyPressed(code: string) → boolean`
Returns true **on the frame** the key transitions from up to down.

### `dl.isKeyReleased(code: string) → boolean`
Returns true **on the frame** the key transitions from down to up.

For the list of available codes, check [this page](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values)

## Mouse
### Constants:
```js
dl.LEFT_MOUSE_BUTTON   = 0
dl.MIDDLE_MOUSE_BUTTON = 1
dl.RIGHT_MOUSE_BUTTON  = 2
```
### `dl.isMouseButtonDown(buttonId: number) → boolean`
Returns true while the button is held down.
### `dl.isMouseButtonUp(buttonId: number) → boolean`
Returns true while the button is not pressed.
### `dl.isMouseButtonPressed(buttonId: number) → boolean`
Returns true **on the frame** the button transitions from up to down.
### `dl.isMouseButtonReleased(buttonId: number) → boolean`
Returns true **on the frame** the button transitions from down to up.
### `dl.isMouseInCanvas() → boolean`
Returns true if the mouse is inside the canvas bounds.

### `dl.getMouseX() → number`
Returns the mouse X position relative to the canvas.
### `dl.getMouseY() → number`
Returns the mouse Y position relative to the canvas.
### `dl.getMousePosition() →`[`dl.Vector2`](#dlvector2)
Returns the mouse position relative to the canvas.
### `dl.getMouseDelta() →`[`dl.Vector2`](#dlvector2)
Returns the difference between the current and previous mouse position.
### `dl.getMouseWheelMove() → number`
Returns -1, 0, or 1 depending on mouse wheel movement for the current frame.

### `dl.hideCursor()`
Hides the system cursor over the canvas.
### `dl.showCursor()`
Shows the system cursor over the canvas.

# Timing
### `dl.getFrameTime() → number`
Returns the time difference between the current and previous frame in **seconds** (delta time).
### `dl.getFPS() → number`
Returns the current frames per second.
### `dl.getTime() → number`
Returns the time elapsed in **seconds** since `dl.initCanvas()` was called.


# Drawing

## Debug

### `dl.drawFPS(x: number, y: number, updateInterval?: number)`
Draws the current FPS counter.
`updateInterval` is in **milliseconds**.

---

## Rectangle

### Filled

### `dl.drawRectangle(x: number, y: number, width: number, height: number, color: string)`
Draws a filled rectangle.

### `dl.drawRectangleRec(rect:`[`dl.Rectangle`](#dlrectangle)`, color: string)`
Draws a filled rectangle using a rectangle struct.

---

### Rounded

### `dl.drawRectangleRounded(x: number, y: number, width: number, height: number, roundness: number, color: string)`

### `dl.drawRectangleRoundedRec(rect:`[`dl.Rectangle`](#dlrectangle)`, roundness: number, color: string)`

---

### Outline

### `dl.drawRectangleLines(x: number, y: number, width: number, height: number, color: string)`

### `dl.drawRectangleLinesRec(rect:`[`dl.Rectangle`](#dlrectangle)`, color: string)`

### `dl.drawRectangleLinesEx(rect:`[`dl.Rectangle`](#dlrectangle)`, thickness: number, color: string)`

---

### Rounded Outline

### `dl.drawRectangleRoundedLines(rect:`[`dl.Rectangle`](#dlrectangle)`, roundness: number, color: string)`

### `dl.drawRectangleRoundedLinesEx(rect:`[`dl.Rectangle`](#dlrectangle)`, roundness: number, thickness: number, color: string)`

## Circle

### Filled
### `dl.drawCircle(centerX: number, centerY: number, radius: number, color: string)`
Draws a filled circle.
### `dl.drawCircleV(center:`[`dl.Vector2`](#dlvector2)`, radius: number, color: string)`
Draws a filled circle using a Vector2 struct.

--- 

### Outline
### `dl.drawCircleLines(centerX: number, centerY: number, radius: number, color: string)`
### `dl.drawCircleLinesV(center:`[`dl.Vector2`](#dlvector2)`, radius: number, color: string)`
### `dl.drawCircleLinesEx(center:`[`dl.Vector2`](#dlvector2)`, radius: number, thickness: number, color: string)`

## Ring
### Filled
### `dl.drawRing(x: number, y: number, innerRadius: number, outerRadius: number, color: string)`
### `dl.drawRingV(center:`[`dl.Vector2`](#dlvector2)`, innerRadius: number, outerRadius: number, color: string)`

---

### Outline
### `dl.drawRingLines(x: number, y: number, innerRadius: number, outerRadius: number, color: string)`
### `dl.drawRingLinesV(center:`[`dl.Vector2`](#dlvector2)`, innerRadius: number, outerRadius: number, color: string)`


## Triangle
### `dl.drawTriangle(v1:`[`dl.Vector2`](#dlvector2)`, v2:`[`dl.Vector2`](#dlvector2)`, v3:`[`dl.Vector2`](#dlvector2)`, color)`
Draws a filled triangle.
### `dl.drawTriangleLines(v1:`[`dl.Vector2`](#dlvector2)`, v2:`[`dl.Vector2`](#dlvector2)`, v3:`[`dl.Vector2`](#dlvector2)`, color)`
Draws triangle outlines.

## Text
### `dl.drawText(text: string, x: number, y: number, size: number, color: string)`
Draws left & top aligned text
### `dl.drawTextCentered(text: string, x: number, y: number, size: number, color: string)`
Draws center & middle aligned text
### `dl.drawTextEx(text: string, x: number, y: number, size: number, color: string, align: string, baseline: string, {weight?: string, style?: string, font?: string})`

### Example
```js
dl.initCanvas({ width: 640, height: 480, title: "drawing text" });

dl.main = () => {
    dl.clearBackground(dl.BLACK);

    dl.drawTextEx(
        "Lorem ipsum dolor sit amet",
        dl.getCanvasWidth() - 20,
        dl.getCanvasHeight() - 20,
        40,
        dl.GOLD,
        "right",  // css align
        "bottom", // css baseline
        { font: "seriff", style: "italic" }
    );

}
```

---
# GUI
## Buttons
Buttons are evaluated and drawn every frame (immediate-mode).

State is internally cached using user-provided IDs, allowing interaction to persist across frames.

## `dl.guiButton(id: string, bounds:`[`dl.Rectangle`](#dlrectangle)`, text, options?: ButtonOptions) → boolean`
Draws and updates a button.
Returns true **on the frame** the button is clicked.
### ButtonOptions
```ts
{
    fontSize?    : number      = 20
    roundness?   : number      = 0
    borderThick? : number      = (bounds.width + bounds.height) / 64
    style?       : ButtonStyle = dl.BS_DEFAULT
}
```
### Example
```js
dl.initCanvas({ width: 640, height: 480, title: "buttons" });

dl.main = () => {
    dl.clearBackground(dl.COAL);

    if(dl.guiButton(
        "btnPlay", 
        dl.Rectangle(250, 220, 150, 50),
        "Play"
    )) {
        dl.playSound("https://cdn.freesound.org/previews/62/62980_76945-lq.mp3");
    }
}
```
### Advanced: Manual Button Usage

For full control, buttons can be managed manually using the `dl.Button` class.

Since it is an instance, the `id` is no longer needed.

```js
dl.initCanvas({ width: 640, height: 480, title: "buttons" });

const button = new dl.Button(dl.Rectangle(250, 220, 150, 50), "Click Me");

dl.main = () => {
    button.update();

    if (button.isPressed()) {
        console.log("pressed");
    }

    dl.clearBackground(dl.BLACK);
    button.draw();
};
```
