class Vector2 {
  constructor(x = 0, y = 0) {
    Object.assign(this, { x, y });
  }
}

class Circle {
  constructor(center, radius) {
    Object.assign(this, { center, radius });
  }
}

class Rectangle {
  constructor(x, y, width, height) {
    Object.assign(this, { x, y, width, height });
  }
}

let _ctx;
let _firstTime = performance.now();
let _lastTime;
let _frameTime = 0;
let _fps = 0;
let _avgFPS = 0;
let _fpsUpdateInterval = 250;
let _fpsFontSize;
let _cachedFont;
let _canvasRect;
let _mouseInCanvas;

const LIGHTGRAY = "#c8c8c8";
const GRAY = "#828282";
const DARKGRAY = "#505050";
const DEOGRAY = "#101010";
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
const VIOLET = "#873cbe";
const DARKPURPLE = "#701f7e";
const BEIGE = "#d3b083";
const BROWN = "#7f6a4f";
const DARKBROWN = "#4c3f2f";
const WHITE = "#ffffff";
const BLACK = "#000000";
const BLANK = "#00000000";
const MAGENTA = "#ff00ff";

const MOUSE_LEFT_BUTTON = 0;
const MOUSE_MIDDLE_BUTTON = 1;
const MOUSE_RIGHT_BUTTON = 2;

const _mouse = {
  x: 0,
  y: 0,
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

const GetRandomValue = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const GetRandomElem = arr => arr[GetRandomValue(0, arr.length)];
const GetRandomColor = () => "#" + ((Math.random() * 0xffffff) << 0).toString(16);
const IsMouseButtonDown = buttonId => buttonId in _mouse && _mouse[buttonId];
const IsMouseButtonUp = buttonId => buttonId in _mouse && !_mouse[buttonId];
const IsMouseButtonPressed = buttonId => buttonId in _mouse && !_mouse.prev[buttonId] && _mouse[buttonId];
const IsMouseButtonReleased = buttonId => buttonId in _mouse && _mouse.prev[buttonId] && !_mouse[buttonId];
const IsKeyDown = keyCode => keyCode in _keyboard && _keyboard[keyCode];
const IsKeyUp = keyCode => keyCode in _keyboard && !_keyboard[keyCode];
const IsKeyPressed = keyCode => keyCode in _keyboard && !_keyboard.prev[keyCode] && _keyboard[keyCode];
const IsKeyReleased = keyCode => keyCode in _keyboard && _keyboard.prev[keyCode] && !_keyboard[keyCode];
const GetMousePosition = () => ({ x: _mouse.x, y: _mouse.y });
const GetMouseX = () => _mouse.x;
const GetMouseY = () => _mouse.y;
const GetScreenWidth = () => _ctx.canvas.width;
const GetScreenHeight = () => _ctx.canvas.height;
const GetScreenRect = () => _canvasRect;
const GetFrameTime = () => _frameTime;
const GetFPS = () => _fps;
const GetTime = () => (performance.now() - _firstTime) / 1000;

function InitWindow(width, height, title) {
  const _canvas = document.createElement("canvas");
  _ctx = _canvas.getContext("2d");
  _canvas.width = width;
  _canvas.height = height;
  _canvas.oncontextmenu = e => e.preventDefault();
  _canvas.onmouseenter = () => (_mouseInCanvas = true);
  _canvas.onmouseleave = () => (_mouseInCanvas = false);
  _canvas.onmousemove = e => {
    const rect = _canvas.getBoundingClientRect();
    _mouse.x = Math.floor(e.clientX - rect.left);
    _mouse.y = Math.floor(e.clientY - rect.top);
  };
  _canvas.onmousedown = e => {
    if (_mouseInCanvas) _mouse[e.button] = true;
  };
  _canvas.onmouseup = e => {
    if (_mouseInCanvas) _mouse[e.button] = false;
  };
  window.onkeydown = e => {
    if (e.code.length) _keyboard[e.code] = true;
  };
  window.onkeyup = e => {
    if (e.code in _keyboard) _keyboard[e.code] = false;
  };

  Object.assign(_canvas.style, {
    maxWidth: "100vw",
    maxHeight: "100vh"
  });

  Object.assign(document.body.style, {
    backgroundColor: "#111111",
    width: "100vw",
    height: "100vh",
    margin: "0",
    padding: "0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  });

  window.onload = () => {
    _ctx.textAlign = "left";
    _ctx.textBaseline = "top";
    _ctx.lineCap = "square";
    document.body.appendChild(_canvas);
    document.title = title;
    _canvasRect = new Rectangle(0, 0, _ctx.canvas.width, _ctx.canvas.height);
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

function CheckCollisionRecs(rect1, rect2) {
  const r1x2 = rect1.x + rect1.width;
  const r1y2 = rect1.y + rect1.height;
  const r2x2 = rect2.x + rect2.width;
  const r2y2 = rect2.y + rect2.height;
  return rect1.x < r2x2 && r1x2 > rect2.x && rect1.y < r2y2 && r1y2 > rect2.y;
}

function CheckCollisionCircleRec(circle, rect) {
  const dx = circle.center.x - Math.max(rect.x, Math.min(circle.center.x, rect.x + rect.width));
  const dy = circle.center.y - Math.max(rect.y, Math.min(circle.center.y, rect.y + rect.height));
  return dx * dx + dy * dy <= circle.radius * circle.radius;
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
  _ctx.fillStyle = color;
  _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
}

function SetLineThick(thickness) {
  _ctx.lineWidth = thickness;
}

function Clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function _updateFPS() {
  _avgFPS = 0.05 / _frameTime + 0.95 * _avgFPS;
  _fps = Math.floor(_avgFPS);
}

const DrawFPS = (() => {
  let FPSTimer = 0;
  let lastFPS = 0;

  return function (x, y, updateInterval = _fpsUpdateInterval) {
    FPSTimer += _frameTime * 1000;
    if (FPSTimer >= updateInterval) {
      lastFPS = GetFPS();
      FPSTimer = 0;
    }
    DrawText(`${lastFPS} FPS`, x, y, _fpsFontSize, DARKGREEN, { weight: 900 });
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

function DrawRectangleLinesEx(rect, thickness, color) {
  const x = rect.x + thickness * 0.5;
  const y = rect.y + thickness * 0.5;
  _ctx.save();
  _ctx.strokeStyle = color;
  _ctx.lineWidth = thickness;
  _ctx.strokeRect(x, y, rect.width - thickness, rect.height - thickness);
  _ctx.restore();
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
  _ctx.lineWidth = thickness;
  DrawRectangleRoundedLines(rect, roundness, color);
  _ctx.restore();
}

function DrawSquareGrid(x, y, cols, rows, cellSize, color = LIGHTGRAY, thickness = 2) {
  _ctx.save();
  _ctx.strokeStyle = color;
  _ctx.lineWidth = thickness;

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

function CheckCollisionPointRec(point, rect) {
  return point.x > rect.x && point.y > rect.y && point.x < rect.x + rect.width && point.y < rect.y + rect.height;
}

function DrawLine(x1, y1, x2, y2, color, thickness) {
  _ctx.strokeStyle = color;
  _ctx.beginPath();
  _ctx.moveTo(x1, y1);
  _ctx.lineTo(x2, y2);
  if (thickness && _ctx.lineWidth !== thickness) {
    _ctx.save();
    _ctx.lineWidth = thickness;
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

function SetFont(newFont) {
  if (_cachedFont != newFont) {
    _ctx.font = newFont;
    _ctx.fillText("caching", -9999, -9999);
  } else _ctx.font = _cachedFont;
}

function DrawText(text, x, y, size = null, color = null, { align, baseline, weight, style, font } = {}) {
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
