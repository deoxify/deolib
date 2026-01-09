"use strict";

let _ctx,
    _firstTime,
    _lastTime,
    _frameTime,
    _fps,
    _avgFPS,
    _fpsFontSize,
    _cachedFont,
    _fpsSamples = [],
    _masterGain = null;

const _imageCache = new Map();
const _spriteCache = new Map();
const _guiButtons = new Map();
const _audioCache = new Map();
const _audioCtx = new AudioContext();

const dl = {};

dl.TWO_PI = Math.PI * 2;
dl.DEG2RAD = Math.PI / 180;
dl.RAD2DEG = 180 / Math.PI;
dl.FLT_EPSILON = 1.19209290E-07;

dl.LIGHTGRAY = "#c8c8c8";
dl.GRAY = "#828282";
dl.DARKGRAY = "#505050";
dl.COAL = "#101010";
dl.YELLOW = "#fdf900";
dl.GOLD = "#ffcb00";
dl.ORANGE = "#ffa100";
dl.PINK = "#ff6dc2";
dl.RED = "#e62937";
dl.MAROON = "#be2137";
dl.GREEN = "#00e430";
dl.LIME = "#009e2f";
dl.DARKGREEN = "#00752c";
dl.SKYBLUE = "#66bfff";
dl.BLUE = "#0079f1";
dl.DARKBLUE = "#0052ac";
dl.PURPLE = "#c87aff";
dl.CYAN = "#00FFFF";
dl.VIOLET = "#873cbe";
dl.DARKPURPLE = "#701f7e";
dl.BEIGE = "#d3b083";
dl.BROWN = "#7f6a4f";
dl.DARKBROWN = "#4c3f2f";
dl.WHITE = "#ffffff";
dl.BLACK = "#000000";
dl.MAGENTA = "#ff00ff";
dl.BLANK = "transparent";

dl.CURSOR_DEFAULT = "default";
dl.CURSOR_CROSSHAIR = "crosshair";
dl.CURSOR_POINTER = "pointer";
dl.CURSOR_HIDDEN = "none";

dl.LEFT_MOUSE_BUTTON = 0;
dl.MIDDLE_MOUSE_BUTTON = 1;
dl.RIGHT_MOUSE_BUTTON = 2;

const _mouse = {
    x: -1,
    y: -1,
    prevX: -1,
    prevY: -1,
    wheel: 0,
    isInCanvas: false,
    [dl.LEFT_MOUSE_BUTTON]: false,
    [dl.MIDDLE_MOUSE_BUTTON]: false,
    [dl.RIGHT_MOUSE_BUTTON]: false,
    prev: {
        [dl.LEFT_MOUSE_BUTTON]: false,
        [dl.MIDDLE_MOUSE_BUTTON]: false,
        [dl.RIGHT_MOUSE_BUTTON]: false
    }
};

const _keyboard = {
    prev: {}
};


dl.Vector2 = (x = 0, y = 0) => ({ x, y });
dl.Vector2Zero = (out = null) => out ? (out.x = 0, out.y = 0, out) : dl.Vector2();
dl.Vector2FromArray = (arr, out = null) => out ? (out.x = arr[0], out.y = arr[1], out) : dl.Vector2(arr[0], arr[1]);

dl.Vector2Add = (v1, v2, out = null) => {
    if (out) { out.x = v1.x + v2.x; out.y = v1.y + v2.y; return out; }
    return dl.Vector2(v1.x + v2.x, v1.y + v2.y);
};

dl.Vector2Subtract = (v1, v2, out = null) => {
    if (out) { out.x = v1.x - v2.x; out.y = v1.y - v2.y; return out; }
    return dl.Vector2(v1.x - v2.x, v1.y - v2.y);
};

dl.Vector2Multiply = (v1, v2, out = null) => {
    if (out) { out.x = v1.x * v2.x; out.y = v1.y * v2.y; return out; }
    return dl.Vector2(v1.x * v2.x, v1.y * v2.y);
};

dl.Vector2Divide = (v1, v2, out = null) => {
    if (v2.x === 0 || v2.y === 0) return out ? (out.x = 0, out.y = 0, out) : dl.Vector2(0, 0);
    if (out) { out.x = v1.x / v2.x; out.y = v1.y / v2.y; return out; }
    return dl.Vector2(v1.x / v2.x, v1.y / v2.y);
};

dl.Vector2DivideScalar = (v, scalar, out = null) => {
    if (scalar === 0) return out ? (out.x = 0, out.y = 0, out) : dl.Vector2(0, 0);
    if (out) { out.x = v.x / scalar; out.y = v.y / scalar; return out; }
    return dl.Vector2(v.x / scalar, v.y / scalar);
};

dl.Vector2Scale = (v, scalar, out = null) => {
    if (out) { out.x = v.x * scalar; out.y = v.y * scalar; return out; }
    return dl.Vector2(v.x * scalar, v.y * scalar);
};

dl.Vector2Lerp = (v1, v2, t, out = null) => {
    const x = dl.lerp(v1.x, v2.x, t);
    const y = dl.lerp(v1.y, v2.y, t);
    if (out) { out.x = x; out.y = y; return out; }
    return dl.Vector2(x, y);
};

dl.Vector2Normalize = (v, out = null) => {
    const mag = Math.sqrt((v.x * v.x) + (v.y * v.y));
    if (mag === 0) return out ? (out.x = 0, out.y = 0, out) : dl.Vector2();
    return dl.Vector2Scale(v, 1 / mag, out);
};

dl.Vector2Copy = (v, out = null) => {
    if (out) { out.x = v.x; out.y = v.y; return out; }
    return dl.Vector2(v.x, v.y);
};

dl.Vector2MoveTowards = (v, target, maxDistance, out = null) => {
    const dx = target.x - v.x;
    const dy = target.y - v.y;
    const sqrDist = dx * dx + dy * dy;
    if (sqrDist === 0 || (maxDistance >= 0 && sqrDist <= maxDistance * maxDistance)) {
        if (out) { out.x = target.x; out.y = target.y; return out; }
        return dl.Vector2(target.x, target.y);
    }
    const dist = Math.sqrt(sqrDist);
    const factor = maxDistance / dist;
    if (out) { out.x = v.x + dx * factor; out.y = v.y + dy * factor; return out; }
    return dl.Vector2(v.x + dx * factor, v.y + dy * factor);
};

dl.Vector2Rotate = (v, angle, out = null) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rx = v.x * cos - v.y * sin;
    const ry = v.x * sin + v.y * cos;
    if (out) { out.x = rx; out.y = ry; return out; }
    return dl.Vector2(rx, ry);
};

dl.Vector2Reflect = (v, normal, out = null) => {
    const dot = v.x * normal.x + v.y * normal.y;
    const rx = v.x - 2 * dot * normal.x;
    const ry = v.y - 2 * dot * normal.y;
    if (out) { out.x = rx; out.y = ry; return out; }
    return dl.Vector2(rx, ry);
};


dl.Vector2Magnitude = (v) => Math.sqrt((v.x * v.x) + (v.y * v.y));
dl.Vector2Length = dl.Vector2Magnitude;

dl.Vector2Dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y;
dl.Vector2Cross = (v1, v2) => v1.x * v2.y - v1.y * v2.x;
dl.Vector2Distance = (v1, v2) => Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
dl.Vector2DistanceSqr = (v1, v2) => (v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y);
dl.Vector2Equals = (v1, v2) => v1.x == v2.x && v1.y == v2.y;
dl.Vector2Angle = (v1, v2) => v2 == undefined ? Math.atan2(v1.y, v1.x) : Math.atan2(v2.y - v1.y, v2.x - v1.x);
dl.Vector2ToString = (v) => `Vector2(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`;
dl.Vector2IsZero = (v, threshold = 0.00001) => (Math.abs(v.x) < threshold && Math.abs(v.y) < threshold);

dl.Rectangle = (x, y, width, height) => ({ x, y, width, height });

dl.clamp = (value, min, max) => Math.max(min, Math.min(max, value));
dl.lerp = (a, b, t) => a + (b - a) * t;

dl.isMouseInCanvas = () => _mouse.isInCanvas;
dl.isMouseButtonDown = (buttonId = dl.LEFT_MOUSE_BUTTON) => buttonId in _mouse && _mouse[buttonId];
dl.isMouseButtonUp = (buttonId = dl.LEFT_MOUSE_BUTTON) => buttonId in _mouse && !_mouse[buttonId];
dl.isMouseButtonPressed = (buttonId = dl.LEFT_MOUSE_BUTTON) => buttonId in _mouse && !_mouse.prev[buttonId] && _mouse[buttonId];
dl.isMouseButtonReleased = (buttonId = dl.LEFT_MOUSE_BUTTON) => buttonId in _mouse && _mouse.prev[buttonId] && !_mouse[buttonId];
dl.isKeyDown = (keyCode) => keyCode in _keyboard && _keyboard[keyCode];
dl.isKeyUp = (keyCode) => keyCode in _keyboard && !_keyboard[keyCode];
dl.isKeyPressed = (keyCode) => keyCode in _keyboard && !_keyboard.prev[keyCode] && _keyboard[keyCode];
dl.isKeyReleased = (keyCode) => keyCode in _keyboard && _keyboard.prev[keyCode] && !_keyboard[keyCode];
dl.getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
dl.getRandomFloat = (min, max) => Math.random() * (max - min) + min;
dl.getRandomElem = (arr) => arr[dl.getRandomInt(0, arr.length - 1)];
dl.getRandomColor = () => `#${(c => c < 0x202020 ? dl.getRandomColor().slice(1) : c.toString(16).padStart(6, '0'))((Math.random() * 0xffffff) << 0)}`;
dl.getMousePosition = () => dl.Vector2(Math.round(_mouse.currentFrameX), Math.round(_mouse.currentFrameY));
dl.getMouseDelta = () => dl.Vector2(_mouse.currentFrameX - _mouse.prevX, _mouse.currentFrameY - _mouse.prevY);
dl.getMouseWheelMove = () => {
    const move = _mouse.wheel;
    _mouse.wheel = 0;
    return move;
};
dl.getMouseX = () => _mouse.x;
dl.getMouseY = () => _mouse.y;
dl.getCanvasWidth = () => _ctx.canvas.width;
dl.getCanvasHeight = () => _ctx.canvas.height;
dl.getCanvasRect = () => dl.Rectangle(0, 0, _ctx.canvas.width, _ctx.canvas.height);
dl.getCanvasCenter = () => dl.Vector2(_ctx.canvas.width>>1, _ctx.canvas.height>>1);
dl.getFrameTime = () => _frameTime;
dl.getFPS = () => _avgFPS || 0;
dl.getTime = () => (performance.now() - _firstTime) / 1000;

dl.hideCursor = () => _ctx.canvas.style.cursor = dl.CURSOR_HIDDEN;
dl.showCursor = () => _ctx.canvas.style.cursor = dl.CURSOR_DEFAULT;

dl.initCanvas = ({
    width,
    height,
    title = "untitled",
    showContextMenu = false,
    autoExpand = false,
    pageBgColor = "#282828",
    antiAliasing = true,
    borderColor = "transparent"
}) => {
    const canvas = document.createElement("canvas");
    _ctx = canvas.getContext("2d");
    dl._canvas = canvas;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    _ctx.scale(dpr, dpr);

    const ar = width / height;

    const setCanvasDisplaySize = () => {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        let displayW, displayH;
        
        if (autoExpand) {
            if (winW / winH > ar) {
                displayW = winH * ar;
                displayH = winH;
            } else {
                displayW = winW;
                displayH = winW / ar;
            }
        } else {
            displayW = Math.min(width, winW);
            displayH = displayW / ar;
            if (displayH > winH) {
                displayH = winH;
                displayW = displayH * ar;
            }
        }

        canvas.style.width = `${displayW}px`;
        canvas.style.height = `${displayH}px`;
        if (_cachedFont) _ctx.font = _cachedFont;
    };

    window.addEventListener("resize", setCanvasDisplaySize);
    canvas.oncontextmenu = (e) => { if (!showContextMenu) e.preventDefault(); }
    canvas.onpointerenter = () => (_mouse.isInCanvas = true);
    canvas.onpointerleave = () => (_mouse.isInCanvas = false);
    canvas.onpointermove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const style = window.getComputedStyle(canvas);
        const borderL = parseFloat(style.borderLeftWidth) || 0;
        const borderT = parseFloat(style.borderTopWidth) || 0;
        const padL = parseFloat(style.paddingLeft) || 0;
        const padT = parseFloat(style.paddingTop) || 0;

        const contentW = rect.width - borderL - parseFloat(style.borderRightWidth) - padL - parseFloat(style.paddingRight);
        const contentH = rect.height - borderT - parseFloat(style.borderBottomWidth) - padT - parseFloat(style.paddingBottom);

        const scaleX = width / contentW;
        const scaleY = height / contentH;

        _mouse.x = (e.clientX - rect.left - borderL - padL) * scaleX;
        _mouse.y = (e.clientY - rect.top - borderT - padT) * scaleY;
    };
    canvas.onpointerdown = (e) => {
        if (_mouse.isInCanvas) _mouse[e.button] = true;
        if (_audioCtx.state == "suspended") _audioCtx.resume();
    };
    canvas.onpointerup = (e) => {
        if (_mouse.isInCanvas) _mouse[e.button] = false;
    };
    window.onkeydown = (e) => {
        if (e.code.length) _keyboard[e.code] = true;
    };
    window.onkeyup = (e) => {
        if (e.code in _keyboard) _keyboard[e.code] = false;
    };
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        _mouse.wheel = e.deltaY > 0 ? -1 : 1;
    }, { passive: false });

    Object.assign(canvas.style, {
        display: "block",
        boxSizing: "border-box",
        maxWidth: "100%",
        maxHeight: "100%",
        imageRendering: antiAliasing ? "smooth" : "pixelated",
        border: (borderColor && borderColor != "transparent") ? `1px solid ${borderColor}` : "none",
    });

    Object.assign(document.body.style, {
        backgroundColor: pageBgColor,
        margin: "0",
        padding: "0",
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    });

    _ctx.canvas.style.backgroundColor = dl.WHITE;

    let styleSheet = document.styleSheets[0];
    if (!styleSheet) {
        const s = document.createElement("style");
        document.head.appendChild(s);
        styleSheet = s.sheet;
    }
    styleSheet.insertRule(`* { margin: 0; padding: 0; box-sizing: border-box; }`, styleSheet.cssRules.length);

    const link = document.createElement('link');
    link.rel = "icon";
    link.type = "image/png";
    link.href = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAA";
    link.href += "f8/9hAAAAsUlEQVR4AaTNgQnDQAxD0bYjZP8Zs0LLM+hwTDgCDXzOlmTl8/r";
    link.href += "zuxSc5/l9Qv/nKnDIOI7jvUMmWXMVRHBo3iHjUMZbBUQQvWB2aJiZKiBCIEe";
    link.href += "7WRayVSAMIhigwQweaKBVgQERhe6QmVwKmEruiOftrIL8sZuZeUr7nrkKEhA";
    link.href += "yx/Ta6Zm92c1VYAjd7Md3Pm0VCBOCvZdFn28VJOgoRJsHc68CooMObcKf2iq";
    link.href += "YxtP9BwAA///OEEeOAAAABklEQVQDABh30CG/IL+KAAAAAElFTkSuQmCC";
    document.head.appendChild(link);

    window.onload = () => {
        _ctx.textAlign = "left";
        _ctx.textBaseline = "top";
        _ctx.lineCap = "square";
        document.body.appendChild(canvas);
        document.title = title;
        const w = _ctx.canvas.width;
        const h = _ctx.canvas.height;
        _fpsFontSize = Math.floor(Math.sqrt(w * w + h * h) / 50);
        _ctx.imageSmoothingEnabled = antiAliasing;
        dl.setFont("20px monospace, system, sans-serif");
        setCanvasDisplaySize();
        if (dl.main) _startGameLoop(dl.main);
        else console.error("missing dl.main()");
    };

    _firstTime = performance.now();

    return {
        width,
        height,
        title,
        aspectRatio: ar,
        autoExpand,
        pageBgColor,
        antiAliasing,
        borderColor,
        showContextMenu
    };
}

dl.setTitle = (newTitle) => {
    if (newTitle == undefined || newTitle == null) return;
    document.title = String(newTitle);
}

dl.setCursor = (cursor) => {
    _ctx.canvas.style.cursor = cursor;
}

const _charSets = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/\\",
    similar: /[ilI1L0oOOD]/g
};

dl.getRandomString = (length, options = {}) => {
    const opts = { ...{
        lowercase: true,
        uppercase: true,
        numbers: true,
        symbols: false,
        excludeSimilar: false,
        customPool: ""
    }, ...options };

    let pool = opts.customPool || "";
    
    if (!pool) {
        if (opts.lowercase) pool += _charSets.lowercase;
        if (opts.uppercase) pool += _charSets.uppercase;
        if (opts.numbers)   pool += _charSets.numbers;
        if (opts.symbols)   pool += _charSets.symbols;
    }

    if (opts.excludeSimilar) pool = pool.replace(_charSets.similar, "");

    if (pool.length === 0) pool = _charSets.lowercase;

    let result = "";
    for (let i = 0; i < length; ++i) {
        result += pool[dl.getRandomInt(0, pool.length - 1)];
    }
    
    return result;
};

const _loadGenericImage = (fileName, spriteWidth = null, spriteHeight = null) => {
    if (_imageCache.has(fileName)) return _imageCache.get(fileName);

    const placeholder = new Image();
    const img = new Image();
    
    const meta = { spriteWidth, spriteHeight };
    Object.assign(placeholder, meta);

    img.onload = () => {
        Object.assign(img, meta);
        _imageCache.set(fileName, img);
        Object.assign(placeholder, { src: img.src, width: img.width, height: img.height });
    };
    
    img.onerror = err => console.error(`Failed to load: ${fileName}`, err);
    img.src = fileName;

    _imageCache.set(fileName, placeholder);
    return placeholder;
};

dl.loadImage = (fileName) => _loadGenericImage(fileName);
dl.loadSpreadSheet = (fileName, sw, sh) => _loadGenericImage(fileName, sw, sh);

dl.drawSprite = (
    spriteSheet,
    colIndex,
    rowIndex,
    destX,
    destY,
    destWidth = spriteSheet.spriteWidth,
    destHeight = spriteSheet.spriteHeight
) => {
    const sw = spriteSheet.spriteWidth;
    const sh = spriteSheet.spriteHeight;

    const sx = (colIndex - 1) * sw;
    const sy = (rowIndex - 1) * sh;

    _ctx.drawImage(
        spriteSheet, 
        sx, sy, sw, sh,
        destX, destY, destWidth, destHeight
    );
}

dl.drawImage = (img, dx, dy) => {
    _ctx.drawImage(img, dx, dy);
}

dl.drawImageEx = (img, sx, sy, sw, sh, dx, dy, dw, dh) => {
    _ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

dl.drawImageRec = (img, rect) => {
    _ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
}

dl.drawImagePro = (img, source, dest, origin, rotation, tint = 1.0) => {
    _ctx.save();

        _ctx.translate(dest.x, dest.y);
        _ctx.rotate(rotation * dl.DEG2RAD);
        _ctx.translate(-origin.x, -origin.y);
        _ctx.globalAlpha = tint;

        _ctx.drawImage(
            img,
            source.x, source.y, source.width, source.height,
            0, 0, dest.width, dest.height
        );
    
    _ctx.restore();
};

dl.toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

dl.checkCollisionRecs = (r1, r2) => {
    const r1x2 = r1.x + r1.width;
    const r1y2 = r1.y + r1.height;
    const r2x2 = r2.x + r2.width;
    const r2y2 = r2.y + r2.height;
    return r1.x < r2x2 && r1x2 > r2.x && r1.y < r2y2 && r1y2 > r2.y;
}

dl.getCollisionRecs = (r1, r2) => {
    const collision = { left: false, right: false, top: false, bottom: false };
    if (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x) {
        if (r1.y < r2.y + r2.height && r1.y + r1.height > r2.y) {
            if (r1.x < r2.x) collision.left = true;
            if (r1.x + r1.width > r2.x + r2.width) collision.right = true;
            if (r1.y < r2.y) collision.top = true;
            if (r1.y + r1.height > r2.y + r2.height) collision.bottom = true;
        }
    }
    return collision;
}

dl.getCollisionRecBounds = (rect, bounds) => {
    const collision = { left: false, right: false, top: false, bottom: false };

    if (rect.x < bounds.x) collision.left = true;
    if (rect.x + rect.width > bounds.x + bounds.width) collision.right = true;
    if (rect.y < bounds.y) collision.top = true;
    if (rect.y + rect.height > bounds.y + bounds.height) collision.bottom = true;

    return collision;
}

dl.getCollisionCircleBounds = (center, radius, bounds) => {
    const collision = { left: false, right: false, top: false, bottom: false };

    if (center.x - radius < bounds.x) collision.left = true;
    if (center.x + radius > bounds.x + bounds.width) collision.right = true;
    if (center.y - radius < bounds.y) collision.top = true;
    if (center.y + radius > bounds.y + bounds.height) collision.bottom = true;

    return collision;
}

dl.checkCollisionCircles = (center1, radius1, center2, radius2) => {
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distanceSq = dx * dx + dy * dy;
    const radiusSum = radius1 + radius2;

    return distanceSq <= (radiusSum * radiusSum);
};

dl.checkCollisionCircleLine = (center, radius, p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;

    if (Math.abs(dx) + Math.abs(dy) <= dl.FLT_EPSILON) {
        return dl.checkCollisionCircles(p1, 0, center, radius);
    }

    const lengthSQ = dx * dx + dy * dy;
    const dotProduct = (((center.x - p1.x) * (p2.x - p1.x)) + ((center.y - p1.y) * (p2.y - p1.y))) / lengthSQ;

    if (dotProduct > 1) dotProduct = 1;
    else if (dotProduct < 0) dotProduct = 0;

    const dx2 = (p1.x - dotProduct * dx) - center.x;
    const dy2 = (p1.y - dotProduct * dy) - center.y;
    const distanceSQ = dx2 * dx2 + dy2 * dy2;

    return distanceSQ <= radius * radius;
};

dl.checkCollisionCircleRec = (center, radius, rect) => {
    const dx = center.x - Math.max(rect.x, Math.min(center.x, rect.x + rect.width));
    const dy = center.y - Math.max(rect.y, Math.min(center.y, rect.y + rect.height));
    return dx*dx + dy*dy <= radius*radius;
}

dl.getCollisionCircleRec = (center, radius, rect) => {
    const collision = { left: false, right: false, top: false, bottom: false };

    const closestX = Math.max(rect.x, Math.min(center.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(center.y, rect.y + rect.height));

    const dx = center.x - closestX;
    const dy = center.y - closestY;

    if (dx * dx + dy * dy <= radius * radius) {
        if (center.x < rect.x) collision.left = true;
        if (center.x > rect.x + rect.width) collision.right = true;
        if (center.y < rect.y) collision.top = true;
        if (center.y > rect.y + rect.height) collision.bottom = true;
    }

    return collision;
}

dl.checkCollisionPointRec = (point, rect) => {
    return point.x > rect.x && point.y > rect.y && point.x < rect.x + rect.width && point.y < rect.y + rect.height;
}

dl.checkCollisionPointCircle = (point, center, radius) => {
    return Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2) < radius * radius;
}

dl.checkCollisionPointTriangle = (point, p1, p2, p3) => {
    const alpha = ((p2.y - p3.y)*(point.x - p3.x) + (p3.x - p2.x)*(point.y - p3.y)) / ((p2.y - p3.y)*(p1.x - p3.x) + (p3.x - p2.x)*(p1.y - p3.y));
    const beta = ((p3.y - p1.y)*(point.x - p3.x) + (p1.x - p3.x)*(point.y - p3.y)) / ((p2.y - p3.y)*(p1.x - p3.x) + (p3.x - p2.x)*(p1.y - p3.y));
    const gamma = 1 - alpha - beta;

    return alpha > 0 && beta > 0 && gamma > 0;
}

dl.checkCollisionLines = (startPos1, endPos1, startPos2, endPos2) => {
    const den = (endPos2.y - startPos2.y) * (endPos1.x - startPos1.x) - (endPos2.x - startPos2.x) * (endPos1.y - startPos1.y);
    if (den === 0) return false;

    const ua = ((endPos2.x - startPos2.x) * (startPos1.y - startPos2.y) - (endPos2.y - startPos2.y) * (startPos1.x - startPos2.x)) / den;
    const ub = ((endPos1.x - startPos1.x) * (startPos1.y - startPos2.y) - (endPos1.y - startPos1.y) * (startPos1.x - startPos2.x)) / den;

    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
};

dl.checkCollisionPointLine = (point, p1, p2, threshold) => {
    const dxc = point.x - p1.x;
    const dyc = point.y - p1.y;
    const dxl = p2.x - p1.x;
    const dyl = p2.y - p1.y;
    const cross = dxc * dyl - dyc * dxl;

    if (Math.abs(cross) < threshold * Math.max(Math.abs(dxl), Math.abs(dyl))) {
        if (Math.abs(dxl) >= Math.abs(dyl)) {
            return dxl > 0 ? (p1.x <= point.x && point.x <= p2.x) : (p2.x <= point.x && point.x <= p1.x);
        } else {
            return dyl > 0 ? (p1.y <= point.y && point.y <= p2.y) : (p2.y <= point.y && point.y <= p1.y);
        }
    }

    return false;
};

dl.checkCollisionCircleLine = (center, radius, p1, p2) => {
    const dxl = p2.x - p1.x;
    const dyl = p2.y - p1.y;
    const dxp = center.x - p1.x;
    const dyp = center.y - p1.y;

    const lineLenSq = dxl * dxl + dyl * dyl;
    const dot = (dxp * dxl + dyp * dyl) / lineLenSq;
    const closest = {
        x: p1.x + Math.max(0, Math.min(1, dot)) * dxl,
        y: p1.y + Math.max(0, Math.min(1, dot)) * dyl
    };

    const distX = center.x - closest.x;
    const distY = center.y - closest.y;

    return (distX * distX + distY * distY) <= (radius * radius);
};

const _startGameLoop = (callback) => {
    _lastTime = performance.now();
    let frameRef;

    const handleVisibilityChange = () => {
        if (!document.hidden) {
            _lastTime = performance.now();
        }
    };

    const loop = (currentTime) => {
        if (!currentTime) currentTime = performance.now();

        const deltaTimeMS = currentTime - _lastTime;
        _lastTime = currentTime;
        _frameTime = deltaTimeMS / 1000;

        if (_frameTime > 0.1) _frameTime = 1.0 / 60.0;

        try {
            _mouse.currentFrameX = _mouse.x;
            _mouse.currentFrameY = _mouse.y;
            
            _updateFPS(deltaTimeMS); 
            
            callback();

            _updatePrevMouseState();
            _updatePrevKeyboardState();
            _mouse.prevX = _mouse.currentFrameX;
            _mouse.prevY = _mouse.currentFrameY;
            
            frameRef = requestAnimationFrame(loop);
        } catch (e) {
            console.error("Game Loop Error:", e);
        }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    frameRef = requestAnimationFrame(loop);
};

dl.setTargetFPS = (fps) => {
    _targetFPS = fps;
    _targetFrameTime = fps > 0 ? (1000 / fps) : 0;
    setTimeout(()=>{console.log(dl.getFrameTime())}, 1000);
};

const _updatePrevMouseState = () => {
    _mouse.prev[dl.LEFT_MOUSE_BUTTON] = _mouse[dl.LEFT_MOUSE_BUTTON];
    _mouse.prev[dl.MIDDLE_MOUSE_BUTTON] = _mouse[dl.MIDDLE_MOUSE_BUTTON];
    _mouse.prev[dl.RIGHT_MOUSE_BUTTON] = _mouse[dl.RIGHT_MOUSE_BUTTON];
}

const _updatePrevKeyboardState = () => {
    for (const key in _keyboard) {
        _keyboard.prev[key] = _keyboard[key];
    }
}

dl.clearBackground = (color) => {
    _ctx.fillStyle = color;
    _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
}

dl.setLineThick = (thickness) => {
    _ctx.lineWidth = thickness;
}

const _parseColorString = (color) => {
    if (typeof color !== 'string') return null;
    if (color.startsWith("#")) {
        if (color.length === 7) {
            const bigint = parseInt(color.slice(1), 16);
            return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
        }
        return null;
    }
    if (color.startsWith("rgb(")) {
        const match = color.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) return { r, g, b };
        }
        return null;
    }
    return null;
}

dl.fade = (color, alpha) => {
    const clampedAlpha = dl.clamp(alpha, 0.0, 1.0);
    const rgb = _parseColorString(color);
    if (rgb) {
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`;
    } else {
        console.warn(`dl.fade: Could not parse color format: ${color}. Returning transparent black.`);
        return `rgba(0, 0, 0, 0)`;
    }
};

const _updateFPS = (dtMS) => {
    if (dtMS <= 0) return;
    const currentFPS = 1000 / dtMS;
    _fpsSamples.push(currentFPS);
    if (_fpsSamples.length > 60) _fpsSamples.shift();
    
    const sum = _fpsSamples.reduce((a, b) => a + b, 0);
    _avgFPS = Math.round(sum / _fpsSamples.length) || 0;
};



dl.drawFPS = (() => {
    let FPSTimer = 0;
    let lastFPS = 0;

    return (x, y, updateInterval = 500) => {
        FPSTimer += _frameTime * 1000;
        if (FPSTimer >= updateInterval) {
            lastFPS = dl.getFPS();
            FPSTimer = 0;
        }
        dl.drawText(`${lastFPS} FPS`, x, y, _fpsFontSize, dl.LIME);
    };
})();



dl.drawRectangle = (x, y, width, height, color) => {
    _ctx.fillStyle = color;
    _ctx.fillRect(x, y, width, height);
}

dl.drawRectangleRec = (rect, color) => {
    dl.drawRectangle(rect.x, rect.y, rect.width, rect.height, color);
}

dl.drawRectangleV = (pos, size, color) => {
    dl.drawRectangle(pos.x, pos.y, size.x, size.y, color);
}

dl.drawRectangleLines = (x, y, width, height, color) => {
    _ctx.strokeStyle = color;
    _ctx.strokeRect(x, y, width, height);
}

dl.drawRectangleLinesRec = (rect, color) => {
    dl.drawRectangleLines(rect.x, rect.y, rect.width, rect.height, color);
}

dl.drawRectangleLinesEx = (rect, thickness, color) => {
    const outerRect = dl.Rectangle(
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
    _ctx.save();
        _ctx.strokeStyle = color;
        _ctx.lineWidth = thickness;
        _ctx.stroke();
    _ctx.restore();
}



dl.drawRectangleRounded = (x, y, width, height, roundness, color) => {
    _ctx.beginPath();
    _ctx.fillStyle = color;
    _ctx.roundRect(x, y, width, height, roundness);
    _ctx.fill();
}

dl.drawRectangleRoundedRec = (rect, roundness, color) => {
    _ctx.beginPath();
    _ctx.fillStyle = color;
    _ctx.roundRect(rect.x, rect.y, rect.width, rect.height, roundness);
    _ctx.fill();
}

dl.drawRectangleRoundedLines = (rect, roundness, color) => {
    _ctx.beginPath();
    _ctx.strokeStyle = color;
    _ctx.roundRect(rect.x, rect.y, rect.width, rect.height, roundness);
    _ctx.stroke();
}

dl.drawRectangleRoundedLinesEx = (rect, roundness, thickness, color) => {
    _ctx.save();
        _ctx.lineWidth = thickness;
        dl.drawRectangleRoundedLines(rect, roundness, color);
    _ctx.restore();
}

dl.drawSquareGrid = (x, y, cols, rows, cellSize, color = dl.LIGHTGRAY, lineThick = 1) => {
    _ctx.save();
        _ctx.strokeStyle = color;
        _ctx.lineWidth = lineThick;

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

dl.drawLine = (x1, y1, x2, y2, color, lineThick) => {
    _ctx.strokeStyle = color;
    _ctx.beginPath();
    _ctx.moveTo(x1, y1);
    _ctx.lineTo(x2, y2);
    if (lineThick && _ctx.lineWidth !== lineThick) {
        _ctx.save();
        _ctx.lineWidth = lineThick;
    }
    _ctx.stroke();
    if (lineThick && _ctx.lineWidth !== lineThick) {
        _ctx.restore();
    }
    _ctx.closePath();
}

dl.drawLineStrip = (points, color) => {
    if (!Array.isArray(points) || points.length < 2) {
        console.warn("dl.drawLineStrip: Needs at least 2 points.");
        return;
    }
    _ctx.save();
        _ctx.strokeStyle = color;
        _ctx.beginPath();
        _ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; ++i) {
            _ctx.lineTo(points[i].x, points[i].y);
        }
        _ctx.stroke();
    _ctx.restore();
};

dl.drawLineBezier = (startPos, endPos, thick, color, curvatureFactor = 0.5) => {
    _ctx.save();
        _ctx.strokeStyle = color;
        _ctx.lineWidth = thick;
        _ctx.lineCap = "round";

        _ctx.beginPath();
        _ctx.moveTo(startPos.x, startPos.y);

        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;

        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;

        const length = Math.sqrt(dx * dx + dy * dy);
        let normalPerpDx = 0;
        let normalPerpDy = 0;
        if (length > dl.FLT_EPSILON) {
            normalPerpDx = -dy / length;
            normalPerpDy = dx / length;
        }

        const offsetAmount = length * curvatureFactor;
        const controlPointX = midX + normalPerpDx * offsetAmount;
        const controlPointY = midY + normalPerpDy * offsetAmount;

        _ctx.quadraticCurveTo(controlPointX, controlPointY, endPos.x, endPos.y);

        _ctx.stroke();
    _ctx.restore();
};

dl.drawCircle = (centerX, centerY, radius, color) => {
    _ctx.beginPath();
    _ctx.fillStyle = color;
    _ctx.arc(centerX, centerY, radius, 0, dl.TWO_PI);
    _ctx.fill();
}

dl.drawCircleLines = (centerX, centerY, radius, color) => {
    _ctx.beginPath();
    _ctx.strokeStyle = color;
    _ctx.arc(centerX, centerY, radius, 0, dl.TWO_PI);
    _ctx.stroke();
}

dl.drawCircleV = (center, radius, color) => {
    dl.drawCircle(center.x, center.y, radius, color);
}

dl.drawCircleLinesV = (center, radius, color) => {
    dl.drawCircleLines(center.x, center.y, radius, color);
}

dl.drawCircleLinesEx = (center, radius, thickness, color) => {
    _ctx.save();
        _ctx.lineWidth = thickness;
        dl.drawCircleLinesV(center.x, center.y, radius, color);
    _ctx.restore();
}

dl.drawRing = (x, y, innerRadius, outerRadius, color) => {
    if (outerRadius <= innerRadius) return;
    _ctx.beginPath();
    _ctx.fillStyle = color;
    _ctx.arc(x, y, outerRadius, 0, dl.TWO_PI);
    _ctx.arc(x, y, innerRadius, 0, dl.TWO_PI, true);
    _ctx.closePath();
    _ctx.fill();
};

dl.drawRingLines = (x, y, innerRadius, outerRadius, color) => {
    _ctx.strokeStyle = color;
    _ctx.beginPath();
    _ctx.arc(x, y, outerRadius, 0, dl.TWO_PI);
    _ctx.stroke();
    _ctx.beginPath();
    _ctx.arc(x, y, innerRadius, 0, dl.TWO_PI);
    _ctx.stroke();
};

dl.drawRingV = (center, innerRadius, outerRadius, color) => {
    if (outerRadius <= innerRadius) return;
    _ctx.beginPath();
    _ctx.fillStyle = color;
    _ctx.arc(center.x, center.y, outerRadius, 0, dl.TWO_PI);
    _ctx.arc(center.x, center.y, innerRadius, 0, dl.TWO_PI, true);
    _ctx.closePath();
    _ctx.fill();
};

dl.drawRingLinesV = (center, innerRadius, outerRadius, color) => {
    _ctx.strokeStyle = color;
    _ctx.beginPath();
    _ctx.arc(center.x, center.y, outerRadius, 0, dl.TWO_PI);
    _ctx.stroke();
    _ctx.beginPath();
    _ctx.arc(center.x, center.y, innerRadius, 0, dl.TWO_PI);
    _ctx.stroke();
};

dl.drawPoly = (center, sides, radius, rotation, color) => {
    if (sides < 3) return;
    dl.drawPolyLines(center, sides, radius, rotation);
    _ctx.fillStyle = color;
    _ctx.fill();
}

dl.drawPolyLines = (center, sides, radius, rotation, color) => {
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

dl.drawTriangle = (v1, v2, v3, color) => {
    _ctx.beginPath();
    _ctx.moveTo(v1.x, v1.y);
    _ctx.lineTo(v2.x, v2.y);
    _ctx.lineTo(v3.x, v3.y);
    _ctx.closePath();
    _ctx.fillStyle = color;
    _ctx.fill();
}

dl.drawTriangleLines = (v1, v2, v3, color) => {
    _ctx.beginPath();
    _ctx.moveTo(v1.x, v1.y);
    _ctx.lineTo(v2.x, v2.y);
    _ctx.lineTo(v3.x, v3.y);
    _ctx.closePath();
    _ctx.strokeStyle = color;
    _ctx.stroke();
}

dl.setFont = (newFont) => {
    if (_cachedFont != newFont) {
        _ctx.font = newFont;
        _ctx.fillText("skill issue", -6969, -6969);
    }
}

const _drawTextInternal = (text, x, y, fontSize) => {
    const lines = String(text).split('\n');
    const lineSpacing = fontSize * 1.2;
    for (let i = 0; i < lines.length; i++) {
        _ctx.fillText(lines[i], x, y + (i * lineSpacing));
    }
};

dl.drawText = (text, x, y, size, color) => {
    if (!String(text).length) return;
    _ctx.save();
        if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
        _ctx.textAlign = "left";
        _ctx.textBaseline = "top";
        const fontSize = size || parseInt(_ctx.font);
        const fontFamily = _ctx.font.split("px")[1];
        dl.setFont(`${fontSize}px ${fontFamily}`);
        _drawTextInternal(text, x, y, fontSize);
    _ctx.restore();
};

dl.drawTextCentered = (text, x, y, size, color) => {
    if (!String(text).length) return;
    _ctx.save();
        if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
        _ctx.textAlign = "center";
        _ctx.textBaseline = "alphabetic";

        const fontSize = size || parseInt(_ctx.font);
        const fontFamily = _ctx.font.split("px")[1];
        dl.setFont(`${fontSize}px ${fontFamily}`);
        
        const lines = String(text).split('\n');
        const lineSpacing = fontSize * 1.2;

        const metrics = _ctx.measureText(lines[0]);
        const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.7;
        
        const totalHeight = (lines.length - 1) * lineSpacing + ascent;
        let currentY = Math.round(y - (totalHeight / 2) + ascent);

        for (let i = 0; i < lines.length; i++) {
            _ctx.fillText(lines[i], x, currentY);
            currentY += lineSpacing;
        }
    _ctx.restore();
};

dl.drawTextEx = (text, x, y, size, color, align, baseline, { weight, style, font } = {}) => {
    if (!String(text).length) return;
    _ctx.save();
        if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
        if (align && _ctx.textAlign != align) _ctx.textAlign = align;
        if (baseline && _ctx.textBaseline != baseline) _ctx.textBaseline = baseline;
        const fontSize = size || parseInt(_ctx.font);
        if (size || weight || style || font) {
            const fontFamily = font || _ctx.font.split("px")[1];
            dl.setFont(`${style || ""} ${weight || ""} ${fontSize}px ${fontFamily}`.trim());
        }
        _drawTextInternal(text, x, y, fontSize);
    _ctx.restore();
};

const _buttonStyles = {
    default: {
        normal: ["#c9c9c9", "#838383", "#686868"],
        focused: ["#c9effe", "#5bb2d9", "#6c9bbc"],
        pressed: ["#97e8ff", "#0492c7", "#368baf"],
        disabled: ["#e6e9e9", "#b5c1c2", "#aeb7b8"],
    },
    dark: {
        normal: ["#2c2c2c", "#878787", "#c3c3c3"],
        focused: ["#848484", "#e1e1e1", "#181818"],
        pressed: ["#efefef", "#000000", "#202020"],
        disabled: ["#818181", "#6a6a6a", "#606060"],
    },
    amber: {
        normal: ["#292929", "#898988", "#d4d4d4"],
        focused: ["#292929", "#eb891d", "#ffffff"],
        pressed: ["#f39333", "#f1cf9d", "#282020"],
        disabled: ["#6a6a6a", "#818181", "#606060"],
    },
    genesis: {
        normal:  ["#181b1eff", "#667384ff", "#c2c8d0ff"],
        focused: ["#a7afb0ff", "#d3dbdfff", "#020202ff"],
        pressed: ["#ac3c3cff", "#181b1eff", "#dededeff"],
        disabled:["#2e353dff", "#3e4550ff", "#484f57ff"],
    },
    rltech: {
        normal:  ["#ffffff", "#000000", "#000000"],
        focused: ["#ffffff", "#ff0000", "#ff0000"],
        pressed: ["#1a1a1a", "#000000", "#ff0000"],
        disabled:["#e0e0e0", "#c0c0c0", "#b0b0b0"],
    },
    terminal: {
        normal:   ["#38f620", "#1c8d00", "#161313"],
        focused:  ["#dcfadc", "#c3fbc6", "#43bf2e"],
        pressed:  ["#1e6f15", "#1f5b19", "#43ff28"],
        disabled: ["#244125", "#223b22", "#182c18"],
    }
};

dl.BS_DEFAULT  = _buttonStyles.default;
dl.BS_DARK     = _buttonStyles.dark;
dl.BS_AMBER    = _buttonStyles.amber;
dl.BS_GENESIS  = _buttonStyles.genesis;
dl.BS_RLTECH   = _buttonStyles.rltech;
dl.BS_TERMINAL = _buttonStyles.terminal;

dl.Button = class {
    static State = {
        NORMAL: "normal",
        FOCUSED: "focused",
        PRESSED: "pressed",
        DISABLED: "disabled",
    };

    static IDCounter = 0;
    static generateID() {
        return this.IDCounter++;
    }

    constructor(bounds, text, options = {}) {
        this.bounds = bounds;
        this.id = options.id ?? this.constructor.generateID();
        this.text = text ?? " ";
        this.fontSize = options.fontSize || 20;
        this.style = options.style || dl.BS_DEFAULT;
        this.roundness = options.roundness || 0;
        this.isDisabled = options.disabled || false;
        this.borderThick = options.borderThick || Math.max(1, Math.floor((bounds.width + bounds.height) / 64));

        this.innerRect = dl.Rectangle(
            this.bounds.x + this.borderThick,
            this.bounds.y + this.borderThick,
            this.bounds.width - this.borderThick * 2,
            this.bounds.height - this.borderThick * 2,
        );

        this.pressedInside = false;
        this.textLines = [];
        this.textYOffsets = [];
        this.cachedLineHeights = [];
        this.cachedFont = null;
        this.state = "normal";

        this.setText();
    }

    setText(newText = this.text) {
        this.text = String(newText);

        this.textLines = this.text.split("\n");
        this.cachedFont = `bold ${this.fontSize || 20}px monospace, system, sans-serif`;

        _ctx.save();
            _ctx.font = this.cachedFont;
            const leadingFactor = 1.8;
            this.cachedLineHeights = this.textLines.map((line) => {
                const metrics = _ctx.measureText(line);
                const ascent = metrics.actualBoundingBoxAscent ?? this.fontSize * 0.8;
                const descent = metrics.actualBoundingBoxDescent ?? this.fontSize * 0.2;
                const baseLineHeight = ascent + descent;
                return baseLineHeight * leadingFactor;
            });
        _ctx.restore();

        const totalHeight = this.cachedLineHeights.reduce((a, b) => a + b, 0);
        const startY = this.bounds.y + (this.bounds.height - totalHeight) / 2;

        let currentY = startY;
        this.textYOffsets = this.cachedLineHeights.map((height) => {
            const y = currentY + (height / 2);
            currentY += height;
            return Math.floor(y);
        });
    }

    enable() {
        this.isDisabled = false;
    }

    disable() {
        this.isDisabled = true;
    }

    update() {
        const mousePos = dl.getMousePosition();
        const mouseOver = dl.checkCollisionPointRec(mousePos, this.bounds);
        const MBDown = dl.isMouseButtonDown(0);
        const MBPressed = dl.isMouseButtonPressed(0);
        const MBReleased = dl.isMouseButtonReleased(0);

        this._clickedThisFrame = false;

        if (!this.isDisabled) {
            if (MBPressed && mouseOver) {
                this.pressedInside = true;
                this.state = this.constructor.State.PRESSED;
            }
            if (MBReleased) {
                if (this.pressedInside && mouseOver) this._clickedThisFrame = true;
                this.pressedInside = false;
            }
            if (!MBDown) this.pressedInside = false;
        } else this.pressedInside = false;

        this.state = this.constructor.State.NORMAL;
        if (this.isDisabled) this.state = this.constructor.State.DISABLED;
        else if (this.pressedInside) this.state = this.constructor.State.PRESSED;
        else if (mouseOver) this.state = this.constructor.State.FOCUSED;
    }

    isPressed() {
        return this._clickedThisFrame;
    }

    setStyle(style) {
        this.style = style;
    }

    setInnerColor(color) { 
        this._innerColor = color || null;
    }

    setBorderColor(color) {
        this._borderColor = color || null;
    }
    
    setTextColor(color) {
        this._textColor = color || null;
    }

    resetColors() {
        this._innerColor = this.style[this.state][0];
        this._borderColor = this.style[this.state][1];
        this._textColor = this.style[this.state][2];
    }

    draw() {
        const innerColor = this._innerColor || this.style[this.state][0];
        const borderColor = this._borderColor || this.style[this.state][1];
        const textColor = this._textColor || this.style[this.state][2];

        if (this.roundness) {
            dl.drawRectangleRoundedRec(this.bounds, this.roundness, borderColor);
            dl.drawRectangleRoundedRec(this.innerRect, this.roundness, innerColor);
        } else {
            dl.drawRectangleRec(this.bounds, borderColor);
            dl.drawRectangleRec(this.innerRect, innerColor);
        }

        _ctx.save();
            _ctx.fillStyle = textColor;
            _ctx.textAlign = "center";
            _ctx.textBaseline = "middle";
            _ctx.font = this.cachedFont;

            for (let i = 0; i < this.textLines.length; ++i) {
                _ctx.fillText(this.textLines[i], this.bounds.x + this.bounds.width / 2, this.textYOffsets[i]);
            }
        _ctx.restore();
    }
};

dl.guiButton = (bounds, text, options = {}) => {
    const id = `x${Math.floor(bounds.x)}y${Math.floor(bounds.y)}`;
    if (!_guiButtons.has(id)) _guiButtons.set(id, []);
    const list = _guiButtons.get(id);

    let btn = list.find((b) => b.text === text);
    if (!btn) {
        btn = new dl.Button(bounds, text, options);
        list.push(btn);
    }

    btn.update();
    btn.draw();
    return btn.isPressed();
};

dl.clearGuiCache = () => {
    _guiButtons.clear();
};

dl.openURL = (url) => {
    try {
        window.open(url, "_blank");
    } catch (e) {
        console.error(`dl: Failed to open URL: ${url}`, e);
    }
};

dl.saveFileText = (fileName, text) => {
    try {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (e) {
        console.error(`dl: Failed to initiate file save for: ${fileName}`, e);
        return false;
    }
};

const _loadSound = async (path) => {
    if (_audioCache.has(path)) return _audioCache.get(path);

    try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await _audioCtx.decodeAudioData(arrayBuffer);
        
        _audioCache.set(path, audioBuffer);
        return audioBuffer;
    } catch (e) {
        console.error(`Failed to load sound: ${path}`, e);
        return null;
    }
};

dl.playSound = (path, volume = 1.0, pitch = 1.0) => {
    if (_audioCtx.state === 'suspended') _audioCtx.resume();

    if (!_masterGain) {
        _masterGain = _audioCtx.createGain();
        _masterGain.connect(_audioCtx.destination);
        _masterGain.gain.value = 0.7; 
    }

    const buffer = _audioCache.get(path);
    
    if (!buffer) {
        _loadSound(path).then((newBuffer) => {
            if (newBuffer) dl.playSound(path, volume, pitch);
        });
        return;
    }

    const source = _audioCtx.createBufferSource();
    const gainNode = _audioCtx.createGain();

    source.buffer = buffer;
    source.playbackRate.value = pitch;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(_masterGain);
    source.start(0);
};
