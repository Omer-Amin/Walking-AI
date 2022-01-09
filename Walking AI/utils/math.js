var Vector = {};

(function() {

  // Creates 2D vector
  Vector.create = function(x, y) {
    return {x: x || 0, y: y || 0};
  };

  // Adds two vectors
  Vector.add = function(v1, v2) {
    return {x: v1.x + v2.x, y: v1.y + v2.y};
  };

  // Subtracts two vectors
  Vector.sub = function(v1, v2) {
    return {x: v1.x - v2.x, y: v1.y - v2.y};
  };

  // Dots two vectors
  Vector.dot = function(v1, v2) {
    return (v1.x * v2.x) + (v1.y * v2.y);
  };

  // Multiplies a vector and a scalar
  Vector.mult = function(v, s) {
    return {x: v.x * s, y: v.y * s};
  };

  // Angle between vector and positive x-axis
  Vector.angle = function(v) {
    return Math.atan2(v.y, v.x);
  };

  // Magnitude of vector
  Vector.magnitude = function(v) {
    return Math.sqrt((v.x * v.x) + (v.y * v.y));
  };

  // Magnitude of vector squared to save computation of square root
  Vector.magnitudeSquared = function(v) {
    return (v.x * v.x) + (v.y * v.y);
  };

  // Computes unit vector with magnitude 1
  Vector.unit = function(v) {
    let m = Vector.magnitude(v);
    return (m != 0 ? {x: v.x / m, y: v.y / m} : {x: 0, y: 0});
  };

  // Returns normal vector
  Vector.perp = function(v) {
    return {x: -v.y, y: v.x};
  };

  // Cross product of two vectors or a vector and scalar
  Vector.cross = function(v1, v2) {
    // v1 - vector, v2 = vector
    if (v1 instanceof Object && v2 instanceof Object) return (v1.x * v2.y) - (v1.y * v2.x);
    // v1 = vector, v2 = scalar
    if (v1 instanceof Object) return {x: v2 * v1.y, y: -v2 * v1.x};
    // v1 = scalar, v2 = vector
    if (v2 instanceof Object) return {x: -v1 * v2.y, y: v1 * v2.x};
  };

  // Rotates vector about origin or specified point clockwise
  Vector.rotate = function(point, angle, about) {
    let c = Math.cos(angle),
        s = Math.sin(angle),
        output = {};
    about = about || {x: 0, y:0};
    output.x = about.x + (point.x - about.x) * c - (point.y - about.y) * s;
    output.y = about.y + (point.x - about.x) * s + (point.y - about.y) * c;
    return output;
  };

  // Return vector with magnitude 0
  Vector.zero = function() {
    return {x: 0, y: 0};
  };

})();





var Matrix = {};

(function() {

  Matrix.defaultValue = 0;

 // Create new matrix
  Matrix.create = function(rows, cols, value) {
    value = value || Matrix.defaultValue;
    let row = Array.from({length: cols}, () => value),
        matrix = Array.from({length: rows}, () => [...row]);

    return matrix;
  };

  // Set the value of the matrix
  Matrix.setElem = function(matrix, row, col, value) {
    matrix[row - 1][col - 1] = value;
  };

  // Deep clone matrix
  Matrix.clone = function(matrix) {
    let newMat = [];

    for (let i = 0; i < matrix.length; i++) {
      let row = [...matrix[i]];
      newMat.push(row);
    }

    return newMat;
  };

  // Add two matrices
  Matrix.add = function(matrixA, matrixB) {
    let rows = matrixA.length,
        cols = matrixA[0].length,
        sum = [];

    // Check if matrices have equal dimensions
    if (!(rows == matrixB.length && cols == matrixB[0].length))
      return;

    for (let i = 0; i < rows; i++) {
      sum.push([]);
      for (let j = 0; j < cols; j++) {
        sum[i].push(matrixA[i][j] + matrixB[i][j]);
      }
    }

    return sum;
  };

  // Subtract two matrices
  Matrix.sub = function(matrixA, matrixB) {
    let rows = matrixA.length,
        cols = matrixA[0].length,
        sum = [];

    // Check if matrices have equal dimensions
    if (!(rows == matrixB.length && cols == matrixB[0].length))
      return;

    for (let i = 0; i < rows; i++) {
      sum.push([]);
      for (let j = 0; j < cols; j++) {
        sum[i].push(matrixA[i][j] - matrixB[i][j]);
      }
    }

    return sum;
  };

  // Multiply two matrices or a matrix and a scalr
  Matrix.mult = function(matrixA, matrixB) {
    // Check if second param is a scalar
    if (!matrixB[0]) {
      let temp = Matrix.clone(matrixA);
      Matrix.map(temp, (x) => matrixB * x);
      return temp;
    }

    let colsA = matrixA[0].length,
        colsB = matrixB[0].length,
        rowsA = matrixA.length,
        rowsB = matrixB.length;

    // Check if dimensions are suitable for multiplication
    if (colsA != rowsB) return;

    // Initialise product matrix
    let product = Matrix.create(rowsA, colsB);

    for (let h = 0; h < colsB; h++) {
      for (let i = 0; i < rowsA; i++) {
        let valueP = 0;
        for (let j = 0; j < colsA; j++) {
          let valueA = matrixA[i][j],
              valueB = matrixB[j][h];

          valueP += valueA * valueB
        }
        Matrix.setElem(product, i + 1, h + 1, valueP);
      }
    }

    return product;
  };

  // Multiply two matrices elementally
  Matrix.hadamardProduct = function(matrixA, matrixB) {
    let rows = matrixA.length,
        cols = matrixA[0].length,
        prod = [];

    // Check if matrices have equal dimensions
    if (!(rows == matrixB.length && cols == matrixB[0].length))
      return;

    for (let i = 0; i < rows; i++) {
      prod.push([]);
      for (let j = 0; j < cols; j++) {
        prod[i].push(matrixA[i][j] * matrixB[i][j]);
      }
    }

    return prod;
  };

  // Change each element in a matrix by some function
  Matrix.map = function(matrix, callback) {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[0].length; j++) {
        matrix[i][j] = callback(matrix[i][j]);
      }
    }
  };

  // Transpose a matrix
  Matrix.transpose = function(matrix) {
    // Initialise transposed matrix
    let transposed = Matrix.create(matrix[0].length, matrix.length);

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[0].length; j++) {
        transposed[j][i] = matrix[i][j];
      }
    }

    return transposed;
  };

  // Display matrix in readable format
  Matrix.display = function(matrix) {
    let display = "";
    for (let i = 0; i < matrix.length; i++) {
      display = display + matrix[i] + '\n';
    }
    console.log(display);
  };

})();




var Random = {};

(function() {

  // Get random number between intervals
  Random.random = function(min, max) {
    return Math.random() * (max - min) + min;
  };

  // Get random number with normal distributive probabilities (generally between -3 and 3)
  Random.normalRandom = function() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  };

})();




var Geometry = {};

(function() {

  // Create a polygon from a vertices
  Geometry.fromVertices = function(verts) {
    let poly = {
      vertices: verts,
      position: {
        x: 0,
        y: 0
      },
      angle: 0
    }
    poly.position = Geometry.getPosition(poly);

    return poly;
  };

  // Get rectangle
  Geometry.rectangle = function(x, y, w, h) {
    let vertices = [];

    vertices.push({x: x - w, y: y - h});
    vertices.push({x: x + w, y: y - h});
    vertices.push({x: x + w, y: y + h});
    vertices.push({x: x - w, y: y + h});

    let rect = Geometry.fromVertices(vertices);
    Geometry.setPosition(rect, Vector.create(x, y));
    return rect;
  };

  // Get circle (high vertex count poly)
  Geometry.circle = function(x, y, r, vertCount) {
    let vertices = [];
    let twopi = Math.PI * 2;

    vertCount = vertCount || 25;

    for (let a = 0; a < twopi; a += twopi / vertCount) {
      vertices.push({
        x: x + (r * Math.cos(a)),
        y: y + (r * Math.sin(a))
      });
    }

    let circ = Geometry.fromVertices(vertices);
    Geometry.setPosition(circ, Vector.create(x, y));
    return circ;
  };

  // Move polygon to new position
  Geometry.setPosition = function(poly, pos) {
    Geometry.translate(poly, Vector.sub(pos, poly.position));
    poly.position = pos;
  };

  // Get position of polygon
  Geometry.getPosition = function(poly) {
    let area = Geometry.getArea(poly, true),
        centre = {x: 0, y: 0},
        v = poly.vertices || poly,
        cross, temp, j;

    for (let i = 0; i < v.length; i++) {
        j = (i + 1) % v.length;
        cross = Vector.cross(v[i], v[j]);
        temp = Vector.mult(Vector.add(v[i], v[j]), cross);
        centre = Vector.add(centre, temp);
    }

    return Vector.mult(centre, 1 / (6 * area));
  };

  // Translate a polygon
  Geometry.translate = function(poly, vec) {
    for (let i = 0; i < poly.vertices.length; i++) {
      poly.vertices[i] = Vector.add(poly.vertices[i], vec);
    }
  };

  // Scale a polygon
  Geometry.scale = function(poly, scale, origin) {
    let pos = poly.position;
    Geometry.setPosition(poly, Vector.sub(poly.position, origin));
    for (let i = 0; i < poly.vertices.length; i++) {
      poly.vertices[i].x *= scale.x;
      poly.vertices[i].y *= scale.y;
    }
    Geometry.setPosition(poly, pos);
    poly.position = Geometry.scalePoint(poly.position, scale, origin);
  };

  // Scale a point
  Geometry.scalePoint = function(point, scale, origin) {
    let newPoint = {
      x: (point.x - origin.x) * scale.x,
      y: (point.y - origin.y) * scale.y
    }
    return Vector.add(newPoint, origin);
  };

  // Get area of polygon
  Geometry.getArea = function(poly, sign) {
    let pos = poly.position;
    Geometry.setPosition(poly, Vector.create(0, 0));
    let sum = 0;
    let v = poly.vertices;
    for (let i = 0; i < v.length; i++) {
      let j = (i + 1) % v.length;
      sum += (v[i].x * v[j].y) - (v[j].x * v[i].y);
    }
    Geometry.setPosition(poly, pos);
    if (sign) return sum / 2;
    return (Math.abs(sum) / 2);
  };

  // Set angle of polygon
  Geometry.setAngle = function(poly, angle) {
    for (let i = 0; i < poly.vertices.length; i++) {
      poly.vertices[i] = Vector.rotate(poly.vertices[i], angle - poly.angle, poly.position);
    }
  };

  // Check if two polygons are intersecting
  Geometry.isIntersecting = function(p1, p2) {

    for (let i = 0; i < p1.vertices.length; i++) {
      if (Geometry.isInside(p2.vertices, p1.vertices[i]))
        return true;
    }

    for (let i = 0; i < p2.vertices.length; i++) {
      if (Geometry.isInside(p1.vertices, p2.vertices[i]))
        return true;
    }

    return false;
  };

  // Check if a point is in a polygon
  Geometry.isInside = function(vertices, point) {
    for (var i = 0; i < vertices.length; i++) {
        let vertice = vertices[i],
            nextVertice = vertices[(i + 1) % vertices.length];
        if ((point.x - vertice.x) * (nextVertice.y - vertice.y) + (point.y - vertice.y) * (vertice.x - nextVertice.x) > 0) {
            return false;
        }
    }
    return true;
  };

})();





var Functions = {};

(function() {

  // Sigmoid function
  Functions.sigmoid = function(x) {
    return 1 / (1 + Math.exp(-x));
  };

  // Inverse sigmoid
  Functions.sigmoidInv = function(x) {
    return Math.log(x / (1 - x));
  };

  // Round to nearest given integer
  Functions.round = function(value, rounder) {
    return Math.round(value / rounder) * rounder;
  };

  // Angle to degrees and vice versa
  Functions.convertAngle = function(angle, isDegrees) {
    if (isDegrees) return (angle / 180) * Math.PI;
    return (angle / Math.PI) * 180;
  };

  // Retun sign of number
  Functions.sign = function(i) {
    return Math.abs(i) / i;
  };

  // Get number of digits in integer
  Functions.digits = function(x) {
    return Math.round(x).toString().length;
  };

  // Normalize a value between two intervals
  Functions.normalize = function(value, min, max) {
    return (value - min) / (max - min);
  };

  // Convert normalized value to true value
  Functions.normalizeInv = function(valueNorm, min, max) {
    return valueNorm * (max - min) + min;
  };

  // Sum values in a list
  Functions.arraySum = function(array) {
    return array.reduce((a, b) => a + b);
  };

  // Order a non-numerical array based on a numerical array (high to low)
  Functions.sortNonNumerical = function(nonNumerical, numerical) {
    // bubblesort
    if (nonNumerical.length <= 1) {
      return nonNumerical;
    }

    let swapp;
    let n = numerical.length-1;
    let x = numerical;
    let y = nonNumerical;
    do {
        swapp = false;
        for (let i = 0; i < n; i++)
        {
            if (x[i] < x[i+1])
            {
               let temp = x[i];
               x[i] = x[i+1];
               x[i+1] = temp;
               let tempNN = y[i];
               y[i] = y[i+1];
               y[i+1] = tempNN;
               swapp = true;
            }
        }
        n--;
    } while (swapp);
    return y;
  };

})();
