const config = dl.initCanvas({
    width: 640,
    height: 480,
    title: "Example",
});

const ball = {
    center: dl.Vector2(config.width * 0.5, config.height * 0.5),
    radius: 48,
    vel: dl.Vector2(1.5, 1.5)
};

let angle = 0, timer = 0, bestTime = 0;

dl.main = () => {
    dl.clearBackground(dl.COAL);

    angle += dl.getRandomFloat(-0.1, 0.1);
    ball.center.x += Math.sin(angle) * ball.vel.x;
    ball.center.y += Math.cos(angle) * ball.vel.y;

    const edgeCollision = dl.getCollisionCircleBounds(ball.center, ball.radius, dl.getCanvasRect());
    if (edgeCollision.left || edgeCollision.right) ball.vel.x *= -1;
    if (edgeCollision.top || edgeCollision.bottom) ball.vel.y *= -1;

    if (dl.checkCollisionPointCircle(dl.getMousePosition(), ball.center, ball.radius)) {
        timer = Math.min(timer + dl.getFrameTime(), 99.99);
        const fontSize = Math.min(timer * 30, config.width * 0.2);
        dl.drawTextCentered(`${timer.toFixed(2)}s`, config.width * 0.5, config.height * 0.5, fontSize, dl.DARKGRAY);
        dl.drawCircleLinesV(ball.center, ball.radius, dl.GREEN);
    } else {
        if (timer > bestTime) bestTime = timer;
        timer = 0;
        dl.drawCircleLinesV(ball.center, ball.radius, dl.RED);
    }

    dl.drawText(`Best: ${bestTime.toFixed(2)}s`, 15, config.height - 30, 20, dl.GREEN);
}
