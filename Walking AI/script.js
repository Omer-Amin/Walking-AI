// INFO

/**
* @inputs
* min distance from ground
* angle of each joint (a.angle - b.angle + 2pi (if negative), normalized between 0 and 2pi)
* angular velocity of each joint (a.av - b.av * 20)
* orientation (avg angle + 2pi (if neg) normalized between 0 and 2pi)
* whether each segment is touching the ground

* @outputs
* av of each segment invsig divide by 10 clamped between -0.05 and 0.05
*/

// 4 joints
// 5 segments





/* CONSTRAINING JOINTS
engine.beforeUpdate
  apply angVel to pivot
  set angVel to 0 if lims exceeded
  clamp angle of pivot between lims + holder angle

  engine.events.beforeUpdate = function() {

  Physics.Bodies.setAngularVelocity(engine.world.bodies[0], 0.005);

  constrainJoint(engine.world.bodies[0], holder, min, max);
  }

*/




// SETUP

let renderer = Renderer.create({
  canvas: {
    width: 1000,
    height: 900,
    fillStyle: 'lightgrey'
  }
});

let pen = renderer.canvas.pen;

let engine = Physics.Engine.create({
  canvas: renderer.canvas.element
});

engine.timestep = 2 / 60;

let runner = Physics.Runner.create();

// JOINTS

let density = 0.0001;

function createJoint(holder, movee, point, radius) {
  let hinge = Physics.Bodies.circle(point.x, point.y, radius, {layers: [Physics.Engine.nextID()], density: density});

  let j1 = Physics.Joints.create({
    bodyA: movee,
    bodyB: hinge,
    pointA: hinge.vertices[0],
    pointB: hinge.vertices[0],
    type: 'pivot'
  });

  let j2 = Physics.Joints.create({
    bodyA: movee,
    bodyB: hinge,
    pointA: hinge.vertices[10],
    pointB: hinge.vertices[10],
    type: 'pivot'
  });

  let j3 = Physics.Joints.create({
    bodyA: holder,
    bodyB: hinge,
    pointA: hinge.position,
    pointB: hinge.position,
    type: 'pivot'
  });

  return [hinge, j1, j2, j3];
}

function constrainJoint(pivot, holder, min, max) {
  min = Functions.convertAngle(min, true);
  max = Functions.convertAngle(max, true);
  if (pivot.angle < min || pivot.angle > max) {
    Physics.Bodies.setAngularVelocity(pivot, 0);
  }
  Physics.Bodies.setAngle(pivot, Common.clamp(pivot.angle, min + holder.angle, max + holder.angle));
}

// GROUND

let ground = Physics.Bodies.rectangle(500, 900, 100000, 50, {isStatic: true, friction: 0.8});
Physics.World.add(engine.world, ground);

let groundSkins = [];
let w = 50,
    h = 10;
for (let i = 0; i < 100; i++) {
  groundSkins.push(Geometry.rectangle(i * w * 4, ground.position.y - ground.size.height / 2 + h, w, h));
}

// LASER

let laserPos = {
  x: 200, //100 CHANGE
  y: (renderer.canvas.height / 2) - (ground.size.height / 2)
}
let laser = Physics.Bodies.rectangle(laserPos.x, laserPos.y, 10, renderer.canvas.height, {isStatic: true});
Physics.World.add(engine.world, laser);

// WALKERS

let walkers = [];
let popSize = 15;
let lifespan = 3000;
let startPos = {
  x: 400,
  y: 725
}
let minContactDist = 1;
let maxHeight = 100;
let maxRotation = 0.2*2;
let avScale = 1 / maxRotation;

function newWalker() {

  let layer = Physics.Engine.nextID();

  let extra = 0;

  let body = Physics.Bodies.rectangle(startPos.x, startPos.y + 10, (80 + extra * 2), 80, {layers: [layer], filters: [0, 1], density: density});

  let head = Physics.Bodies.rectangle(startPos.x, startPos.y - 40 - 7.5, 35, 35, {layers: [layer], filters: [0, 1], density: density*0.0000001});
  let neck1 = Physics.Joints.create({
    bodyA: head,
    bodyB: body,
    pointA: head.vertices[2],
    pointB: head.vertices[2]
  });
  let neck2 = Physics.Joints.create({
    bodyA: head,
    bodyB: body,
    pointA: head.vertices[3],
    pointB: head.vertices[3]
  });

  let leftThigh = Physics.Bodies.rectangle(startPos.x - (30 + extra), startPos.y + 65, 20, 70, {layers: [layer], filters: [0, 1], density: density});
  let rightThigh = Physics.Bodies.rectangle(startPos.x + (30 + extra), startPos.y + 65, 20, 70, {layers: [layer], filters: [1, 0], density: density});

  let leftHip = createJoint(body, leftThigh, Vector.create(startPos.x - (20 + (extra+10)), startPos.y + 40), 10);
  let rightHip = createJoint(body, rightThigh, Vector.create(startPos.x + (20 + (extra+10)), startPos.y + 40), 10);

  let leftShin = Physics.Bodies.rectangle(startPos.x - (30 + extra), startPos.y + 115, 20, 70, {layers: [layer], filters: [0, 1], density: density});
  let rightShin = Physics.Bodies.rectangle(startPos.x + (30 + extra), startPos.y + 115, 20, 70, {layers: [layer], filters: [1, 0], density: density});

  let leftKnee = createJoint(leftThigh, leftShin, Vector.create(startPos.x - (30 + extra), startPos.y + 90), 10);
  let rightKnee = createJoint(rightThigh, rightShin, Vector.create(startPos.x + (30 + extra), startPos.y + 90), 10);

  let bodyParts = [body, leftThigh, rightThigh, leftShin, rightShin];
  let joints = leftHip.concat(rightHip).concat(leftKnee).concat(rightKnee);
  let extras = [head, neck1, neck2];

  ground.layers.push(layer);

  return {
    parts: bodyParts,
    joints: joints,
    extras: extras,
    brain: NeuralNetwork.create(15, 13, 4),
    isDead: false,
    deathDist: 0
  }
}

function makeInputs(walker) {
  let input = [];

  //orientation
  let ang = 0;
  for (let i = 0; i < walker.parts.length; i++) {
    let addition = walker.parts[i].angle;
    if (addition < 0) addition += Math.PI * 2;
    ang += addition;
  }
  ang /= walker.parts.length;
  input.push([Functions.normalize(ang, 0, Math.PI * 2)]);

  for (let i = 0; i < walker.joints.length; i += 4) {
    //angles of joints
    let angle = walker.joints[i].angle;
    if (angle < 0) angle += Math.PI * 2;
    input.push([Functions.normalize(angle, 0, Math.PI * 2)]);

    // veloity of joints
    let av = walker.joints[i].angularVelocity;
    input.push([av * avScale]);
  }

  let min = Infinity;
  for (let i = 0; i < walker.parts.length; i++) {
    let dist = Math.abs(walker.parts[i].aabb.y.max - (ground.position.y - ground.size.height / 2));
    if (dist < min) {
      min = dist;
    }
    // whether touch ground
    if (dist <= minContactDist) {
      input.push([1]);
    } else {
      input.push([0]);
    }

  }
  // min height off ground
  input.push([Functions.normalize(min, 0, maxHeight)]);

  return input;
}

function applyOutput(walker, output) {
  let c = 0;
  for (let i = 0; i < walker.joints.length; i += 4) {
    let delta = Common.clamp(Functions.sigmoidInv(output[c][0]) / (100/(5*4)), -maxRotation, maxRotation);
    Physics.Bodies.setAngularVelocity(walker.joints[i], delta);
    c++;
  }
}

function getFitnesses() {
  let fitnesses = [];
  for (let i = 0; i < walkers.length; i++) {
    if (walkers[i].deathDist) {
      fitnesses.push((walkers[i].deathDist) ** 3);
    } else {
      fitnesses.push((getDeathDist(walkers[i])) ** 3);
    }
  }
  return fitnesses;
}

function allDead() {
  for (let i = 0; i < walkers.length; i++) {
    if (!walkers[i].isDead) return false;
  }
  return true;
}

function checkDeath(walker) {

  // if (walker.parts[0].angle < Functions.convertAngle(-160, true) || walker.parts[0].angle > Functions.convertAngle(160, true)) {
  //   walker.isDead = true;
  //   walker.deathDist = getDeathDist(walker);
  // }

  if (Physics.Collisions.sat({
    bodyA: walker.parts[0],
    bodyB: ground
  })) {
    walker.isDead = true;
    walker.deathDist = getDeathDist(walker);
  }

  if (Physics.Collisions.sat({
    bodyA: walker.extras[0],
    bodyB: ground
  })) {
    walker.isDead = true;
    walker.deathDist = getDeathDist(walker);
  }

  if (Physics.Collisions.sat({
    bodyA: walker.parts[0],
    bodyB: laser
  })) {
    walker.isDead = true;
    walker.deathDist = getDeathDist(walker);
    return;
  }

  if (Physics.Collisions.sat({
    bodyA: walker.parts[1],
    bodyB: laser
  })) {
    walker.isDead = true;
    walker.deathDist = getDeathDist(walker);
    return;
  }

  if (Physics.Collisions.sat({
    bodyA: walker.parts[2],
    bodyB: laser
  })) {
    walker.isDead = true;
    walker.deathDist = getDeathDist(walker);
    return;
  }

  if (Physics.Collisions.sat({
    bodyA: walker.parts[3],
    bodyB: laser
  })) {
    walker.isDead = true;
    walker.deathDist = getDeathDist(walker);
    return;
  }

  if (Physics.Collisions.sat({
    bodyA: walker.parts[4],
    bodyB: laser
  })) {
    walker.isDead = true;
    walker.deathDist = getDeathDist(walker);
    return;
  }
}

function getDeathDist(walker) {
  // let sum = 0;
  // for (let j = 0; j < walker.parts.length; j++) {
  //   sum += walker.parts[j].position.x
  // }
  // sum /= walker.parts.length;
  // sum -= startPos.x;

  let sum = walker.parts[0].position.x - startPos.x;
  return sum;
}

for(let i = 0; i < popSize; i++) {
  walkers.push(newWalker());
}
walkers.push(newWalker());
for (let i = 0; i < walkers.length; i++) {
  Physics.World.add(engine.world, walkers[i].parts);
  Physics.World.add(engine.world, walkers[i].joints);
  Physics.World.add(engine.world, walkers[i].extras);
}

function getBest() {
  let fitnesses = getFitnesses();
  let best = Functions.sortNonNumerical(walkers, fitnesses)[0];
  let index = 0;
  while (best.isDead) {
    index++;
    best = Functions.sortNonNumerical(walkers, fitnesses)[index];
  }
  return best;
}










// MAIN LOOP

let counter = 0;
let runWalkers = false;
let generation = 1;

engine.events.beforeUpdate = function() {

  if (runWalkers) {

    for (let i = 0; i < walkers.length; i++) {
      if (walkers[i].isDead) continue;

      checkDeath(walkers[i]);

      let output = NeuralNetwork.getOutput(walkers[i].brain, makeInputs(walkers[i]));
      applyOutput(walkers[i], output);

      //Physics.Bodies.setAngle(walkers[i].parts[0], 0);

      constrainJoint(walkers[i].joints[0], walkers[i].parts[0], -80, 120); // left hip
      constrainJoint(walkers[i].joints[4], walkers[i].parts[0], -120, 80); // right hip
      constrainJoint(walkers[i].joints[8], walkers[i].parts[1], -120, 120); // left knee
      constrainJoint(walkers[i].joints[12], walkers[i].parts[2], -120, 120); // right knee
    }

  }

}

runner.events.afterFrame = function() {

  if (runWalkers) {
    counter++;
    Physics.Bodies.setPosition(laser, Vector.create(laserPos.x + counter/1/*2 CHANGE*/, laserPos.y));
  }

  if (allDead() || counter >= lifespan) {
    generation++;
    counter = 0;

    for (let i = 0; i < walkers.length; i++) {
      for (let j = 0; j < walkers[i].parts.length; j++) {
        Physics.World.remove(engine.world, walkers[i].parts[j]);
      }
      for (let j = 0; j < walkers[i].joints.length; j++) {
        Physics.World.remove(engine.world, walkers[i].joints[j]);
      }
      for (let j = 0; j < walkers[i].extras.length; j++) {
        Physics.World.remove(engine.world, walkers[i].extras[j]);
      }
    }

    walkers.splice(walkers.length - 1, 1);
    let fitnesses = getFitnesses();
    let best = Functions.sortNonNumerical(walkers, fitnesses)[0];
    let parents = NeuralNetwork.getParents(walkers, fitnesses);
    walkers = [];
    for (let i = 1; i < popSize; i++) {
      walkers.push(newWalker());
      Physics.World.add(engine.world, walkers[walkers.length - 1].parts);
      Physics.World.add(engine.world, walkers[walkers.length - 1].joints);
      Physics.World.add(engine.world, walkers[walkers.length - 1].extras);
      walkers[walkers.length - 1].brain = NeuralNetwork.getChild(parents.parentA.brain, parents.parentB.brain);
      NeuralNetwork.mutate(walkers[walkers.length - 1].brain, 0.03);
    }
    walkers.push(newWalker());
    walkers[walkers.length - 1].brain = Common.clone(best.brain, true);
    Physics.World.add(engine.world, walkers[walkers.length - 1].parts);
    Physics.World.add(engine.world, walkers[walkers.length - 1].joints);
    Physics.World.add(engine.world, walkers[walkers.length - 1].extras);
  }

  Renderer.clearCanvas(renderer);

  renderWorld();
}

Physics.Runner.run(runner);

// RENDER

let renderAll = false;

function renderWalker(walker) {
  pen.fillStyle = 'white';
  pen.globalAlpha = 1;
  if (walker.isDead) {
    pen.fillStyle = 'red';
    pen.globalAlpha = 0.05;
  }
  for (let j = 0; j < walker.parts.length; j++) {
    Renderer.polygon(renderer, walker.parts[j].vertices, true, true);
  }
  // for (let j = 0; j < walker.joints.length; j+=4) {
  //   Renderer.polygon(renderer, walker.joints[j].vertices, true, true);
  // }
  for (let j = 0; j < walker.extras.length; j++) {
    if (walker.extras[j].objectType == 'body') {
      Renderer.polygon(renderer, walker.extras[j].vertices, true, true);
    }
  }
}

function renderWorld() {

  renderer.offset = {
    x: 200 - walkers[walkers.length - 1].parts[0].position.x,
    y: 0
  }

  if (renderAll) {
    let bestRender = getBest();
    renderer.offset = {
      x: 200 - laserPos.x - counter,//200 - bestRender.parts[0].position.x,CHANGE
      y: 0
    }
  }

  // render ground
  pen.fillStyle = 'black';
  pen.globalAlpha = 0.8;
  Renderer.polygon(renderer, ground.vertices, false, true);

  for (let k = 1; k < groundSkins.length; k++) {
    if (groundSkins[k].position.x + w/2 > 0 || groundSkins[k].position.x - w/2 < 1000) {
      pen.fillStyle = 'yellow';
      pen.globalAlpha = 1;
      Renderer.polygon(renderer, groundSkins[k].vertices, false, true);
    }
  }

  if (renderAll) {
    for (let i = 0; i < walkers.length - 1; i++) {
      renderWalker(walkers[i]);
    }
  }

  let b = walkers[walkers.length - 1];

  renderWalker(b);

  //render laser
  pen.fillStyle = 'red';
  pen.globalAlpha = 1;
  Renderer.polygon(renderer, laser.vertices, false, true);
}





Keys.events.keyclick = function() {
  if (Keys.key == 'r') {
    runWalkers = true;
    runner.engine = engine;
  }
  if (Keys.key == 'n') {
    counter = lifespan;
  }
  if (Keys.key == 'a') {
    renderAll = !renderAll;
  }
}
