let _ctx;
let _firstTime = performance.now();
let _lastTime = performance.now();
let _targetFrameTime = 0;
let _targetFPS = 0;
let _deltaTime = 0;
let _fps = 0;
let _vsync = true;
let _worker;

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

let _mouse = {
  x: 0,
  y: 0,
  [MOUSE_LEFT_BUTTON]: false,
  [MOUSE_MIDDLE_BUTTON]: false,
  [MOUSE_RIGHT_BUTTON]: false,
  prev: {}
};

let _keyboard = {
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
const GetScreenWidth = () => _ctx.canvas.width;
const GetScreenHeight = () => _ctx.canvas.height;
const GetFrameTime = () => _deltaTime;
const GetFPS = () => Math.floor(_fps);
const GetTime = () => (performance.now() - _firstTime) / 1000;

function InitWindow(width, height, title) {
  const _canvas = document.createElement("canvas");
  _ctx = _canvas.getContext("2d");
  document.title = title;

  _canvas.width = width;
  _canvas.height = height;
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
  document.onvisibilitychange = () => {
    isPageVisible = !document.hidden;
  };
  window.onblur = () => {
    isPageFocused = false;
  };
  window.onfocus = () => {
    isPageFocused = true;
  };

  Object.assign(_canvas.style, {
    border: "3px double gray",
    maxWidth: "100vw",
    maxHeight: "100vh"
  });

  Object.assign(document.body.style, {
    backgroundColor: "#111111",
    width: "100vw",
    height: "100vh",
    margin: "0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  });

  _ctx.textAlign = "left";
  _ctx.textBaseline = "top";
  _ctx.font = "20px grixel";

  document.body.appendChild(_canvas);

  const font = new FontFace("grixel", "url(grixel.ttf)");
  window.onload = () => {
    font.load().then(loadedFont => {
      document.fonts.add(loadedFont);
      _canvas.style.fontFamily = "grixel";
      if (typeof main === "function") {
        __startGameLoop(main);
      } else {
        console.warn("main() missing");
      }
    });
  };
}

class TestObject {
  constructor() {
    this.r = GetRandomValue(_ctx.canvas.width / 64, _ctx.canvas.width / 16);
    this.x = GetRandomValue(this.r, _ctx.canvas.width - this.r);
    this.y = GetRandomValue(this.r, _ctx.canvas.height - this.r);
    this.c = GetRandomColor();
    this.vx = Math.random() < 0.5 ? GetRandomValue(-100, -50) : GetRandomValue(50, 100);
    this.vy = Math.random() < 0.5 ? GetRandomValue(-100, -50) : GetRandomValue(50, 100);
  }
  render() {
    const dx = this.vx * _deltaTime;
    const dy = this.vy * _deltaTime;
    this.x += dx;
    this.y += dy;
    if (this.x + this.r > _ctx.canvas.width) {
      this.x = _ctx.canvas.width - this.r;
      this.vx = -this.vx;
    }
    if (this.y + this.r > _ctx.canvas.height) {
      this.y = _ctx.canvas.height - this.r;
      this.vy = -this.vy;
    }
    if (this.x - this.r < 0) {
      this.x = this.r;
      this.vx = -this.vx;
    }
    if (this.y - this.r < 0) {
      this.y = this.r;
      this.vy = -this.vy;
    }
    DrawCircle(this.x, this.y, this.r, this.c);
  }
}

function SetVsync(onOff) {
  _vsync = onOff;
}

function SetTargetFPS(fps) {
  _targetFPS = fps;
  _targetFrameTime = 1000 / fps;
}

function __startGameLoop(callback) {
  let accumulator = 0;
  let isPageVisible = true;
  let isPageFocused = true;
  let frameRef;

  function loop() {
    const now = performance.now();
    _deltaTime = now - _lastTime;
    _lastTime = now;
    accumulator += _deltaTime;

    if (isPageVisible || isPageFocused) {
      _deltaTime = accumulator / 1000;
      _fps = 1 / _deltaTime;
      callback();
      _updatePrevMouseState();
      _updatePrevKeyboardState();
      accumulator = 0;
      frameRef = requestAnimationFrame(loop);
    } else cancelAnimationFrame(frameRef);
  }
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

  return function (x, y) {
    const fontSize = Math.floor(_ctx.canvas.width / 42);
    FPSTimer += _deltaTime * 1000;
    if (FPSTimer >= 250) {
      lastFPS = GetFPS();
      FPSTimer = 0;
    }
    DrawText(`${lastFPS} FPS`, x, y, { weight: 900, size: fontSize, color: DARKGREEN });
  };
})();

function DrawRectangle(x, y, w, h, color) {
  _ctx.fillStyle = color;
  _ctx.fillRect(x, y, w, h);
}

function DrawRectangleRec(rect, color) {
  DrawRectangle(rect.x, rect.y, rect.w, rect.h, color);
}

function DrawRectangleLines(x, y, w, h, color) {
  _ctx.strokeStyle = color;
  _ctx.strokeRect(x, y, w, h);
}

function DrawRectangleLinesEx(rect, thickness, color) {
  _ctx.strokeStyle = color;
  _ctx.save();
  _ctx.lineWidth = thickness;
  const x = rect.x + thickness / 2;
  const y = rect.y + thickness / 2;
  const w = rect.w - thickness;
  const h = rect.h - thickness;
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

function SetFont(fontStr) {
  _ctx.font = fontStr.trim();
  _ctx.fillText("cache", -9999, -9999);
}

function DrawText(text, x, y, { size, color, align, baseline, weight, style, font } = {}) {
  if (!text) return;
  _ctx.save();
  if (size || weight || style || font) {
    const fontFamily = font || _ctx.font.split(" ").pop();
    _ctx.font = `${style || ""} ${weight || ""} ${size || parseInt(_ctx.font)}px ${fontFamily}`.trim();
  }
  if (color) _ctx.fillStyle = color;
  if (align) _ctx.textAlign = align;
  if (baseline) _ctx.textBaseline = baseline;
  _ctx.fillText(text, x, y);
  _ctx.restore();
}
