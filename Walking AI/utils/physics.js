var Physics = {};

(function() {

  var PhysCommon = {};

  (function() {

    // Returns backup value if primary value is undefined or null
    PhysCommon.avoidNull = function(value, backup) {
      return value === undefined || value === null ? backup : value;
    };

    // Converts radians to degrees and vice versa
    PhysCommon.convertAngle = function(angle, isDegrees) {
      if (isDegrees) return (angle / 180) * Math.PI;
      return (angle / Math.PI) * 180;
    };

    // Extends primary object with secondary keys/values if property does not exist
    PhysCommon.extend = function(primary, secondary) {
      for (let key in secondary) {
        if (!primary.hasOwnProperty(key)) {
          primary[key] = secondary[key];
        }
      }
      return primary;
    };

    // Clone an object
    PhysCommon.clone = function(obj, isDeep) {
      if (isDeep) return JSON.parse( JSON.stringify( obj ) );
      let output = {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          output[key] = obj[key];
        }
      }
      return output;
    };

    // Random number between intervals
    PhysCommon.random = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    };

    // Checks if two lists have at least one element in common
    PhysCommon.sharesItem = function(arr1, arr2) {
      return arr1.some(r => arr2.includes(r));
    };

    // Retun sign of number
    PhysCommon.sign = function(i) {
      return Math.abs(i) / i;
    };

    // Clamp a value between a min and max
    PhysCommon.clamp = function(value, min, max) {
      if (value < min) return min;
      if (value > max) return max;
      return value;
    };

    // Removes undefined elements from a list
    PhysCommon.clean = function(list) {
      let l = [];
      for (let i = 0; i < list.length; i++) {
        if (list[i] !== undefined) l.push(list[i]);
      }
      return l;
    };

    // Gets random element from list
    PhysCommon.randList = function(list) {
      return list[Math.floor(Math.random() * list.length)];
    };

  })();

  var Bodies = {};

  (function(){

    // Default number of edges for a circle
    Bodies.circleEdgeNum = 20;

    // Default properties for a rigid body
    Bodies.defaults = function() {

      /**
      * @NOTE
      * Vertices and edges are stored as arrays in the clockwise direction
      * Two bodies with one identical filter on the same layer will not collide
      * Two bodies that do not share at least one layer will not collide
      */

      return ({
        position: {
          x: null,
          y: null
        },
        positionPrev: {
          x: 0,
          y: 0
        },
        velocity: {
          x: 0,
          y: 0
        },
        force: {
          x: 0,
          y: 0
        },
        mass: null,
        invMass: null,
        inertia: null,
        invInertia: null,
        density: 0.01,
        friction: 0.2,
        airFriction: 0,
        restitution: 0.3,
        vertices: [],
        edges: [],
        angle: 0,
        anglePrev: 0,
        angularVelocity: 0,
        torque: 0,
        size: {
          width: null,
          height: null,
          radius: null
        },
        isStatic: false,
        collisions: {
          resolveStatic: true,
          resolveDynamic: true
        },
        aabb: {
          y: {
            min: null,
            max: null
          },
          x: {
            min: null,
            max: null
          }
        },
        filters: [],
        layers: [0],
        gravity: {
          x: 0,
          y: 3
        },
        gravityScale: 1,
        render: {
          isVisible: true,
          strokeStyle: '#FFFFFF',
          fillStyle: null,
          lineWidth: 1,
          aabbColor: null,
          angleColor: 'tomato'
        },
        positionResolve: 0.1,
        slop: 1,
        allowMouse: true,
        id: Engine.nextID(),
        type: null,
        objectType: 'body'
      });

    };

    // Finds the vertices of a rectangular, circle or polygon body
    Bodies.findVertices = function(body, edgeNum) {

      let vertices = [];
      if (body.type == 'rectangle') {
        let a = body.angle,
            p = body.position,
            w = body.size.width / 2,
            h = body.size.height / 2;

        // Find unrotated vertices
        vertices.push({x: p.x - w, y: p.y - h});
        vertices.push({x: p.x + w, y: p.y - h});
        vertices.push({x: p.x + w, y: p.y + h});
        vertices.push({x: p.x - w, y: p.y + h});

      } else {
        let p = body.position,
            r = body.size.radius,
            twopi = Math.PI * 2;

        // A circle is a polygon with many edges
        if (body.type == 'circle') {
          edgeNum = Bodies.circleEdgeNum;
        }

        // Find unrotated vertices
        for (let a = 0; a < twopi; a += twopi / edgeNum) {
          vertices.push({
            x: body.position.x + (r * Math.cos(a)),
            y: body.position.y + (r * Math.sin(a))
          });
        }
      }

      return vertices;

    };

    // Create a rigid body object
    Bodies.createBody = function(type, options) {

      let body = PhysCommon.clone(options);
      body.type = type;
      return PhysCommon.extend(body, Bodies.defaults());

    };

    // Define new rectangular body
    Bodies.rectangle = function(x, y, width, height, options) {

      options = options || {};
      let body = Bodies.createBody('rectangle', options);

      body.position = {x: x, y: y};
      body.size = {
        width: width,
        height: height
      }

      let vertices = Bodies.findVertices(body);
      body = Bodies.fromVertices(vertices, body);
      return body;

    };

    // Define new circular body
    Bodies.circle = function(x, y, radius, options) {

      options = options || {};
      let body = Bodies.createBody('circle', options);

      body.position = {x: x, y: y};
      body.size = {
        radius: radius
      }

      let vertices = Bodies.findVertices(body, options.edgeNum);
      body = Bodies.fromVertices(vertices, body);
      return body;

    };

    // Define new polygon body
    Bodies.polygon = function(x, y, radius, edgeNum, options) {

      options = options || {};
      let body = Bodies.createBody('polygon', options);

      body.position = {x: x, y: y};
      body.size = {
        radius: radius
      }

      edgeNum = edgeNum || options.edgeNum;

      let vertices = Bodies.findVertices(body, edgeNum);
      body = Bodies.fromVertices(vertices, body);
      return body;

    };

    // Define new polygon body from vertices
    Bodies.fromVertices = function(vertices, options) {

      if (vertices.length < 3) return;
      let body;
      options = options || {};

      // Check whether body has already been made
      if (options.objectType) {
        body = options;
      } else {
        body = Bodies.createBody('from_vertices', options);
      }

      body.vertices = vertices;
      body = Bodies.getRequiredProperties(body);

      body.render = PhysCommon.extend(body.render, Bodies.defaults().render);

      return body;

    };

    // Computes the required properties of a body
    Bodies.getRequiredProperties = function(body) {

      // Position and COM
      if (body.type == 'from_vertices') body.position = Bodies.getPosition(body);
      body.positionPrev = body.position;

      // Mass
      body.mass = Bodies.getArea(body) * body.density;
      body.invMass = 1 / body.mass;

      // Inertia
      body.inertia = Bodies.getInertia(body);
      body.invInertia = 1 / body.inertia;

      // Orientate the body
      body.vertices = Bodies.rotateVertices(body.vertices, body.position, body.angle);
      body.anglePrev = body.angle;

      // Set AABB
      body.aabb = Bodies.getAABB(body.vertices);

      // Check state
      if (body.isStatic) {
        body.invMass = 0;
        body.invInertia = 0;
      }

      return body;

    };

    // Translates a body's position and vertices to a point
    Bodies.moveBodyTo = function(body, newPos) {

      newPos = newPos || {x: 0, y: 0};
      let direction = Vector.sub(newPos, body.position);
      body.position = newPos;
      for (let i of body.vertices) {
        i.x = i.x + direction.x;
        i.y = i.y + direction.y
      }
      return body;

    };

    // Translates abritrary vertices in a direction
    Bodies.translateVertices = function(vertices, direction) {

      for (let i = 0; i < vertices.length; i++) {
        vertices[i].x = vertices[i].x + direction.x;
        vertices[i].y = vertices[i].y + direction.y
      }
      return vertices;

    };

    // Calculates moment of inertia from vertices and mass
    Bodies.getInertia = function(body) {

      let pos = body.position;
      body = Bodies.moveBodyTo(body);
      var numerator = 0,
          denominator = 0,
          v = body.vertices,
          cross, j;

      for (var n = 0; n < v.length; n++) {
          j = (n + 1) % v.length;
          cross = Math.abs(Vector.cross(v[j], v[n]));
          numerator += cross * (Vector.dot(v[j], v[j]) + Vector.dot(v[j], v[n]) + Vector.dot(v[n], v[n]));
          denominator += cross;
      }

      body = Bodies.moveBodyTo(body, pos);
      return (body.mass / 6) * (numerator / denominator);

    };

    // Rotates body's vertices by its angle clockwise about the COM
    Bodies.rotateVertices = function(verts, position, angle) {

      angle = PhysCommon.avoidNull(angle, 0);
      let v = verts;
      for (let i = 0; i < v.length; i++) {
        v[i] = Vector.rotate(v[i], angle, position);
      }
      return v;

    };

    // Gets body's edges from its vertices
    Bodies.getEdges = function(verts, type) {

      let edges = [];
      for (let i = 0; i < verts.length; i += 1) {
        let j = (i + 1) % verts.length;
        edges.push(Vector.sub(verts[j], verts[i]));
      }
      return edges;

    }

    // Gets position/COM of body by finding centroid
    Bodies.getPosition = function(body) {

      let area = Bodies.getArea(body, true),
          centre = {x: 0, y: 0},
          v = body.vertices,
          cross, temp, j;

      for (let i = 0; i < v.length; i++) {
          j = (i + 1) % v.length;
          cross = Vector.cross(v[i], v[j]);
          temp = Vector.mult(Vector.add(v[i], v[j]), cross);
          centre = Vector.add(centre, temp);
      }

      return Vector.mult(centre, 1 / (6 * area));

    };

    // Calculates area of body
    Bodies.getArea = function(body, sign) {

      let pos = body.position;
      body = Bodies.moveBodyTo(body);
      let sum = 0;
      let v = body.vertices;
      for (let i = 0; i < v.length; i++) {
        let j = (i + 1) % v.length;
        sum += (v[i].x * v[j].y) - (v[j].x * v[i].y);
      }
      body = Bodies.moveBodyTo(body, pos);
      if (sign) return sum / 2;
      return (Math.abs(sum) / 2);

    };

    // Generates the AABB of a body
    Bodies.getAABB = function(verts) {

      let aabb = {
        x: {
          min: Infinity,
          max: -Infinity
        },
        y: {
          min: Infinity,
          max: -Infinity
        }};
      for (let i = 0; i < verts.length; i++) {
        if (verts[i].x < aabb.x.min) aabb.x.min = verts[i].x;
        if (verts[i].x > aabb.x.max) aabb.x.max = verts[i].x;
        if (verts[i].y < aabb.y.min) aabb.y.min = verts[i].y;
        if (verts[i].y > aabb.y.max) aabb.y.max = verts[i].y;
      }
      return aabb;

    };

    // Updates the body in the simulation
    Bodies.updateBody = function(body, dt, timeScale) {

      timeScale = timeScale || 1;

      if (!body.isStatic) {

        let dtSq = dt * dt;

        let velocityPrev = Vector.sub(body.position, body.positionPrev);
        let anglePrev = body.angle - body.anglePrev;
        let airFriction = (1 - body.airFriction) * timeScale;

        let force = Vector.mult(body.force, dtSq * body.invMass);

        body.velocity = Vector.add(Vector.mult(velocityPrev, airFriction), force);
        body.positionPrev = body.position;
        body.position = Vector.add(body.position, body.velocity);

        body.angularVelocity = (anglePrev * airFriction) + (body.torque * body.invInertia) * dtSq;
        body.anglePrev = body.angle;
        body.angle += body.angularVelocity;

        // Reset forces
        body.force = {x: 0, y: 0};
        body.torque = 0;

        // Update geometry
        body.vertices = Bodies.translateVertices(body.vertices, body.velocity);
        body.vertices = Bodies.rotateVertices(body.vertices, body.position, body.angularVelocity);
        body.aabb = Bodies.getAABB(body.vertices);

      }

    };

    // Update all bodies in the world
    Bodies.updateAll = function(world, dt) {

      let bodies = world.bodies;
      for (let i = 0; i < bodies.length; i++) {
        Bodies.updateBody(bodies[i], dt);
      }

    }

    // Set the position of a body
    Bodies.setPosition = function(body, pos, changeVel) {

      body.vertices = Bodies.translateVertices(body.vertices, Vector.sub(pos, body.position));
      body.position = pos;
      if (!changeVel) body.positionPrev = Vector.sub(pos, body.velocity);

    };

    // Set the angle of a body
    Bodies.setAngle = function(body, angle, changeVel) {

      body.vertices = Bodies.rotateVertices(body.vertices, body.position, angle - body.angle);
      body.angle = angle;
      if (!changeVel) body.anglePrev = angle - body.angularVelocity;

    };

    // Set the velocity of a body
    Bodies.setVelocity = function(body, vel) {

      body.positionPrev = Vector.sub(body.position, vel);
      body.velocity = vel;

    };

    // Set the angular velocity of a body
    Bodies.setAngularVelocity = function(body, av) {

      body.anglePrev = body.angle - av;
      body.angularVelocity = av;

    };

    // Set a body as static or dynamic
    Bodies.setStatic = function(body, isStatic) {

      body.isStatic = isStatic;
      if (isStatic) {
        body.invMass = 0;
        body.invInertia = 0;
      } else {
        body.invMass = 1 / body.mass;
        body.invInertia = 1 / body.invInertia;
      }

    };

    // Set the density of a body with constant area
    Bodies.setDensity = function(body, density) {

      // Find the change scale factor
      let delta = density / body.density;
      body.density = density;

      // Change mass
      body.mass = body.mass * delta;
      body.invMass = 1 / body.mass;

      // Change inertia
      let inertia = Bodies.getInertia(body);
      body.inertia = inertia;
      body.invInertia = 1 / body.inertia;

    };

    // Move body under influence of gravity
    Bodies.applyGravity = function(body) {

      if (!body.isStatic) {
        body.force = {
          x: body.mass * body.gravity.x * body.gravityScale,
          y: body.mass * body.gravity.y * body.gravityScale
        }
      }

    };

    // Apply gravity to all bodies in the world
    Bodies.applyGravityAll = function(world) {

      let bodies = world.bodies

      for (let i = 0; i < bodies.length; i++) {
        Bodies.applyGravity(bodies[i]);
      }

    };

    // Returns a body in the world from its ID
    Bodies.getBodyById = function(world, id) {

      for (let i = 0; i < world.bodies.length; i++) {
        if (world.bodies[i].id == id) {
          return world.bodies[i];
        }
      }

    };

    // Returns an identical body
    Bodies.cloneBody = function(body) {

      let newBody = PhysCommon.clone(body, true);
      newBody.id = Engine.nextID();
      return newBody;

    };

    // Get a poly object for a body
    Bodies.getGeometry = function(body) {
      return Common.clone(Geometry.fromVertices(body.vertices), true);
    };

  })();

   var Composites = {};

   (function() {

     // Create car composite
     Composites.car = function(x, y, options) {
       options = options || {};
       let scale = options.scale || 1;
       options.type = options.type || 1;
       let filter = Engine.nextID();
       if (options.type == 2) {
         let verts = [
           Vector.create(300+(90*scale), 300),
           Vector.create(300, 300),
           Vector.create(300, 300-(26*scale)),
           Vector.create(300+(10*scale), 300-(42*scale)),
           Vector.create(300+(45*scale), 300-(42*scale)),
           Vector.create(300+(90*scale), 300-(15*scale))
         ];
         let body = Bodies.fromVertices(verts, {filters: [filter]});
         Bodies.setPosition(body, Vector.create(x, y))
         let wheel1 = Bodies.circle(body.vertices[0].x-15*scale, body.vertices[0].y, 12*scale, {filters: [filter], friction: 1});
         let wheel2 = Bodies.circle(body.vertices[1].x+15*scale, body.vertices[0].y, 12*scale, {filters: [filter], friction: 1});
         let s1 = Joints.create({
           bodyA: body,
           bodyB: wheel1,
           pointA: wheel1.position,
           type: 'pivot',
           damping: 0
         });
         let s2 = Joints.create({
           bodyA: body,
           bodyB: wheel2,
           pointA: wheel2.position,
           type: 'pivot',
           damping: 0
         });
         s1.render.showPoints = s2.render.showPoints = false;
         return([body, wheel1, wheel2, s1, s2]);
       }
      if (options.type == 1) {
        let body = Bodies.rectangle(x, y, 60*scale, 15*scale, {filters:[filter]});
        let wheel1 = Bodies.circle(body.position.x+body.size.width/2, body.position.y, 12*scale, {filters: [filter], friction: 1});
        let wheel2 = Bodies.circle(body.position.x-body.size.width/2, body.position.y, 12*scale, {filters: [filter], friction: 1});
        let s1 = Joints.create({
          bodyA: body,
          bodyB: wheel1,
          pointA: wheel1.position,
          type: 'pivot',
          damping: 0
        });
        let s2 = Joints.create({
          bodyA: body,
          bodyB: wheel2,
          pointA: wheel2.position,
          type: 'pivot',
          damping: 0
        });
        s1.render.showPoints = s2.render.showPoints = false;
        return([body, wheel1, wheel2, s1, s2]);
      }
     };

     // Create chain composite of a specified body
     Composites.chain = function(options) {
       let defaults = {
         body: null, // body to be cloned
         segments: null, // how many clones
         from: null, // pos of first segment
         to: null, // pos of last segment
         jointsA: null, // array of pos where joints start
         jointsB: null, // array of pos where joints end,
         jointConfig: {} // joint settings
       }

       let chain = PhysCommon.clone(options)
       chain = PhysCommon.extend(chain, defaults);
       chain.segments = chain.segments > 1 ? chain.segments : 2;

       let xlen = chain.to.x - chain.from.x;
       let ylen = chain.to.y - chain.from.y;

       let jointLen = 0;
       if (chain.jointsA && chain.jointsB) jointLen = chain.jointsA.length;

       let joints = [];
       let bodies = [];
       let body = PhysCommon.clone(chain.body);

       let pos = body.position;

       let width = body.aabb.x.max - body.aabb.x.min;
       let height = body.aabb.y.max - body.aabb.y.min;

       let offsetsA = [], offsetsB = [];
       if (chain.jointsA && chain.jointsB) {
         for (let l = 0; l < jointLen; l ++) {
           offsetsA.push(Vector.sub(chain.jointsA[l], pos));
           offsetsB.push(Vector.sub(chain.jointsB[l], pos));
         }
       }

       for (let i = 0; i < chain.segments; i++) {

         let b = PhysCommon.clone(body, true);
         bodies.push(Bodies.cloneBody(b));

         let pos = {
           x: chain.from.x + (i * (xlen / (chain.segments - 1))),
           y: chain.from.y + (i * (ylen / (chain.segments - 1)))
         }

         Bodies.setPosition(bodies[i], pos);

       }

       for (let i = 0; i < chain.segments - 1; i++) {
         let j = i + 1;

         for (let k = 0; k < jointLen; k++) {

           let pointA, pointB;

           let bodyA = bodies[i];
           let bodyB = bodies[j];

           pointA = Vector.add(bodyA.position, offsetsA[k]);
           pointB = Vector.add(bodyB.position, offsetsB[k]);

           let structure = {
             bodyA: bodyA,
             bodyB: bodyB,
             pointA: pointA,
             pointB: pointB
           };

           let joint = {...structure, ...chain.jointConfig};

           joints.push(Joints.create(joint));

         }
       }

       return bodies.concat(joints);

     };

     // Cloth composite
     Composites.cloth = function(xpos, ypos, options) {
       let defaults = {
         width: null,
         height: null,
         isHanging: false,
         spacing: 20,
         jointConfig: {},
         bodyConfig: {}
       };

       options = options || {};

       let cloth = PhysCommon.clone(options);
       cloth = PhysCommon.extend(cloth, defaults);

       if (!cloth.bodyConfig.filters) cloth.bodyConfig.filters = [Engine.nextID()];

       let radius = 5;
       let clothBodies = [];
       let h = cloth.height;
       let w = cloth.width;
       let stiffness = 0.3;
       let damping = 0.3;

       for(let y = 0; y < h; y++) {
         for(let x = 0; x < w; x++) {
             clothBodies.push(Bodies.circle(xpos+(x*cloth.spacing), ypos+(y*cloth.spacing), radius, cloth.bodyConfig));
             clothBodies[clothBodies.length-1].render.isVisible = cloth.bodyConfig.render ? PhysCommon.avoidNull(cloth.bodyConfig.render.isVisible, false) : false;
             if (cloth.isHanging) {
               Bodies.setStatic(clothBodies[clothBodies.length-1], clothBodies.length < w + 1);
             }
         }
       }

       for(y = 0; y < h; y++) {
         for(x = 0; x < w; x++) {
           if(!(x%(w-1) == 0 && x!=0)) {
             let struct = {
               bodyA: clothBodies[(y*w)+x],
               bodyB: clothBodies[(y*w)+x+1],
               type: 'spring',
               stiffness: stiffness,
               damping: damping
             };
             let joint = {...struct, ...cloth.jointConfig};
             clothBodies.push(Joints.create(joint));
             clothBodies[clothBodies.length-1].render.showPoints = cloth.jointConfig.render ? PhysCommon.avoidNull(cloth.jointConfig.render.showPoints, false) : false;
           }
           if(!(y%(h-1) == 0 && y!=0)){
             let struct = {
               bodyA: clothBodies[(y*w)+x],
               bodyB: clothBodies[(y*w)+x+w],
               type: 'spring',
               stiffness: stiffness,
               damping: damping
             };
             let joint = {...struct, ...cloth.jointConfig};
             clothBodies.push(Joints.create(joint));
             clothBodies[clothBodies.length-1].render.showPoints = cloth.jointConfig.render ? PhysCommon.avoidNull(cloth.jointConfig.render.showPoints, false) : false;
           }
         }
       }

       return clothBodies;
     };

   })();

  var Pairs = {};

  (function() {

    // Create a pair between each body in the world
    Pairs.createWorldPairs = function(world) {

      let pairs = [];

      let wb = world.bodies;
      for (let a = 0; a < wb.length; a++) {
        for (let b = 1 + a; b < wb.length; b++) {
          let pair = {
            bodyA: wb[a],
            bodyB: wb[b]
          }

          pairs.push(pair);
        }
      }

      return pairs;

    };

    // Get a list of pairs that may collide
    Pairs.broadphase = function(pairs) {

      let bPairs = [];

      for (let i = 0; i < pairs.length; i++) {
        let bodyA = pairs[i].bodyA,
            bodyB = pairs[i].bodyB;

        // Ignore if AABBs do not overlap
        if (bodyA.aabb.x.max < bodyB.aabb.x.min || bodyA.aabb.x.min > bodyB.aabb.x.max) continue;
        if (bodyA.aabb.y.max < bodyB.aabb.y.min || bodyA.aabb.y.min > bodyB.aabb.y.max) continue;

        // Ignore if both bodies are static
        if (bodyA.isStatic && bodyB.isStatic) continue;

        // Ignore if bodies are not on at least one common layer
        if (!PhysCommon.sharesItem(bodyA.layers, bodyB.layers)) continue;

        // Ignore if bodies have common filters
        if (PhysCommon.sharesItem(bodyA.filters, bodyB.filters)) continue;

        // Add potential pair
        bPairs.push(pairs[i]);

      }

      return bPairs;

    };

  })();

  var Collisions = {};

  (function() {

    // Get info of pairs colliding
    Collisions.getCollisionData = function(pairs) {

      let collisionPairs = [],
          i;

      // Get info
      for (i = 0; i < pairs.length; i++) {
        pairs[i] = Collisions.sat(pairs[i]);
      }

      // Clean list of non-colliding pairs
      collisionPairs = PhysCommon.clean(pairs);

      return collisionPairs;

    };

    // Separating axis theorem
    Collisions.sat = function(pair) {

      let a = pair.bodyA, b = pair.bodyB,
      p1, p2,
      vertexBody,
      sepAxis, overlap, minOverlap = Infinity;

      // Generate edges
      a.edges = Bodies.getEdges(a.vertices, a.type);
      b.edges = Bodies.getEdges(b.vertices, b.type);

      // Resolve as two polygons
      for (let shapeIndex = 0; shapeIndex < 2; shapeIndex++) {

        // In the second iteration, swap the body objects
        if (shapeIndex == 1) {
          a = pair.bodyB;
          b = pair.bodyA;
        }

        // Create projected axis of each edge of shape
        for (let i = 0; i < a.edges.length; i++) {
          let edge = a.edges[i];
          let axisProj = Vector.unit(Vector.perp(edge));

          // Projects first shape onto axis
          p1 = Collisions.project(axisProj, a.vertices);
          // Projects second shape onto axis
          p2 = Collisions.project(axisProj, b.vertices);

          // Abort if shapes not overlapping
          if(!(p2.max >= p1.min && p1.max >= p2.min)) {
            pair = undefined;
            return;
          } else {
              overlap = Math.min(p1.max, p2.max) - Math.max(p1.min, p2.min);

              // Check for containment
              if ((p1.min > p2.min && p1.max < p2.max) || (p1.min < p2.min && p1.max > p2.max)) {
                let mins = Math.abs(p1.min - p2.min);
                let maxs = Math.abs(p1.max - p2.max);
                if (mins < maxs) {
                  overlap += mins;
                } else {
                  overlap += maxs;
                  axisProj = Vector.mult(axisProj, -1);
                }
              }

              if (overlap < minOverlap) {
                if (p1.max > p2.max) {
                  axisProj = Vector.mult(axisProj, -1);
                }
                vertexBody = b;
                minOverlap = overlap;
                sepAxis = axisProj;
              }
          }

        }

      }
      // The shapes are overlapping
      let cp = Collisions.project(sepAxis, vertexBody.vertices).collisionVertex;
      let contactPoint = {
        x: cp.x + sepAxis.x * minOverlap,
        y: cp.y + sepAxis.y * minOverlap
      }

      if (vertexBody == a) {
        sepAxis = Vector.mult(sepAxis, -1);
      }

      // Send data to pair
      pair.overlap = minOverlap;
      pair.sepAxis = sepAxis;
      pair.contactPoint = contactPoint;

      return pair;

    };

    // Find min and max vertices on a projected axis
    Collisions.project = function(axisProj, vertices) {

      let min = Infinity, max = -Infinity, closestVertex;
      for (let j = 0; j < vertices.length; j++) {
        let vertex = vertices[j];
        let point = Vector.dot(axisProj, vertex);
        if (point < min) {
          collisionVertex = vertex;
          min = point;
        }
        max = Math.max(max, point);
      }

      return {
        min: min,
        max: max,
        collisionVertex: collisionVertex
      }

    };

    // Get restitution of collision between two bodies
    Collisions.getRestitution = function(r1, r2) {

      return Math.min(r1, r2);

    };

    // Get friction of collision between two bodies
    Collisions.getFriction = function(f1, f2) {

      return (f1 + f2) / 2;

    };

    // Apply impulses from collision
    Collisions.solveVelocity = function(pair) {

      let n = pair.sepAxis;
      let cp = pair.contactPoint;
      let a = pair.bodyA, b = pair.bodyB;

      // Update velocities
      a.velocity = Vector.sub(a.position, a.positionPrev);
      b.velocity = Vector.sub(b.position, b.positionPrev);
      a.angularVelocity = a.angle - a.anglePrev;
      b.angularVelocity = b.angle - b.anglePrev;

      // Get vectors from positions to contact point. cv = contact vector
      let cv1 = Vector.sub(cp, a.position);
      let cv2 = Vector.sub(cp, b.position);

      // Get velocities at point of contact. pv = point velocity
      let pv1 = Vector.add(a.velocity,  Vector.cross(a.angularVelocity, cv1));
      let pv2 = Vector.add(b.velocity,  Vector.cross(b.angularVelocity, cv2));

      // Get relative velocity along the normal vector
      let rv = Vector.sub(pv2, pv1);
      let velAlongNormal = Vector.dot(n, rv);

      // Abort if bodies moving apart
      if (velAlongNormal < 0) return;

      // Get contact restitution
      let e = Collisions.getRestitution(a.restitution, b.restitution);

      // Calculate normal impulse
      let j = -(1 + e) * velAlongNormal;
      j /= a.invMass + b.invMass + Math.pow(Vector.cross(cv1, n), 2) * a.invInertia + Math.pow(Vector.cross(cv2, n), 2) * b.invInertia;
      let normalImpulse = Vector.mult(n, j);

      // Apply normal impulse
      Bodies.setVelocity(a, Vector.add(a.velocity, Vector.mult(normalImpulse, -a.invMass)));
      Bodies.setAngularVelocity(a, a.angularVelocity + Vector.cross(cv1, normalImpulse) * -a.invInertia);

      Bodies.setVelocity(b, Vector.add(b.velocity, Vector.mult(normalImpulse, b.invMass)));
      Bodies.setAngularVelocity(b, b.angularVelocity + Vector.cross(cv2, normalImpulse) * b.invInertia);

      // Recalculate relative velocity
      pv1 = Vector.add(a.velocity,  Vector.cross(a.angularVelocity, cv1));
      pv2 = Vector.add(b.velocity,  Vector.cross(b.angularVelocity, cv2));
      rv = Vector.sub(pv2, pv1);

      // Get tangent
      let t = Vector.unit(Vector.sub(rv, Vector.mult(n, Vector.dot(rv, n))));

      // Calculate tangental impulse
      let jt = -Vector.dot(rv, t);
      jt /= a.invMass + b.invMass + Math.pow(Vector.cross(cv1, t), 2) * a.invInertia + Math.pow(Vector.cross(cv2, t), 2) * b.invInertia;
      let mu = Collisions.getFriction(a.friction, b.friction);

      // Coulomb friction

      let tangentImpulse = Vector.mult(t, mu * j);
      if (Math.abs(mu * j) > Math.abs(jt)) {
        tangentImpulse = Vector.mult(t, jt);
      }

      // Apply tangental impulse
      Bodies.setVelocity(a, Vector.add(a.velocity, Vector.mult(tangentImpulse, -a.invMass)));
      Bodies.setAngularVelocity(a, a.angularVelocity + Vector.cross(cv1, tangentImpulse) * -a.invInertia);

      Bodies.setVelocity(b, Vector.add(b.velocity, Vector.mult(tangentImpulse, b.invMass)));
      Bodies.setAngularVelocity(b, b.angularVelocity + Vector.cross(cv2, tangentImpulse) * b.invInertia);

    };

    // Solve all velocity
    Collisions.solveVelocityAll = function(pairs) {

      for (let i = 0; i < pairs.length; i++) {
        Collisions.solveVelocity(pairs[i]);
      }

    };

    // Separate overlapping bodies
    Collisions.solvePosition = function(pair) {

      let overlap = pair.overlap,
          sepAxis = pair.sepAxis,
          a = pair.bodyA, b = pair.bodyB,
          os = (a.slop + b.slop) / 2,
          pd = (a.positionResolve + b.positionResolve) / 2;
      let positionResolution = Vector.mult(sepAxis, Math.max(overlap - os, 0) * pd / (a.invMass + b.invMass));
      let shareA = Vector.mult(positionResolution, a.invMass);
      let shareB = Vector.mult(positionResolution, -b.invMass);

      // Separate with position correction
      Bodies.setPosition(a, Vector.add(a.position, shareA));
      Bodies.setPosition(b, Vector.add(b.position, shareB));

    };

    // Solve all velocity
    Collisions.solvePositionAll = function(pairs) {

      for (let i = 0; i < pairs.length; i++) {
        Collisions.solvePosition(pairs[i]);
      }

    };

  })();

  var Joints = {};

  (function() {

    Joints.minLength = 0.000001;

    // Get defaults
    Joints.defaults = function() {

      return {
        type: 'spring',
        stiffness: 0.3,
        angularStiffness: 0,
        damping: 0,
        extension: 0,
        length: null,
        bodyA: null,
        bodyB: null,
        pointA: null,
        pointB: null,
        angleA: null,
        angleB: null,
        posA: null,
        posB: null,
        maxLen: null,
        render: {
          strokeStyle: '#FFFFFF',
          showDistance: true,
          lineWidth: 1,
          strokeAlpha: 1,
          showPoints: true
        },
        objectType: 'joint',
        id: Engine.nextID()
      }

    };

    // Create a new joint
    Joints.create = function(options) {

      let joint = PhysCommon.clone(options);
      joint = PhysCommon.extend(joint, Joints.defaults());
      joint.render = PhysCommon.extend(joint.render, Joints.defaults().render);
      joint.pointA = joint.pointA || (joint.bodyA ? joint.bodyA.position : null);
      joint.pointB = joint.pointB || (joint.bodyB ? joint.bodyB.position : null);
      joint.angleA = (joint.bodyA ? joint.bodyA.angle : null);
      joint.angleB = (joint.bodyB ? joint.bodyB.angle : null);
      joint.posA = (joint.bodyA ? joint.bodyA.position : null);
      joint.posB = (joint.bodyB ? joint.bodyB.position : null);
      joint.length = joint.length || Vector.magnitude(Vector.sub(joint.pointA, joint.pointB));
      if (joint.type == 'pivot') {
        joint.length = 0;
        joint.stiffness = PhysCommon.avoidNull(options.stiffness, 2);
      }
      return joint;

    };

    Joints.updatePoints = function(joint) {

      let bodyA = joint.bodyA,
          bodyB = joint.bodyB;

      // Update point A
      if (bodyA) {
        joint.pointA = Vector.add(joint.pointA, Vector.sub(bodyA.position, joint.posA));
        joint.pointA = Vector.rotate(joint.pointA, bodyA.angle - joint.angleA, bodyA.position);
        joint.angleA = bodyA.angle;
        joint.posA = bodyA.position;
      }

      // Update point B
      if (bodyB) {
        joint.pointB = Vector.add(joint.pointB, Vector.sub(bodyB.position, joint.posB));
        joint.pointB = Vector.rotate(joint.pointB, bodyB.angle - joint.angleB, bodyB.position);
        joint.angleB = bodyB.angle;
        joint.posB = bodyB.position;
      }

    }

    // Update joint
    Joints.updateJoint = function(joint, dt, timeScale, world) {

      let bodyA = joint.bodyA,
          bodyB = joint.bodyB;

      // Abort if neither body exists
      if (!bodyA && !bodyB) return;

      Joints.updatePoints(joint);

      let pointA = joint.pointA,
          pointB = joint.pointB;

      let delta = Vector.sub(pointA, pointB),
          currentLength = Vector.magnitude(delta);

      // Avoid singularity
      if (currentLength < Joints.minLength) currentLength = Joints.minLength;

      // Break if reached maxLen
      if (joint.maxLen > 0 && currentLength > joint.maxLen) {
        World.remove(world, joint);
        return;
      }

      // Solve
      let difference = (currentLength - joint.length) / currentLength;
      let stiffness = joint.stiffness < 1 ? joint.stiffness * timeScale : joint.stiffness,
          force = Vector.mult(delta, difference * stiffness),
          massTotal = (bodyA ? bodyA.invMass : 0) + (bodyB ? bodyB.invMass : 0),
          inertiaTotal = (bodyA ? bodyA.invInertia : 0) + (bodyB ? bodyB.invInertia : 0),
          resistanceTotal = massTotal + inertiaTotal,
          torque,
          share,
          normal,
          normalVelocity,
          relativeVelocity;

      if (joint.damping) {
        let zero = {x: 0, y: 0};
        normal = Vector.unit(delta);

        relativeVelocity = Vector.sub(
            bodyB && Vector.sub(bodyB.position, bodyB.positionPrev) || zero,
            bodyA && Vector.sub(bodyA.position, bodyA.positionPrev) || zero
        );

        normalVelocity = Vector.dot(normal, relativeVelocity);
      }

      if (bodyA && !bodyA.isStatic) {
        share = bodyA.invMass / massTotal;

        // apply forces
        Bodies.setPosition(bodyA, Vector.sub(bodyA.position, Vector.mult(force, share * dt)), true);

        // apply damping
        if (joint.damping) {
          let d = joint.damping * normalVelocity * share;
          bodyA.positionPrev = Vector.sub(bodyA.positionPrev, Vector.mult(normal, d));
        }

        // apply torque
        torque = (Vector.cross(Vector.sub(pointA, bodyA.position), force) / resistanceTotal) * bodyA.invInertia * (1 - joint.angularStiffness) * dt;
        Bodies.setAngle(bodyA, bodyA.angle - torque, true);
      }

      if (bodyB && !bodyB.isStatic) {
        share = bodyB.invMass / massTotal;

        // apply forces
        Bodies.setPosition(bodyB, Vector.add(bodyB.position, Vector.mult(force, share * dt)), true);

        // apply damping
        if (joint.damping) {
          let d = joint.damping * normalVelocity * share;
          bodyB.positionPrev = Vector.add(bodyB.positionPrev, Vector.mult(normal, d));
        }

        // apply torque
        torque = (Vector.cross(Vector.sub(pointB, bodyB.position), force) / resistanceTotal) * bodyB.invInertia * (1 - joint.angularStiffness) * dt;
        Bodies.setAngle(bodyB, bodyB.angle + torque, true);
      }

    };

    // Update all joints in the world
    Joints.updateAll = function(dt, timeScale, world) {

      for (let i = 0; i < world.joints.length; i++) {
        Joints.updateJoint(world.joints[i], dt, timeScale, world);
      }

    };

    // Returns a list of joints connected to a body
    Joints.getJoints = function(world, body, fullJoint) {
      let id = body.id;
      let joints = world.joints;
      let bodyJoints = [];
      for (let i = 0; i < joints.length; i++) {
        if (joints[i].bodyA) {
          if (joints[i].bodyA.id == id) {
            if (fullJoint) {
              bodyJoints.push(joints[i]);
            } else {
                bodyJoints.push({
                  id: joints[i].id,
                  point: 'A'
                });
            }
          }
        }
        if (joints[i].bodyB) {
          if (joints[i].bodyB.id == id) {
            if (fullJoint) {
              bodyJoints.push(joints[i]);
            } else {
                bodyJoints.push({
                  id: joints[i].id,
                  point: 'B'
                });
              }
          }
        }
      }
      return bodyJoints;
    };

    // Returns a joint from its ID
    Joints.getJointById = function(world, id) {
      for (let i = 0; i < world.joints.length; i++) {
        if (world.joints[i].id == id) {
          return world.joints[i];
        }
      }
    };

  })();

  var Engine = {};

  (function() {

    // Next unique ID
    Engine.idCount = 0;

    // Engine defaults
    Engine.defaults = function() {

      return {
        timestep: 2 / 60,
        timeScale: 1,
        timeClamp: 0.2,
        jointIterations: 2,
        canvas: null,
        world: null,
        events: {
          beforeUpdate: null,
          afterUpdate: null
        }
      }

    };

    // Create an engine
    Engine.create = function(options) {

      let engine = PhysCommon.clone(options);
      engine = PhysCommon.extend(engine, Engine.defaults());
      engine.world = engine.world || World.create();

      return engine;

    };

    // Provides a unique id
    Engine.nextID = function() {

      Engine.idCount += 1;
      return Engine.idCount;

    };

    // Update the simulation by one step
    Engine.update = function(engine, dt) {

      if (engine.events.beforeUpdate) engine.events.beforeUpdate();

      let world = engine.world,
          i;

      // Update inputs
      if (world.mouse) PhysMouse.update(world.mouse);

      // Apply gravity to all bodies
      Bodies.applyGravityAll(world);

      // Integrate all bodies
      Bodies.updateAll(world, dt, engine.timeScale);

      // Iteratively update all joints (first instance)
      for (i = 0; i < engine.jointIterations; i++) {
        Joints.updateAll(dt, engine.timeScale, world);
      }

      // Get list of all pairs in the world
      let worldPairs = Pairs.createWorldPairs(world);

      // Get pairs that pass broadphase test
      let broadphasePairs = Pairs.broadphase(worldPairs);

      // Get list of pairs that are actually colliding, as well as collision info
      let collisionPairs = Collisions.getCollisionData(broadphasePairs);

      // Resolve position of collision pairs
      Collisions.solvePositionAll(collisionPairs);

      // Iteratively update all joints (second instance)
      for (i = 0; i < engine.jointIterations; i++) {
        Joints.updateAll(dt, engine.timeScale, world);
      }

      // Resolve velocity of collision pairs
      Collisions.solveVelocityAll(collisionPairs);

      if (engine.events.afterUpdate) engine.events.afterUpdate();

    };

  })();

  var ___requestAnimationFrame___, ___cancelAnimationFrame___;

  var Runner = {};

  (function() {

    // Runner defaults
    Runner.defaults = function() {

      return {
        loop: null,
        fps: 0,
        isRunning: false,
        engine: null,
        events: {
          beforeFrame: null,
          afterFrame: null
        }
      }

    };

    ___requestAnimationFrame___ = window.requestAnimationFrame || window.webkitRequestAnimationFrame
                              || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;

    ___cancelAnimationFrame___ = window.cancelAnimationFrame || window.mozCancelAnimationFrame
                              || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;

    // Set up Runner
    Runner.create = function(options) {

      options = options || {};
      let runner = PhysCommon.clone(options);
      runner = PhysCommon.extend(runner, Runner.defaults());

      return runner;

    };

    // Runs the simulation
    Runner.run = function(runner) {
      let frameTime, currentTime, accumulator = 0;
      runner.isRunning = true;

      function updateLoop() {

        // Find real time progressed
        currentTime = Date.now();
        accumulator += currentTime - frameTime;
        runner.fps = Math.round(1000 / (currentTime - frameTime));
        frameTime = currentTime;

        // Before frame
        if (runner.events.beforeFrame) runner.events.beforeFrame();

        if (runner.engine) {
          let engine = runner.engine;
          // Avoid spiral of death
          if (accumulator > engine.timeClamp) {
            accumulator = engine.timeClamp;
          }

          // Iteratively update
          while (accumulator > engine.timestep) {
            Engine.update(engine, engine.timestep * engine.timeScale);
            accumulator -= engine.timestep;
          }
        }

        // After frame
        if (runner.events.afterFrame) runner.events.afterFrame();

        if (runner.isRunning) {
          runner.loop = ___requestAnimationFrame___(updateLoop);
        } else {
          ___cancelAnimationFrame___(runner.loop);
          return;
        }

      }

      frameTime = Date.now();
      runner.loop = ___requestAnimationFrame___(updateLoop);

    };

    // Pauses the simulation
    Runner.stop = function(runner) {

      ___cancelAnimationFrame___(runner.loop);
      runner.isRunning = false;

    };

  })();

  var World = {};

  (function() {

    // World defaults
    World.defaults = function() {

      return {
        bodies: [],
        joints: [],
        mouse: null
      }

    };

    // Create a world
    World.create = function(options) {

      options = options || {};

      let world = PhysCommon.clone(options);
      world = PhysCommon.extend(world, World.defaults());

      return world;

    };

    // Code for World.add()
    var _add = function(world, item) {
      if (item.objectType == 'body') {
        world.bodies.push(item);
      } else if (item.objectType == 'joint') {
        world.joints.push(item);
      }
    };

    // Code for World.remove()
    var _remove = function(world, item) {
      if (item.objectType == 'body') {
        for (let b = world.bodies.length - 1; b > -1; b--) {
          if (world.bodies[b].id == item.id) {
            // Remove joints attached to this body
            let j = Joints.getJoints(world, world.bodies[b]);
            for (let q = 0; q < j.length; q++) {
              let joint = Joints.getJointById(world, j[q].id);
              World.remove(world, joint);
            }
            world.bodies.splice(b, 1);
          }
        }
      } else if (item.objectType == 'joint') {
        for (let b = world.joints.length - 1; b > -1; b--) {
          if (world.joints[b].id == item.id) {
            world.joints.splice(b, 1);
          }
        }
      }
    };

    // Adds items to the world
    World.add = function(world, items) {
      if (items instanceof Array) {
        for (let i of items) {
          if (!i) continue;
          _add(world, i);
        }
      } else {
        if (!items) return;
        _add(world, items);
      }
    };


    // Removes items from the world
    World.remove = function(world, items) {
      if (items instanceof Array) {
        for (let i of items) {
          _remove(world, i);
        }
      } else {
        _remove(world, items);
      }
    };

    World.encloseCanvas = function(world, canvas) {
      elt = canvas.element || canvas;
      let thickness = 20;
      let options = {
        isStatic: true,
        allowMouse: false
      }
      let walls = [];
      walls.push(Bodies.rectangle(elt.width / 2, -thickness / 2, elt.width, thickness, options));
      walls.push(Bodies.rectangle(elt.width / 2, elt.height + thickness / 2, elt.width, thickness, options));
      walls.push(Bodies.rectangle(-thickness / 2, elt.height / 2, thickness, elt.height + thickness * 2, options));
      walls.push(Bodies.rectangle(elt.width+thickness / 2, elt.height / 2, thickness, elt.height + thickness * 2, options));
      // add to front
      world.bodies = walls.concat(world.bodies);
    };

    // Remove all times from world
    World.clearWorld = function(world) {
      while (world.bodies.length != 0) {
        World.remove(world, world.bodies);
      }
      while (world.joints.length != 0) {
        World.remove(world, world.joints);
      }
    };

  })();

  var PhysMouse = {};

  (function() {

    // Mouse defulats
    PhysMouse.defaults = function() {

      return {
        scope: null,
        canvas: null,
        isSetup: false,
        body: null,
        joint: null,
        world: null,
        jointConfig: {},
        position: {
          x: 0,
          y: 0
        },
        positionPrev: {
          x: 0,
          y: 0
        },
        velocity: {
          x: 0,
          y: 0
        },
        status: {
          isMoving: false,
          isDown: false,
          isDragged: false
        },
        events: {
          mousemove: null,
          mousedown: null,
          mouseup: null,
          mouseclick: null,
          mouserelease: null,
          mousedrag: null
        }
      }

    };

    // Creates mouse event listeners attached to element
    PhysMouse.create = function(options) {

      let mouse = PhysCommon.clone(options);
      mouse = PhysCommon.extend(mouse, PhysMouse.defaults());

      // Ensure an element for the canvas and scope is provided
      if (mouse.canvas.pen) {
        mouse.canvas = mouse.canvas.element;
      }
      if (mouse.scope.pen) {
        mouse.scope = mouse.scope.element;
      }

      // Notify the world that the mouse is created
      mouse.world.mouse = mouse;

      // Create mousemove event
      mouse.scope.addEventListener('mousemove', function(evt) {

        mouse.status.isMoving = true;

        if (mouse.canvas.getBoundingClientRect) {

          let rect = mouse.canvas.getBoundingClientRect(),
              scaleX = mouse.canvas.width / rect.width,
              scaleY = mouse.canvas.height / rect.height;

          mouse.position = {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
          };

          mouse.truePosition = Common.clone(mouse.position);

        } else {

          mouse.position = {
            x: evt.clientX,
            y: evt.clientY
          }

        }

        if (typeof mouse.events.mousemove === 'function') {
          mouse.events.mousemove();
        }

      });

      // Create mousedown event
      mouse.scope.addEventListener('mousedown', function(evt) {
        if (!mouse.status.isDown) {
          if (typeof mouse.events.mouseclick === 'function') {
            mouse.events.mouseclick();
          }
        }
        mouse.status.isDown = true;
      });

      // Create mouseup event
      mouse.scope.addEventListener('mouseup', function(evt) {
        if (mouse.status.isDown) {
          if (typeof mouse.events.mouserelease === 'function') {
            mouse.events.mouserelease();
          }
        }
        mouse.status.isDown = false;
      });

      return mouse;

    };

    // Transform the mouse position accoding to transforms of a renderer
    PhysMouse.applyRendererTransform = function(mouse, renderer) {
      let sfm = Vector.create(1 / renderer.scale.x, 1 / renderer.scale.y);
      mouse.transform = function(m) {
        m = Vector.sub(m, renderer.offset);
        m = Geometry.scalePoint(m, sfm, renderer.focus);
        return m;
      }
    };

    // Updates mouse properties
    PhysMouse.update = function(mouse) {
      if (mouse.transform) mouse.position = mouse.transform(Common.clone(mouse.truePosition));

      // Update status
      mouse.status.isDragged = false;
      if (mouse.status.isMoving && mouse.status.isDown) {
        mouse.status.isDragged = true;
        if (typeof mouse.events.mousedrag === 'function') {
          mouse.events.mousedrag();
        }
      }

      mouse.status.isMoving = true;
      if (mouse.position.x == mouse.positionPrev.x && mouse.position.y == mouse.positionPrev.y) {
        mouse.status.isMoving = false;
      }

      if (mouse.status.isDown) {
        if (typeof mouse.events.mousedown === 'function') {
          mouse.events.mousedown();
        }
      } else {
        if (typeof mouse.events.mouseup === 'function') {
          mouse.events.mouseup();
        }
      }

      // Update velocity
      mouse.velocity = {
        x: mouse.position.x - mouse.positionPrev.x,
        y: mouse.position.y - mouse.positionPrev.y
      }

      // Update position
      mouse.positionPrev = mouse.position;

      // Update mouse joints
      if (mouse.joint) {
        mouse.joint.pointB = mouse.position;
      }

      // Find contacts
      if (mouse.world) {
        let inContact = false;
        for (let i = 0; i < mouse.world.bodies.length; i++) {
          let body = mouse.world.bodies[i];
          if (PhysMouse.isTouching(mouse, body)) {
            inContact = true;
            mouse.body = body;
          }
        }
        if (!inContact) mouse.body = null;
      }

    };

    // Checks if mouse if touching body
    PhysMouse.isTouching = function(mouse, body) {

      let vertices = body.vertices;
      let point = mouse.position;
      for (var i = 0; i < vertices.length; i++) {
          let vertice = vertices[i],
              nextVertice = vertices[(i + 1) % vertices.length];
          if ((point.x - vertice.x) * (nextVertice.y - vertice.y) + (point.y - vertice.y) * (vertice.x - nextVertice.x) > 0) {
              return false;
          }
      }
      return true;

    };

    // Join to body the mouse is touching
    PhysMouse.createJoint = function(mouse, body) {

      if (body) {
        if (mouse.body.allowMouse) {
          let struct = {
            type: mouse.jointConfig.type,
            bodyA: mouse.body,
            pointA: mouse.position,
            pointB: mouse.position,
            angularStiffness: 1,
            stiffness: 1,
            damping: 0.1,
            type: 'pivot',
            render: {
              showPoints: false,
              showDistance: false
            }
          }
          let settings = {...struct, ...mouse.jointConfig};
          let joint = Joints.create(settings);
          joint.id = 'mouseJoint';
          mouse.joint = joint;
          World.add(mouse.world, joint);
        }
      }

    };

    // Deletes joint
    PhysMouse.deleteJoint = function(mouse) {

      if (mouse.joint) {
        World.remove(mouse.world, mouse.joint);
        mouse.joint = null;
      }

    };

  })();



  Physics.Common = PhysCommon;
  Physics.Bodies = Bodies;
  Physics.Composites = Composites;
  Physics.Pairs = Pairs;
  Physics.Collisions = Collisions;
  Physics.Joints = Joints;
  Physics.World = World;
  Physics.Engine = Engine;
  Physics.Runner = Runner;
  Physics.Mouse = PhysMouse;


})();
