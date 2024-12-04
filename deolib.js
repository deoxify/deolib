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
let _lastTime = performance.now();
let _deltaTime = 0;
let _fps = 0;
let _fpsUpdateInterval = 250;
let _fpsFontSize;
let _canvasRect;

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
  prev: {}
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
const GetMousePosition = () => ({x: _mouse.x, y: _mouse.y});
const GetMouseX = () => _mouse.x;
const GetMouseY = () => _mouse.y;
const GetScreenWidth = () => _ctx.canvas.width;
const GetScreenHeight = () => _ctx.canvas.height;
const GetScreenRect = () => _canvasRect;
const GetFrameTime = () => _deltaTime;
const GetFPS = () => Math.floor(_fps);
const GetTime = () => (performance.now() - _firstTime) / 1000;

function InitWindow(width, height, title) {
  const _canvas = document.createElement("canvas");
  Object.assign(_canvas, { width, height });
  _ctx = _canvas.getContext("2d");
  _fpsFontSize = Math.floor((_ctx.canvas.width + _ctx.canvas.height) / 64);
  _canvas.oncontextmenu = e => e.preventDefault();
  _canvas.onmousemove = e => {
    const rect = _canvas.getBoundingClientRect();
    _mouse.x = Math.floor(e.clientX - rect.left);
    _mouse.y = Math.floor(e.clientY - rect.top);
  };
  _canvas.onmousedown = e => {
    if (e.button in _mouse) _mouse[e.button] = true;
  };
  _canvas.onmouseup = e => {
    if (e.button in _mouse) _mouse[e.button] = false;
  };
  _canvas.onmouseleave = () => {
    for (const buttonId in _mouse) _mouse[buttonId] = false;
  };
  window.onkeydown = e => {
    if (e.code.length) _keyboard[e.code] = true;
  };
  window.onkeyup = e => {
    if (e.code in _keyboard) _keyboard[e.code] = false;
  };
  window.onblur = () => {
    isPageFocused = false;
  };
  window.onfocus = () => {
    isPageFocused = true;
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

  _ctx.textAlign = "left";
  _ctx.textBaseline = "top";

  document.body.appendChild(_canvas);
  document.title = title;

  window.onload = () => {
      _canvasRect = new Rectangle(0, 0, _ctx.canvas.width, _ctx.canvas.height);
      SetFont("bold 20px monospace, system");
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

  function loop() {
    const now = performance.now();
    _deltaTime = (now - _lastTime) / 1000;
    _lastTime = now;

    if (isPageVisible) {
      _fps = 1 / _deltaTime;
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

const DrawFPS = (() => {
  let FPSTimer = 0;
  let lastFPS = 0;

  return function (x, y, updateInterval = _fpsUpdateInterval) {
    FPSTimer += _deltaTime * 1000;
    if (FPSTimer >= updateInterval) {
      lastFPS = GetFPS();
      FPSTimer = 0;
    }
    DrawText(`${lastFPS} FPS`, x, y, { weight: 900, size: _fpsFontSize, color: DARKGREEN });
  };
})();

function DrawRectangle(x, y, width, height, color) {
  _ctx.fillStyle = color;
  _ctx.fillRect(x, y, width, height);
}

function DrawRectangleRec(rect, color) {
  DrawRectangle(rect.x, rect.y, rect.width, rect.height, color);
}

function DrawRectangleLines(x, y, width, height, color) {
  _ctx.strokeStyle = color;
  _ctx.strokeRect(x, y, width, height);
}

function DrawRectangleLinesEx(rect, thickness, color) {
  _ctx.strokeStyle = color;
  _ctx.save();
  _ctx.lineWidth = thickness;
  const x = rect.x + thickness / 2;
  const y = rect.y + thickness / 2;
  const w = rect.width - thickness;
  const h = rect.height - thickness;
  _ctx.strokeRect(x, y, w, h);
  _ctx.restore();
}

function CheckCollisionPointRec(point, rect) {
  return point.x > rect.x && point.y > rect.y && point.x < rect.x + rect.w && point.y < rect.y + rect.h;
}

function DrawLine(x1, y1, x2, y2, color, thickness) {
  function stroke() {
    _ctx.stroke();
  }
  _ctx.strokeStyle = color;
  _ctx.beginPath();
  _ctx.moveTo(x1, y1);
  _ctx.lineTo(x2, y2);
  if (thickness) {
    _ctx.save();
    _ctx.lineWidth = thickness;
    stroke();
    _ctx.restore();
  } else stroke();
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

function DrawCircleLinesEx(circle, thickness, color) {
  _ctx.save();
  SetLineThick(thickness);
  DrawCircleLines(circle.center.x, circle.center.y, circle.radius, color);
  _ctx.restore();
}

function SetFont(fontStr) {
  _ctx.font = fontStr.trim();
  _ctx.fillText("cache", -9999, -9999);
}

function DrawText(text, x, y, { size, color, align, baseline, weight, style, font } = {}) {
  if (!text) return;
  _ctx.save();
  if (color) _ctx.fillStyle = color;
  if (align) _ctx.textAlign = align;
  if (baseline) _ctx.textBaseline = baseline;
  if (size || weight || style || font) {
    const fontFamily = font || _ctx.font.split("px")[1];
    _ctx.font = `${style || ""} ${weight || ""} ${size || parseInt(_ctx.font)}px ${fontFamily}`.trim();
  }
  _ctx.fillText(text, x, y);
  _ctx.restore();
}

class _TestObject {
  static _objects = [];

  constructor() {
    this.color = GetRandomColor();
    const size = GetRandomValue(_ctx.canvas.width / 64, _ctx.canvas.width / 16);
    const x = GetRandomValue(size, _ctx.canvas.width - size);
    const y = GetRandomValue(size, _ctx.canvas.height - size);

    this.shape = Math.random() < 0.5 ? new Circle(new Vector2(x, y), size) : new Rectangle(x, y, size, size);
    this.hallow = Math.random() < 0.5;
    if (this.hallow) this.thickness = GetRandomValue(size / 8, size / 4);

    const getSpeed = (min, max) => GetRandomValue(min, max) * (Math.random() < 0.5 ? -1 : 1);
    this.vx = getSpeed(_ctx.canvas.width / 8, _ctx.canvas.width / 2);
    this.vy = getSpeed(_ctx.canvas.height / 8, _ctx.canvas.height / 2);
  }

  _render() {
    const canvasRect = new Rectangle(0, 0, _ctx.canvas.width, _ctx.canvas.height);
    const dx = this.vx * _deltaTime,
      dy = this.vy * _deltaTime;

    if (this.shape instanceof Circle) {
      this.hallow
        ? DrawCircleLinesEx(this.shape, this.thickness, this.color)
        : DrawCircle(this.shape.center.x, this.shape.center.y, this.shape.radius, this.color);

      this._handleCircleCollision(canvasRect, dx, dy);
    } else if (this.shape instanceof Rectangle) {
      this.hallow
        ? DrawRectangleLinesEx(this.shape, this.thickness, this.color)
        : DrawRectangleRec(this.shape, this.color);

      this._handleRectangleCollision(canvasRect, dx, dy);
    }
  }

  _handleCircleCollision(rect, dx, dy) {
    const c = this.shape.center,
      r = this.shape.radius;

    if (c.x - r + dx < 0) {
      c.x = r;
      this.vx = -this.vx;
    } else if (c.x + r + dx > rect.width) {
      c.x = rect.width - r;
      this.vx = -this.vx;
    }

    if (c.y - r + dy < 0) {
      c.y = r;
      this.vy = -this.vy;
    } else if (c.y + r + dy > rect.height) {
      c.y = rect.height - r;
      this.vy = -this.vy;
    }

    c.x += dx;
    c.y += dy;
  }

  _handleRectangleCollision(rect, dx, dy) {
    const s = this.shape;

    if (s.x + dx < 0) {
      s.x = 0;
      this.vx = -this.vx;
    } else if (s.x + s.width + dx > rect.width) {
      s.x = rect.width - s.width;
      this.vx = -this.vx;
    }

    if (s.y + dy < 0) {
      s.y = 0;
      this.vy = -this.vy;
    } else if (s.y + s.height + dy > rect.height) {
      s.y = rect.height - s.height;
      this.vy = -this.vy;
    }

    s.x += dx;
    s.y += dy;
  }
}

function AddTestObjects(count) {
  for (let i = 0; i < count; ++i) _TestObject._objects.push(new _TestObject());
}

function RenderTestObjects() {
  for (const obj of _TestObject._objects) obj._render();
}
