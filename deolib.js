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
dl.BLANK = "transparent";
dl.MAGENTA = "#ff00ff";

dl.CUR_DEFAULT = "default";
dl.CUR_CROSSHAIR = "crosshair";
dl.CUR_POINTER = "pointer";
dl.CUR_HIDDEN = "none";

dl.MOUSE_LEFT_BUTTON = 0;
dl.MOUSE_MIDDLE_BUTTON = 1;
dl.MOUSE_RIGHT_BUTTON = 2;

const _mouse = {
    x: -1,
    y: -1,
    isInCanvas: false,
    [dl.MOUSE_LEFT_BUTTON]: false,
    [dl.MOUSE_MIDDLE_BUTTON]: false,
    [dl.MOUSE_RIGHT_BUTTON]: false,
    prev: {
        [dl.MOUSE_LEFT_BUTTON]: false,
        [dl.MOUSE_MIDDLE_BUTTON]: false,
        [dl.MOUSE_RIGHT_BUTTON]: false
    }
};

const _keyboard = {
    prev: {}
};

dl.Vector2 = (x = 0, y = 0) => ({ x, y });
dl.Vector2Zero = () => dl.Vector2();
dl.Vector2Add = (v1, v2) => dl.Vector2(v1.x + v2.x, v1.y + v2.y);
dl.Vector2Subtract = (v1, v2) => dl.Vector2(v1.x - v2.x, v1.y - v2.y);
dl.Vector2Multiply = (v1, v2) => dl.Vector2(v1.x * v2.x, v1.y * v2.y);
dl.Vector2Divide = (v1, v2) => {
    if (v2.x === 0 || v2.y === 0) return dl.Vector2(0, 0);
    return dl.Vector2(v1.x / v2.x, v1.y / v2.y);
};
dl.Vector2DivideScalar = (v, scalar) => {
    if (scalar === 0) return dl.Vector2(0, 0);
    return dl.Vector2(v.x / scalar, v.y / scalar);
};
dl.Vector2Scale = (v, scalar) => dl.Vector2(v.x * scalar, v.y * scalar);
dl.Vector2Magnitude = v => Math.sqrt((v.x * v.x) + (v.y * v.y));
dl.Vector2Length = dl.Vector2Magnitude;
dl.Vector2Normalize = v => {
    const mag = dl.Vector2Magnitude(v);
    return mag === 0 ? dl.Vector2() : dl.Vector2DivideScalar(v, mag);
};
dl.Vector2Dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y;
dl.Vector2Cross = (v1, v2) => v1.x * v2.y - v1.y * v2.x;
dl.Vector2Distance = (v1, v2) => Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
dl.Vector2DistanceSqr = (v1, v2) => (v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y);
dl.Vector2Equals = (v1, v2) => v1.x === v2.x && v1.y === v2.y;
dl.Vector2Copy = v => dl.Vector2(v.x, v.y);
dl.Vector2MoveTowards = (v, target, maxDistance) => {
    const dx = target.x - v.x;
    const dy = target.y - v.y;
    const sqrDist = dx * dx + dy * dy;
    if (sqrDist === 0 || (maxDistance >= 0 && sqrDist <= maxDistance * maxDistance)) {
        return dl.Vector2(target.x, target.y);
    }
    const dist = Math.sqrt(sqrDist);
    const factor = maxDistance / dist;
    return dl.Vector2(v.x + dx * factor, v.y + dy * factor);
};

dl.Rectangle = (x, y, width, height) => ({ x, y, width, height });
dl.Circle = (center, radius) => ({ center, radius });

dl.clamp = (value, min, max) => Math.max(min, Math.min(max, value));

dl.isMouseInCanvas = () => _mouse.isInCanvas;
dl.isMouseButtonDown = (buttonId = dl.MOUSE_LEFT_BUTTON) => buttonId in _mouse && _mouse[buttonId];
dl.isMouseButtonUp = (buttonId = dl.MOUSE_LEFT_BUTTON) => buttonId in _mouse && !_mouse[buttonId];
dl.isMouseButtonPressed = (buttonId = dl.MOUSE_LEFT_BUTTON) => buttonId in _mouse && !_mouse.prev[buttonId] && _mouse[buttonId];
dl.isMouseButtonReleased = (buttonId = dl.MOUSE_LEFT_BUTTON) => buttonId in _mouse && _mouse.prev[buttonId] && !_mouse[buttonId];
dl.isKeyDown = keyCode => keyCode in _keyboard && _keyboard[keyCode];
dl.isKeyUp = keyCode => keyCode in _keyboard && !_keyboard[keyCode];
dl.isKeyPressed = keyCode => keyCode in _keyboard && !_keyboard.prev[keyCode] && _keyboard[keyCode];
dl.isKeyReleased = keyCode => keyCode in _keyboard && _keyboard.prev[keyCode] && !_keyboard[keyCode];
dl.getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
dl.getRandomFloat = (min, max) => Math.random() * (max - min) + min;
dl.getRandomElem = arr => arr[dl.getRandomInt(0, arr.length - 1)];
dl.getRandomColor = () => `#${(c => c < 0x202020 ? dl.getRandomColor().slice(1) : c.toString(16).padStart(6, '0'))((Math.random() * 0xffffff) << 0)}`;
dl.getMousePosition = () => dl.Vector2(Math.round(_mouse.x), Math.round(_mouse.y));
dl.getMouseX = () => _mouse.x;
dl.getMouseY = () => _mouse.y;
dl.getCanvasWidth = () => _ctx.canvas.width;
dl.getCanvasHeight = () => _ctx.canvas.height;
dl.getCanvasRect = () => dl.Rectangle(0, 0, _ctx.canvas.width, _ctx.canvas.height);
dl.getFrameTime = () => _frameTime;
dl.getFPS = () => _fps;
dl.getTime = () => (performance.now() - _firstTime) / 1000;

dl.hideCursor = () => {
    _ctx.canvas.style.cursor = dl.CUR_HIDDEN;
}

dl.showCursor = () => {
    _ctx.canvas.style.cursor = dl.CUR_DEFAULT;
}

dl.initCanvas = ({ width, height, title,
    noContextMenu = false, autoScale = false, pageBgColor = "#282828", antiAliasing = true
}) => {
    const canvas = document.createElement("canvas");
    _ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    const ar = width / height;
    function onresize() {
        if (innerWidth / innerHeight > ar) {
            canvas.style.width = `${Math.round(innerHeight * ar)}px`;
            canvas.style.height = `${Math.round(innerHeight)}px`;
        } else {
            canvas.style.width = `${Math.round(innerWidth)}px`;
            canvas.style.height = `${Math.round(innerWidth / ar)}px`;
        }
    }
    canvas.oncontextmenu = e => { if (noContextMenu) e.preventDefault() };
    window.onresize = autoScale ? onresize : window.onresize;
    canvas.onpointerenter = () => (_mouse.isInCanvas = true);
    canvas.onpointerleave = () => ((_mouse.isInCanvas = false));
    canvas.onpointermove = e => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        _mouse.x = (e.clientX - rect.left) * scaleX;
        _mouse.y = (e.clientY - rect.top) * scaleY;
    };
    canvas.onpointerdown = e => {
        if (_mouse.isInCanvas) _mouse[e.button] = true;
    };
    canvas.onpointerup = e => {
        if (_mouse.isInCanvas) _mouse[e.button] = false;
    };
    window.onkeydown = e => {
        if (e.code.length) _keyboard[e.code] = true;
    };
    window.onkeyup = e => {
        if (e.code in _keyboard) _keyboard[e.code] = false;
    };

    Object.assign(canvas.style, {
        maxWidth: "100vw",
        maxHeight: "100vh",
        imageRendering: antiAliasing ? "smooth" : "pixelated",
    });

    Object.assign(document.body.style, {
        backgroundColor: pageBgColor,
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
        document.body.appendChild(canvas);
        document.title = title;
        _canvasRect = dl.Rectangle(0, 0, _ctx.canvas.width, _ctx.canvas.height);
        const w = _ctx.canvas.width;
        const h = _ctx.canvas.height;
        _fpsFontSize = Math.floor(Math.sqrt(w * w + h * h) / 50);
        _ctx.textRendering = "geometricPrecision";
        _ctx.imageSmoothingEnabled = antiAliasing;
        _ctx.lineWidth = 2;
        dl.setFont("20px monospace, system, sans-serif");
        if (autoScale) onresize();
        if (dl.main && typeof dl.main === "function") {
            _startGameLoop(dl.main);
        } else {
            console.warn("missing dl.main()");
        }
    };
}

dl.setCursor = (cursor) => {
    _ctx.canvas.style.cursor = cursor;
}

dl.loadImage = (filename) => {
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

dl.loadSpreadSheet = (filename, spriteWidth, spriteHeight) => {
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

dl.drawSprite = (
    spriteSheet,
    colIndex,
    rowIndex,
    destX,
    destY,
    destWidth = spriteSheet.spriteWidth,
    destHeight = spriteSheet.spriteHeight
) => {
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

dl.drawImage = (img, dx, dy) => {
    _ctx.drawImage(img, dx, dy);
}

dl.drawImageEx = (img, sx, sy, sw, sh, dx, dy, dw, dh) => {
    _ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

dl.drawImageRec = (img, rect) => {
    _ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
}

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

dl.getCollisionCircleBounds = (circle, bounds) => {
    const collision = { left: false, right: false, top: false, bottom: false };

    if (circle.center.x - circle.radius < bounds.x) collision.left = true;
    if (circle.center.x + circle.radius > bounds.x + bounds.width) collision.right = true;
    if (circle.center.y - circle.radius < bounds.y) collision.top = true;
    if (circle.center.y + circle.radius > bounds.y + bounds.height) collision.bottom = true;

    return collision;
}

dl.checkCollisionCircles = (center1, radius1, center2, radius2) => {
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distanceSQ = dx * dx + dy * dy;
    const radiusSum = radius1 + radius2;

    return distanceSQ <= (radiusSum * radiusSum);
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

dl.checkCollisionCircleRec = (circle, rect) => {
    const dx = circle.center.x - Math.max(rect.x, Math.min(circle.center.x, rect.x + rect.width));
    const dy = circle.center.y - Math.max(rect.y, Math.min(circle.center.y, rect.y + rect.height));
    return dx * dx + dy * dy <= circle.radius * circle.radius;
}

dl.getCollisionCircleRec = (circle, rect) => {
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

dl.checkCollisionPointRec = (point, rect) => {
    return point.x > rect.x && point.y > rect.y && point.x < rect.x + rect.width && point.y < rect.y + rect.height;
}

dl.checkCollisionPointCircle = (point, circle) => {
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
            try {
                _updateFPS();
                callback();
                _updatePrevMouseState();
                _updatePrevKeyboardState();
                frameRef = requestAnimationFrame(loop);
            } catch (e) {
                console.error(e);
            }
        }
    }
    document.onvisibilitychange = handleVisibilityChange;
    frameRef = requestAnimationFrame(loop);
}

function _updatePrevMouseState() {
    _mouse.prev[dl.MOUSE_LEFT_BUTTON] = _mouse[dl.MOUSE_LEFT_BUTTON];
    _mouse.prev[dl.MOUSE_MIDDLE_BUTTON] = _mouse[dl.MOUSE_MIDDLE_BUTTON];
    _mouse.prev[dl.MOUSE_RIGHT_BUTTON] = _mouse[dl.MOUSE_RIGHT_BUTTON];
}

function _updatePrevKeyboardState() {
    for (const key in _keyboard) {
        _keyboard.prev[key] = _keyboard[key];
    }
}

dl.clearBackground = (color) => {
    if (_ctx.canvas.style.backgroundColor != color) {
        _ctx.canvas.style.backgroundColor = color;
    }
    _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
}

dl.setLineThick = (thickness) => {
    _ctx.lineWidth = thickness;
}

function _parseColorString(color) {
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

dl.drawFPS = (() => {
    let FPSTimer = 0;
    let lastFPS = 0;

    return function (x, y, updateInterval = 250) {
        FPSTimer += _frameTime * 1000;
        if (FPSTimer >= updateInterval) {
            lastFPS = dl.getFPS();
            FPSTimer = 0;
        }
        dl.drawTextEx(`${lastFPS} FPS`, x, y, _fpsFontSize, dl.DARKGREEN, "left", "top", { weight: "bold" });
    };
})();

dl.drawRectangle = (x, y, width, height, color) => {
    _ctx.fillStyle = color;
    _ctx.fillRect(x, y, width, height);
}

dl.drawRectangleLines = (x, y, width, height, color) => {
    _ctx.strokeStyle = color;
    _ctx.strokeRect(x, y, width, height);
}

dl.drawRectangleRec = (rect, color) => {
    dl.drawRectangle(rect.x, rect.y, rect.width, rect.height, color);
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

dl.drawRectangleV = (pos, size, color) => {
    dl.drawRectangle(pos.x, pos.y, size.x, size.y, color);
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

dl.drawCircleLinesEx = (circle, thickness, color) => {
    _ctx.save();
    _ctx.lineWidth = thickness;
    dl.drawCircleLines(circle.center.x, circle.center.y, circle.radius, color);
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

dl.drawPoly = (center, sides, radius, rotation, color) => {
    if (sides < 3) return;
    dl.drawPolyLines(center, sides, radius, rotation);
    _ctx.fillStyle = color;
    _ctx.fill();
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

dl.drawText = (text, x, y, size = null, color = null) => {
    if (!String(text).length) return;
    _ctx.save();
    if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
    _ctx.textAlign = "left";
    _ctx.textBaseline = "top";
    const fontFamily = _ctx.font.split("px")[1];
    const newFont = `${size || parseInt(_ctx.font)}px ${fontFamily}`.trim();
    dl.setFont(newFont);
    _ctx.fillText(text, x, y);
}

dl.drawTextCentered = (text, x, y, size = null, color = null) => {
    if (!String(text).length) return;
    _ctx.save();
    if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
    _ctx.textAlign = "center";
    _ctx.textBaseline = "middle";
    const fontFamily = _ctx.font.split("px")[1];
    const newFont = `${size || parseInt(_ctx.font)}px ${fontFamily}`.trim();
    dl.setFont(newFont);
    _ctx.fillText(text, x, y);
}

dl.drawTextEx = (text, x, y, size, color, align, baseline, { weight, style, font } = {}) => {
    if (!String(text).length) return;
    _ctx.save();
    if (color && _ctx.fillStyle != color) _ctx.fillStyle = color;
    if (align && _ctx.textAlign != align) _ctx.textAlign = align;
    if (baseline && _ctx.textBaseline != baseline) _ctx.textBaseline = baseline;
    if (size || weight || style || font) {
        const fontFamily = font || _ctx.font.split("px")[1];
        const newFont = `${style || ""} ${weight || ""} ${size || parseInt(_ctx.font)}px ${fontFamily}`.trim();
        // const sanitizedNewFont = newFont.split(" ").filter(t => t).map(t => t.trim()).join(" ");
        dl.setFont(newFont);
    }
    _ctx.fillText(text, x, y);
    _ctx.restore();
}

dl.drawTextAlongArc = (str, centerX, centerY, radius, angle) => {
    const len = str.length;
    let s;
    _ctx.save();
    _ctx.translate(centerX, centerY);
    _ctx.rotate((-1 * angle) / 2);
    _ctx.rotate((-1 * (angle / len)) / 2);
    for (var n = 0; n < len; n++) {
        _ctx.rotate(angle / len);
        _ctx.save();
        _ctx.translate(0, -1 * radius);
        s = str[n];
        _ctx.fillText(s, 0, 0);
        _ctx.restore();
    }
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
    },
};

dl.BS_DEFAULT = _buttonStyles.default;
dl.BS_DARK = _buttonStyles.dark;
dl.BS_AMBER = _buttonStyles.amber;

dl.Button = class {
    static State = {
        NORMAL: "normal",
        FOCUSED: "focused",
        PRESSED: "pressed",
        DISABLED: "disabled"
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

        this.updateText();
    }

    updateText(newText = this.text) {
        this.text = String(newText);

        this.textLines = this.text.split("\n");
        this.cachedFont = `${this.fontSize || 20}px monospace, system, sans-serif`;

        _ctx.save();
        _ctx.font = this.cachedFont;

        const leadingFactor = 1.8;

        this.cachedLineHeights = this.textLines.map(line => {
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
        this.textYOffsets = this.cachedLineHeights.map(height => {
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

    setInnerColor(color) { 
        this._innerColor = color || null;
    }
    setBorderColor(color) {
        this._borderColor = color || null;
    }
    setTextColor(color) {
        this._textColor = color || null;
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

_guiButtons = new Map();

dl.guiButton = (id, bounds, text, options = {}) => {
    let btn = _guiButtons.get(id);
    if (!btn) {
        btn = new dl.Button(bounds, text, { ...options, id: id });
        _guiButtons.set(id, btn);
    }
    btn.update();
    btn.draw();
    const pressed = btn.isPressed();
    return pressed;
};
