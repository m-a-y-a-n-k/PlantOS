import { useState } from "react";
import Sketch from "react-p5";

const PlantScenery = () => {
  const [isDay, setIsDay] = useState(true);
  const [trees, setTrees] = useState([{ x: 400, y: 500, len: 100 }]);
  let t = 0;
  let sunX = 0;
  let clouds = [];
  let birds = [];

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.angleMode(p5.DEGREES);

    // initial clouds
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: p5.random(p5.width),
        y: p5.random(50, 200),
        speed: p5.random(0.3, 0.6),
      });
    }

    // initial birds
    for (let i = 0; i < 3; i++) {
      birds.push({
        x: p5.random(p5.width),
        y: p5.random(100, 300),
        speed: p5.random(1, 2),
      });
    }

    sunX = 0;
  };

  const draw = (p5) => {
    drawSky(p5);
    drawSun(p5);
    drawMountains(p5);
    drawGround(p5);
    drawClouds(p5);
    drawBirds(p5);
    drawTrees(p5);
    drawWind(p5);

    sunX += 0.2;
    if (sunX > p5.width) sunX = 0;
  };

  const drawSky = (p5) => {
    for (let y = 0; y < p5.height; y++) {
      let inter = p5.map(y, 0, p5.height, 0, 1);
      let c1 = isDay ? p5.color(255, 204, 153) : p5.color(20, 24, 60);
      let c2 = isDay ? p5.color(153, 204, 255) : p5.color(10, 15, 35);
      p5.stroke(p5.lerpColor(c1, c2, inter));
      p5.line(0, y, p5.width, y);
    }
  };

  const drawSun = (p5) => {
    const sunY = p5.map(
      p5.sin(p5.map(sunX, 0, p5.width, 0, 180)),
      -1,
      1,
      p5.height - 100,
      100
    );
    const glow = p5.map(
      p5.dist(p5.mouseX, p5.mouseY, sunX, sunY),
      0,
      150,
      255,
      80
    );
    p5.noStroke();
    p5.fill(
      isDay ? p5.color(255, 204, 0, glow) : p5.color(230, 230, 255, glow)
    );
    p5.ellipse(sunX, sunY, 100, 100);
  };

  const drawMountains = (p5) => {
    p5.noStroke();
    p5.fill(isDay ? 80 : 30);
    p5.triangle(
      p5.width * 0.1,
      p5.height - 150,
      p5.width * 0.4,
      p5.height - 400,
      p5.width * 0.7,
      p5.height - 150
    );
    p5.fill(isDay ? 120 : 50);
    p5.triangle(
      p5.width * 0.5,
      p5.height - 150,
      p5.width * 0.8,
      p5.height - 350,
      p5.width * 1.05,
      p5.height - 150
    );
  };

  const drawGround = (p5) => {
    p5.noStroke();
    p5.fill(isDay ? p5.color(34, 139, 34) : p5.color(10, 70, 10));
    p5.rect(0, p5.height - 150, p5.width, 150);
  };

  const drawTrees = (p5) => {
    for (const tree of trees) {
      p5.push();
      p5.translate(tree.x, tree.y);
      drawBranch(p5, tree.len);
      p5.pop();
    }
  };

  const drawBranch = (p5, len) => {
    p5.strokeWeight(p5.map(len, 10, 100, 1, 5));
    p5.stroke(90, 50, 20);
    p5.line(0, 0, 0, -len);
    p5.translate(0, -len);
    if (len > 10) {
      p5.push();
      p5.rotate(20 + p5.noise(t) * 5);
      drawBranch(p5, len * 0.7);
      p5.pop();

      p5.push();
      p5.rotate(-20 - p5.noise(t) * 5);
      drawBranch(p5, len * 0.7);
      p5.pop();
    } else {
      p5.fill(0, p5.random(200, 255), 0, 180);
      p5.noStroke();
      p5.ellipse(0, 0, p5.random(8, 14), p5.random(8, 14));
    }
  };

  const drawWind = (p5) => {
    t += 0.005;
    const offset = p5.noise(t) * 10;
    p5.stroke(255, 255, 255, 30);
    p5.noFill();
    p5.beginShape();
    for (let x = 0; x < p5.width; x += 20) {
      const y = p5.height - 140 + p5.sin(x * 0.01 + t * 2) * offset;
      p5.vertex(x, y);
    }
    p5.endShape();
  };

  const drawClouds = (p5) => {
    p5.noStroke();
    p5.fill(255, 255, 255, 200);
    for (let c of clouds) {
      p5.ellipse(c.x, c.y, 60, 40);
      p5.ellipse(c.x + 30, c.y + 10, 50, 30);
      p5.ellipse(c.x - 30, c.y + 10, 50, 30);
      c.x += c.speed;
      if (c.x > p5.width + 50) c.x = -60;
    }
  };

  const drawBirds = (p5) => {
    p5.fill(0);
    p5.noStroke();
    for (let b of birds) {
      drawBirdShape(p5, b.x, b.y);
      b.x += b.speed;
      if (b.x > p5.width + 20) {
        b.x = -50;
        b.y = p5.random(100, 300);
      }
    }
  };

  const drawBirdShape = (p5, x, y) => {
    p5.push();
    p5.translate(x, y);
    p5.beginShape();
    p5.vertex(0, 0);
    p5.vertex(10, -5);
    p5.vertex(20, 0);
    p5.vertex(10, -2);
    p5.endShape(p5.CLOSE);
    p5.pop();
  };

  const mousePressed = (p5) => {
    if (p5.mouseY > p5.height - 150) {
      setTrees((prev) => [
        ...prev,
        {
          x: p5.mouseX,
          y: p5.mouseY,
          len: p5.random(80, 120),
        },
      ]);
    }
  };

  const keyPressed = (p5) => {
    if (p5.key === "t" || p5.key === "T") {
      setIsDay((prev) => !prev);
    }
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <Sketch
      setup={setup}
      draw={draw}
      mousePressed={mousePressed}
      keyPressed={keyPressed}
      windowResized={windowResized}
    />
  );
};

export default PlantScenery;
