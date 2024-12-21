let _ctx;
let _firstTime = performance.now();
let _lastTime;
let _frameTime;
let _fps;
let _avgFPS;
let _fpsSamples = [];
let _maxFpsSamples = 20;
let _fpsFontSize;
let _cachedFont;
let _canvasRect;
let _imageCache = {};
let _spriteCache = new Map();

const LIGHTGRAY = "#c8c8c8";
const GRAY = "#828282";
const DARKGRAY = "#505050";
const COAL = "#101010";
const YELLOW = "#fdf900";
const GOLD = "#ffcb00";
const ORANGE = "#ffa100";
const PINK = "#ff6dc2";
const RED = "#e62937";
const MAROON = "#be2137";
const GREEN = "#00e430";
const LIME = "#009e2f";
const DARKGREEN = "#00752c";
const SKYBLUE = "#66bfff";
const BLUE = "#0079f1";
const DARKBLUE = "#0052ac";
const PURPLE = "#c87aff";
const CYAN = "#00FFFF";
const VIOLET = "#873cbe";
const DARKPURPLE = "#701f7e";
const BEIGE = "#d3b083";
const BROWN = "#7f6a4f";
const DARKBROWN = "#4c3f2f";
const WHITE = "#ffffff";
const BLACK = "#000000";
const BLANK = "#00000000";
const MAGENTA = "#ff00ff";

const CUR_DEFAULT = "default";
const CUR_CROSSHAIR = "crosshair";
const CUR_POINTER = "pointer";

const MOUSE_LEFT_BUTTON = 0;
const MOUSE_MIDDLE_BUTTON = 1;
const MOUSE_RIGHT_BUTTON = 2;

const _mouse = {
  x: -1,
  y: -1,
  isInCanvas: false,
  [MOUSE_LEFT_BUTTON]: false,
  [MOUSE_MIDDLE_BUTTON]: false,
  [MOUSE_RIGHT_BUTTON]: false,
  prev: {
    [MOUSE_LEFT_BUTTON]: false,
    [MOUSE_MIDDLE_BUTTON]: false,
    [MOUSE_RIGHT_BUTTON]: false
  }
};

const _keyboard = {
  prev: {}
};

const Vector2 = (x = 0, y = 0) => ({ x, y });
const Vector2Add = (v1, v2) => Vector2(v1.x + v2.x, v1.y + v2.y);
const Vector2Subtract = (v1, v2) => Vector2(v1.x - v2.x, v1.y - v2.y);
const Vector2Multiply = (v, scalar) => Vector2(v.x * scalar, v.y * scalar);
const Vector2Divide = (v, scalar) => Vector2(v.x / scalar, v.y / scalar);
const Vector2Magnitude = v => Math.sqrt(v.x * v.x + v.y * v.y);
const Vector2Normalize = v => {
  const mag = Vector2Magnitude(v);
  return mag === 0 ? Vector2() : Vector2Divide(v, mag);
};
const Vector2Dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y;
const Vector2Cross = (v1, v2) => v1.x * v2.y - v1.y * v2.x;
const Vector2Distance = (v1, v2) => Vector2Magnitude(Vector2Subtract(v1, v2));
const Vector2Equals = (v1, v2) => v1.x === v2.x && v1.y === v2.y;
const Rectangle = (x, y, width, height) => ({ x, y, width, height });
const Circle = (center, radius) => ({ center, radius });

const IsMouseInCanvas = () => _mouse.isInCanvas;
const IsMouseButtonDown = buttonId => buttonId in _mouse && _mouse[buttonId];
const IsMouseButtonUp = buttonId => buttonId in _mouse && !_mouse[buttonId];
const IsMouseButtonPressed = buttonId => buttonId in _mouse && !_mouse.prev[buttonId] && _mouse[buttonId];
const IsMouseButtonReleased = buttonId => buttonId in _mouse && _mouse.prev[buttonId] && !_mouse[buttonId];
const IsKeyDown = keyCode => keyCode in _keyboard && _keyboard[keyCode];
const IsKeyUp = keyCode => keyCode in _keyboard && !_keyboard[keyCode];
const IsKeyPressed = keyCode => keyCode in _keyboard && !_keyboard.prev[keyCode] && _keyboard[keyCode];
const IsKeyReleased = keyCode => keyCode in _keyboard && _keyboard.prev[keyCode] && !_keyboard[keyCode];
const GetRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const GetRandomFloat = (min, max) => Math.random() * (max - min) + min;
const GetRandomElem = arr => arr[GetRandomInt(0, arr.length - 1)];
const GetRandomColor = () => "#" + ((Math.random() * 0xffffff) << 0).toString(16);
const GetMousePosition = () => Vector2(_mouse.x, _mouse.y);
const GetMouseX = () => _mouse.x;
const GetMouseY = () => _mouse.y;
const GetCanvasWidth = () => _ctx.canvas.width;
const GetCanvasHeight = () => _ctx.canvas.height;
const GetCanvasRect = () => Rectangle(0, 0, _ctx.canvas.width, _ctx.canvas.height);
const GetFrameTime = () => _frameTime;
const GetFPS = () => _fps;
const GetTime = () => (performance.now() - _firstTime) / 1000;

function InitCanvas(width, height, title) {
  const _canvas = document.createElement("canvas");
  _ctx = _canvas.getContext("2d");
  _canvas.width = Math.floor(width);
  _canvas.height = Math.floor(height);
  _canvas.oncontextmenu = e => e.preventDefault();
  _canvas.onmouseenter = () => (_mouse.isInCanvas = true);
  _canvas.onmouseleave = () => ((_mouse.isInCanvas = false), (_mouse.x = -1), (_mouse.y = -1));
  _canvas.onmousemove = e => {
    const rect = _canvas.getBoundingClientRect();
    const scaleX = _canvas.width / rect.width;
    const scaleY = _canvas.height / rect.height;
    _mouse.x = Math.round((e.clientX - rect.left) * scaleX);
    _mouse.y = Math.round((e.clientY - rect.top) * scaleY);
  };
  _canvas.onmousedown = e => {
    if (_mouse.isInCanvas) _mouse[e.button] = true;
  };
  _canvas.onmouseup = e => {
    if (_mouse.isInCanvas) _mouse[e.button] = false;
  };
  window.onkeydown = e => {
    if (e.code.length) _keyboard[e.code] = true;
  };
  window.onkeyup = e => {
    if (e.code in _keyboard) _keyboard[e.code] = false;
  };

  Object.assign(_canvas.style, {
    maxWidth: "100%",
    maxHeight: "100%"
  });

  Object.assign(document.body.style, {
    backgroundColor: "#282828",
    width: "100vw",
    height: "100vh",
    margin: "0",
    padding: "0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "auto"
  });

  window.onload = () => {
    _ctx.textAlign = "left";
    _ctx.textBaseline = "top";
    _ctx.lineCap = "square";
    document.body.appendChild(_canvas);
    document.title = title;
    _canvasRect = Rectangle(0, 0, _ctx.canvas.width, _ctx.canvas.height);
    _fpsFontSize = Math.floor((_ctx.canvas.width + _ctx.canvas.height) / 64);
    _ctx.textRendering = "geometricPrecision";
    _ctx.imageSmoothingEnabled = true;
    SetLineThick(2);
    SetFont("20px monospace, system");
    if (typeof main === "function") {
      _startGameLoop(main);
    } else {
      console.warn("main() missing");
    }
  };
}

function SetCursor(cursor) {
  _ctx.canvas.style.cursor = cursor;
}

function LoadImage(filename) {
  if (_imageCache[filename]) return _imageCache[filename];

  const placeholder = new Image();
  placeholder.src = "";

  const img = new Image();
  img.onload = () => {
    _imageCache[filename] = img;
    Object.assign(placeholder, { src: img.src, width: img.width, height: img.height });
  };
  img.onerror = err => console.error(`Failed to load image: ${filename}`, err);
  img.src = filename;

  _imageCache[filename] = placeholder;
  return placeholder;
}

function LoadSpreadSheet(filename, spriteWidth, spriteHeight) {
  if (_imageCache[filename]) return _imageCache[filename];

  const placeholder = new Image();
  placeholder.src = "";

  const img = new Image();
  img.onload = () => {
    _imageCache[filename] = Object.assign(img, { spriteWidth, spriteHeight });
    Object.assign(placeholder, { src: img.src, width: img.width, height: img.height });
  };
  img.onerror = err => console.error(`Failed to load image: ${filename}`, err);
  img.src = filename;

  _imageCache[filename] = Object.assign(placeholder, { spriteWidth, spriteHeight });
  return _imageCache[filename];
}

function DrawSprite(
  spriteSheet,
  colIndex,
  rowIndex,
  destX,
  destY,
  destWidth = spriteSheet.spriteWidth,
  destHeight = spriteSheet.spriteHeight
) {
  const { spriteWidth, spriteHeight } = spriteSheet;

  const cacheKey = `${spriteSheet.src}_${spriteWidth}_${spriteHeight}_${colIndex - 1}_${rowIndex - 1}`;

  if (!_spriteCache.has(cacheKey)) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = spriteWidth;
    canvas.height = spriteHeight;

    const sourceX = (colIndex - 1) * spriteWidth;
    const sourceY = (rowIndex - 1) * spriteHeight;
    ctx.drawImage(spriteSheet, sourceX, sourceY, spriteWidth, spriteHeight, 0, 0, spriteWidth, spriteHeight);

    const sprite = new Image();
    sprite.src = canvas.toDataURL();
    _spriteCache.set(cacheKey, sprite);
  }

  const cachedSprite = _spriteCache.get(cacheKey);
  _ctx.drawImage(cachedSprite, destX, destY, destWidth, destHeight);
}

function DrawImage(img, dx, dy) {
  _ctx.drawImage(img, dx, dy);
}

function DrawImageEx(img, sx, sy, sw, sh, dx, dy, dw, dh) {
  _ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function DrawImageRec(img, rect) {
  _ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
}

function ToggleFullScreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
}

function CheckCollisionRecs(rect1, rect2) {
  const r1x2 = rect1.x + rect1.width;
  const r1y2 = rect1.y + rect1.height;
  const r2x2 = rect2.x + rect2.width;
  const r2y2 = rect2.y + rect2.height;
  return rect1.x < r2x2 && r1x2 > rect2.x && rect1.y < r2y2 && r1y2 > rect2.y;
}

function GetCollisionRecs(rect1, rect2) {
  const collision = { left: false, right: false, top: false, bottom: false };
  if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x) {
    if (rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y) {
      if (rect1.x < rect2.x) collision.left = true;
      if (rect1.x + rect1.width > rect2.x + rect2.width) collision.right = true;
      if (rect1.y < rect2.y) collision.top = true;
      if (rect1.y + rect1.height > rect2.y + rect2.height) collision.bottom = true;
    }
  }
  return collision;
}

function GetCollisionRecBounds(rect, bounds) {
  const collision = { left: false, right: false, top: false, bottom: false };

  if (rect.x < bounds.x) collision.left = true;
  if (rect.x + rect.width > bounds.x + bounds.width) collision.right = true;
  if (rect.y < bounds.y) collision.top = true;
  if (rect.y + rect.height > bounds.y + bounds.height) collision.bottom = true;

  return collision;
}

function GetCollisionCircleBounds(circle, bounds) {
  const collision = { left: false, right: false, top: false, bottom: false };

  if (circle.center.x - circle.radius < bounds.x) collision.left = true;
  if (circle.center.x + circle.radius > bounds.x + bounds.width) collision.right = true;
  if (circle.center.y - circle.radius < bounds.y) collision.top = true;
  if (circle.center.y + circle.radius > bounds.y + bounds.height) collision.bottom = true;

  return collision;
}

function CheckCollisionCircleRec(circle, rect) {
  const dx = circle.center.x - Math.max(rect.x, Math.min(circle.center.x, rect.x + rect.width));
  const dy = circle.center.y - Math.max(rect.y, Math.min(circle.center.y, rect.y + rect.height));
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function GetCollisionCircleRec(circle, rect) {
  const collision = { left: false, right: false, top: false, bottom: false };

  const closestX = Math.max(rect.x, Math.min(circle.center.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.center.y, rect.y + rect.height));

  const dx = circle.center.x - closestX;
  const dy = circle.center.y - closestY;

  if (dx * dx + dy * dy <= circle.radius * circle.radius) {
    if (circle.center.x < rect.x) collision.left = true;
    if (circle.center.x > rect.x + rect.width) collision.right = true;
    if (circle.center.y < rect.y) collision.top = true;
    if (circle.center.y > rect.y + rect.height) collision.bottom = true;
  }

  return collision;
}

function CheckCollisionPointRec(point, rect) {
  return point.x > rect.x && point.y > rect.y && point.x < rect.x + rect.width && point.y < rect.y + rect.height;
}

function CheckCollisionPointCircle(point, circle) {
  return Math.pow(point.x - circle.center.x, 2) + Math.pow(point.y - circle.center.y, 2) < Math.pow(circle.radius, 2);
}

function _startGameLoop(callback) {
  _lastTime = performance.now();
  let isPageVisible = true;
  let frameRef;

  function handleVisibilityChange() {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
      _lastTime = performance.now();
      frameRef = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(frameRef);
    }
  }

  function loop(currentTime = 0) {
    _frameTime = (currentTime - _lastTime) / 1000;
    _lastTime = currentTime;

    if (isPageVisible) {
      // _fps = Math.floor(1 / _frameTime);
      _updateFPS();
      callback();
      _updatePrevMouseState();
      _updatePrevKeyboardState();
      frameRef = requestAnimationFrame(loop);
    }
  }
  document.onvisibilitychange = handleVisibilityChange;
  frameRef = requestAnimationFrame(loop);
}

function _updatePrevMouseState() {
  _mouse.prev[MOUSE_LEFT_BUTTON] = _mouse[MOUSE_LEFT_BUTTON];
  _mouse.prev[MOUSE_MIDDLE_BUTTON] = _mouse[MOUSE_MIDDLE_BUTTON];
  _mouse.prev[MOUSE_RIGHT_BUTTON] = _mouse[MOUSE_RIGHT_BUTTON];
}

function _updatePrevKeyboardState() {
  for (const key in _keyboard) {
    _keyboard.prev[key] = _keyboard[key];
  }
}

function ClearBackground(color) {
  if (_ctx.canvas.style.backgroundColor != color) {
    _ctx.canvas.style.backgroundColor = color;
  }
  _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
}

function SetLineThick(thickness) {
  _ctx.lineWidth = thickness;
}

function Clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function _updateFPS() {
  _fpsSamples = _fpsSamples.filter(fps => fps !== Infinity);
  let currentFPS = 1 / _frameTime;
  _fpsSamples.push(currentFPS);

  if (_fpsSamples.length > _maxFpsSamples) {
    _fpsSamples.shift();
  }
  _avgFPS = _fpsSamples.reduce((sum, fps) => sum + fps, 0) / _fpsSamples.length;
  _fps = Math.floor(_avgFPS);
}

const DrawFPS = (() => {
  let FPSTimer = 0;
  let lastFPS = 0;

  return function (x, y, updateInterval = 250) {
    FPSTimer += _frameTime * 1000;
    if (FPSTimer >= updateInterval) {
      lastFPS = GetFPS();
      FPSTimer = 0;
    }
    DrawTextEx(`${lastFPS} FPS`, x, y, _fpsFontSize, DARKGREEN, "left", "top", { weight: "bold" });
  };
})();

function DrawRectangle(x, y, width, height, color) {
  _ctx.fillStyle = color;
  _ctx.fillRect(x, y, width, height);
}

function DrawRectangleLines(x, y, width, height, color) {
  _ctx.strokeStyle = color;
  _ctx.strokeRect(x, y, width, height);
}

function DrawRectangleRec(rect, color) {
  DrawRectangle(rect.x, rect.y, rect.width, rect.height, color);
}

function DrawRectangleLinesRec(rect, color) {
  DrawRectangleLines(rect.x, rect.y, rect.width, rect.height, color);
}

function _DrawRectangleLinesEx(rect, thickness, color) {
  const x = rect.x + thickness;
  const y = rect.y + thickness;
  const w = rect.width - thickness * 2;
  const h = rect.height - thickness * 2;
  _ctx.strokeStyle = color;
  _ctx.save();
  SetLineThick(thickness);
  _ctx.strokeRect(x, y, w, h);
  _ctx.restore();
}

function DrawRectangleLinesEx(rect, thickness, color) {
  const outerRect = Rectangle(
    rect.x + thickness / 2,
    rect.y + thickness / 2,
    rect.width - thickness,
    rect.height - thickness
  );
  _ctx.beginPath();
  _ctx.moveTo(outerRect.x, outerRect.y);
  _ctx.lineTo(outerRect.x + outerRect.width, outerRect.y);
  _ctx.lineTo(outerRect.x + outerRect.width, outerRect.y + outerRect.height);
  _ctx.lineTo(outerRect.x, outerRect.y + outerRect.height);
  _ctx.closePath();
  _ctx.strokeStyle = color;
  _ctx.save();
  SetLineThick(thickness);
  _ctx.stroke();
  _ctx.restore();
}

function DrawRectangleV(pos, size, color) {
  DrawRectangle(pos.x, pos.y, size.x, size.y, color);
}

function DrawRectangleRounded(rect, roundness, color) {
  _ctx.beginPath();
  _ctx.fillStyle = color;
  _ctx.roundRect(rect.x, rect.y, rect.width, rect.height, roundness);
  _ctx.fill();
}

function DrawRectangleRoundedLines(rect, roundness, color) {
  _ctx.beginPath();
  _ctx.strokeStyle = color;
  _ctx.roundRect(rect.x, rect.y, rect.width, rect.height, roundness);
  _ctx.stroke();
}

function DrawRectangleRoundedLinesEx(rect, roundness, thickness, color) {
  _ctx.save();
  SetLineThick(thickness);
  DrawRectangleRoundedLines(rect, roundness, color);
  _ctx.restore();
}

function DrawSquareGrid(x, y, cols, rows, cellSize, color = LIGHTGRAY, thickness = 1) {
  _ctx.save();
  _ctx.strokeStyle = color;
  SetLineThick(thickness);

  _ctx.beginPath();
  for (let i = 0; i <= cols; i++) {
    const xPos = x + i * cellSize;
    _ctx.moveTo(xPos, y);
    _ctx.lineTo(xPos, y + rows * cellSize);
  }
  for (let j = 0; j <= rows; j++) {
    const yPos = y + j * cellSize;
    _ctx.moveTo(x, yPos);
    _ctx.lineTo(x + cols * cellSize, yPos);
  }
  _ctx.stroke();
  _ctx.restore();
}

function DrawLine(x1, y1, x2, y2, color, thickness) {
  _ctx.strokeStyle = color;
  _ctx.beginPath();
  _ctx.moveTo(x1, y1);
  _ctx.lineTo(x2, y2);
  if (thickness && _ctx.lineWidth !== thickness) {
    _ctx.save();
    SetLineThick(thickness);
  }
  _ctx.stroke();
  if (thickness && _ctx.lineWidth !== thickness) {
    _ctx.restore();
  }
  _ctx.closePath();
}

function DrawCircle(centerX, centerY, radius, color) {
  _ctx.beginPath();
  _ctx.fillStyle = color;
  _ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  _ctx.fill();
}

function DrawCircleLines(centerX, centerY, radius, color) {
  _ctx.beginPath();
  _ctx.strokeStyle = color;
  _ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  _ctx.stroke();
}

function DrawCircleV(center, radius, color) {
  DrawCircle(center.x, center.y, radius, color);
}

function DrawCircleLinesV(center, radius, color) {
  DrawCircleLines(center.x, center.y, radius, color);
}

function DrawCircleLinesEx(circle, thickness, color) {
  _ctx.save();
  SetLineThick(thickness);
  DrawCircleLines(circle.center.x, circle.center.y, circle.radius, color);
  _ctx.restore();
}

function DrawPolyLines(center, sides, radius, rotation, color) {
  if (sides < 3) return;
  _ctx.beginPath();
  _ctx.moveTo(center.x + radius * Math.cos(rotation), center.y + radius * Math.sin(rotation));
  for (let i = 1; i < sides; i++) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    _ctx.lineTo(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
  }
  _ctx.closePath();
  _ctx.strokeStyle = color;
  _ctx.stroke();
}

function DrawPoly(center, sides, radius, rotation, color) {
  if (sides < 3) return;
  DrawPolyLines(center, sides, radius, rotation);
  _ctx.fillStyle = color;
  _ctx.fill();
}

function DrawTriangle(v1, v2, v3, color) {
  _ctx.beginPath();
  _ctx.moveTo(v1.x, v1.y);
  _ctx.lineTo(v2.x, v2.y);
  _ctx.lineTo(v3.x, v3.y);
  _ctx.closePath();
  _ctx.fillStyle = color;
  _ctx.fill();
}

function DrawTriangleLines(v1, v2, v3, color) {
  _ctx.beginPath();
  _ctx.moveTo(v1.x, v1.y);
  _ctx.lineTo(v2.x, v2.y);
  _ctx.lineTo(v3.x, v3.y);
  _ctx.closePath();
  _ctx.strokeStyle = color;
  _ctx.stroke();
}

function SetFont(newFont) {
  if (_cachedFont != newFont) {
    _ctx.font = newFont;
    _ctx.fillText("caching", -9999, -9999);
  } else _ctx.font = _cachedFont;
}

function DrawText(text, x, y, size = null, color = null) {
  if (!String(text).length) return;
  _ctx.save();
  if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
  _ctx.textAlign = "left";
  _ctx.textBaseline = "top";
  const fontFamily = _ctx.font.split("px")[1];
  const newFont = `${size || parseInt(_ctx.font)}px ${fontFamily}`.trim();
  SetFont(newFont);
  _ctx.fillText(text, x, y);
}

function DrawTextCentered(text, x, y, size = null, color = null) {
  if (!String(text).length) return;
  _ctx.save();
  if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
  _ctx.textAlign = "center";
  _ctx.textBaseline = "middle";
  const fontFamily = _ctx.font.split("px")[1];
  const newFont = `${size || parseInt(_ctx.font)}px ${fontFamily}`.trim();
  SetFont(newFont);
  _ctx.fillText(text, x, y);
}

function DrawTextEx(text, x, y, size, color, align, baseline, { weight, style, font } = {}) {
  if (!String(text).length) return;
  _ctx.save();
  if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
  if (align && _ctx.textAlign != align) _ctx.textAlign = align;
  if (baseline && _ctx.textBaseline != baseline) _ctx.textBaseline = baseline;
  if (size || weight || style || font) {
    const fontFamily = font || _ctx.font.split("px")[1];
    const newFont = `${style || ""} ${weight || ""} ${size || parseInt(_ctx.font)}px ${fontFamily}`.trim();
    // const sanitizedNewFont = newFont.split(" ").filter(t => t).map(t => t.trim()).join(" ");
    SetFont(newFont);
  }
  _ctx.fillText(text, x, y);
  _ctx.restore();
}

const _buttonStyles = {
  default: {
    normal: ["#c9c9c9", "#838383", "#686868"],
    focused: ["#c9effe", "#5bb2d9", "#6c9bbc"],
    pressed: ["#97e8ff", "#0492c7", "#368baf"],
    disabled: ["#e6e9e9", "#b5c1c2", "#aeb7b8"]
  },
  dark: {
    normal: ["#2c2c2c", "#878787", "#c3c3c3"],
    focused: ["#848484", "#e1e1e1", "#181818"],
    pressed: ["#efefef", "#000000", "#202020"],
    disabled: ["#818181", "#6a6a6a", "#606060"]
  },
  amber: {
    normal: ["#292929", "#898988", "#d4d4d4"],
    focused: ["#292929", "#eb891d", "#ffffff"],
    pressed: ["#f39333", "#f1cf9d", "#282020"],
    disabled: ["#6a6a6a", "#818181", "#606060"]
  }
};

const BS_DEFAULT = _buttonStyles.default;
const BS_DARK = _buttonStyles.dark;
const BS_AMBER = _buttonStyles.amber;

function Button(bounds, text, fontSize = null, style = BS_DEFAULT) {
  let innerColor;
  let outerColor;
  let textColor;

  let clicked = false;

  if (CheckCollisionPointRec(GetMousePosition(), bounds)) {
    innerColor = style.focused[0];
    outerColor = style.focused[1];
    textColor = style.focused[2];

    if (IsMouseButtonDown(MOUSE_LEFT_BUTTON)) {
      innerColor = style.pressed[0];
      outerColor = style.pressed[1];
      textColor = style.pressed[2];
    }
    if (IsMouseButtonReleased(MOUSE_LEFT_BUTTON)) {
      clicked = true;
    }
  } else {
    clicked = false;
    innerColor = style.normal[0];
    outerColor = style.normal[1];
    textColor = style.normal[2];
  }

  const textPos = Vector2(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  const outerThickness = Math.floor((bounds.width + bounds.height) / 64);
  DrawRectangleRec(bounds, innerColor);
  DrawRectangleLinesEx(bounds, outerThickness, outerColor);
  fontSize = fontSize || Math.min(bounds.height, bounds.width / text.length);
  DrawTextCentered(text, textPos.x, textPos.y, fontSize, textColor);

  return clicked;
}
