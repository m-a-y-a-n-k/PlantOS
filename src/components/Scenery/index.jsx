import { useState } from "react";
import Sketch from "react-p5";
import { motion } from "framer-motion";

const PlantScenery = ({ customClass, children }) => {
  const [isDay, setIsDay] = useState(true);
  const [trees, setTrees] = useState([{ x: 400, y: 500, len: 100 }]);
  let t = 0;

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.noLoop();
  };

  const draw = (p5) => {
    drawSky(p5);
    drawSun(p5);
    drawMountains(p5);
    drawGround(p5);

    for (const tree of trees) {
      drawTree(p5, tree.x, tree.y, tree.len);
    }

    drawWind(p5);
  };

  const drawSky = (p5) => {
    for (let y = 0; y < p5.height; y++) {
      const inter = p5.map(y, 0, p5.height, 0, 1);
      const c1 = isDay ? p5.color(255, 200, 100) : p5.color(10, 10, 40);
      const c2 = isDay ? p5.color(100, 180, 255) : p5.color(20, 20, 80);
      p5.stroke(p5.lerpColor(c1, c2, inter));
      p5.line(0, y, p5.width, y);
    }
  };

  const drawSun = (p5) => {
    const d = p5.dist(p5.mouseX, p5.mouseY, p5.width - 100, 100);
    const glow = p5.map(d, 0, 150, 255, 80);
    const sunColor = isDay
      ? p5.color(255, 204, 0, glow)
      : p5.color(230, 230, 255, glow);
    p5.noStroke();
    p5.fill(sunColor);
    p5.ellipse(p5.width - 100, 100, 100, 100);
  };

  const drawMountains = (p5) => {
    p5.noStroke();
    p5.fill(isDay ? 80 : 30);
    p5.triangle(
      100,
      p5.height - 200,
      400,
      p5.height - 500,
      700,
      p5.height - 200
    );

    p5.fill(isDay ? 120 : 50);
    p5.triangle(
      500,
      p5.height - 200,
      800,
      p5.height - 400,
      p5.width + 100,
      p5.height - 200
    );
  };

  const drawGround = (p5) => {
    p5.noStroke();
    p5.fill(isDay ? p5.color(34, 139, 34) : p5.color(10, 70, 10));
    p5.rect(0, p5.height - 150, p5.width, 150);
  };

  const drawTree = (p5, x, y, len) => {
    p5.push();
    p5.translate(x, y);
    drawBranch(p5, len);
    p5.pop();
  };

  const drawBranch = (p5, len) => {
    p5.strokeWeight(p5.map(len, 10, 100, 1, 5));
    p5.stroke(90, 50, 20);
    p5.line(0, 0, 0, -len);
    p5.translate(0, -len);

    if (len > 10) {
      p5.push();
      p5.rotate(p5.PI / 8 + p5.noise(t) * 0.05);
      drawBranch(p5, len * 0.7);
      p5.pop();

      p5.push();
      p5.rotate(-p5.PI / 8 - p5.noise(t) * 0.05);
      drawBranch(p5, len * 0.7);
      p5.pop();
    } else {
      p5.noStroke();
      p5.fill(0, p5.random(200, 255), 0, 180);
      p5.ellipse(0, 0, p5.random(8, 14), p5.random(8, 14));
      p5.stroke(90, 50, 20);
      p5.noFill();
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

  const mousePressed = (p5) => {
    if (p5.mouseY > p5.height - 150) {
      setTrees((prev) => [
        ...prev,
        { x: p5.mouseX, y: p5.mouseY, len: p5.random(80, 120) },
      ]);
      p5.redraw();
    }
  };

  const keyPressed = (p5) => {
    if (p5.key === "t" || p5.key === "T") {
      setIsDay((prev) => !prev);
      p5.redraw();
    }
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    p5.redraw();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      style={{ position: "fixed", top: 0, left: 0, zIndex: -1 }}
    >
      <Sketch
        setup={setup}
        draw={draw}
        mousePressed={mousePressed}
        keyPressed={keyPressed}
        windowResized={windowResized}
      />
      {children}
    </motion.div>
  );
};

export default PlantScenery;
