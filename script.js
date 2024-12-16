// Init
const canvasWidth = 800;
const canvasHeight = 450;
InitCanvas(canvasWidth, canvasHeight, "Basic example");

const ball = Circle(Vector2(canvasWidth * 0.5, canvasHeight * 0.5), 48);
const ballVel = Vector2(2, 1);

let angle = 0;
let timer = 0;
let bestTime = 0;

// Main game loop
function main() {
  ClearBackground(COAL);

  angle += GetRandomFloat(-0.1, 0.1);
  ball.center.x += Math.sin(angle) * ballVel.x;
  ball.center.y += Math.cos(angle) * ballVel.y;

  const edgeCollision = GetCollisionCircleBounds(ball, GetCanvasRect());
  if (edgeCollision.left || edgeCollision.right) ballVel.x = -ballVel.x;
  if (edgeCollision.top || edgeCollision.bottom) ballVel.y = -ballVel.y;

  if (CheckCollisionPointCircle(GetMousePosition(), ball)) {
    timer = Math.min(timer + GetFrameTime(), 99.99);
    const fontSize = Math.min(timer * 30, canvasWidth * 0.2);
    DrawTextCentered(`${timer.toFixed(2)}s`, canvasWidth * 0.5, canvasHeight * 0.5, fontSize, DARKGRAY);
    DrawCircleLinesV(ball.center, ball.radius, GREEN);
  } else {
    if (timer > bestTime) bestTime = timer;
    timer = 0;
    DrawCircleLinesV(ball.center, ball.radius, RED);
  }
  DrawText(`Best: ${bestTime.toFixed(2)}s`, 15, canvasHeight - 30, 20, DARKGREEN);
  DrawFPS(15, 15);
}
