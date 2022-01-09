var Renderer = {};

(function() {

  Renderer.themes = [
    ['8ecae6', '219ebc', '023047', 'ffb703', 'fb8500']
  ];

  // Renderer defaults
  Renderer.defaults = function() {
    return {
      element: document.body,
      canvas: {
        element: null,
        pen: null,
        width: 500,
        height: 500,
        fillStyle: '#14151f'
      },
      offset: {
        x: 0,
        y: 0
      },
      scale: {
        x: 1,
        y: 1
      },
      focus: {
        x: 0,
        y: 0
      }
    }
  }

  // Create the renderer
  Renderer.create = function(options) {
    options = options || {};

    let renderer = Common.clone(options);

    // Setup canvas
    if (renderer.canvas) {
      renderer.canvas = Common.extend(renderer.canvas, Renderer.defaults().canvas);
    }

    // Create renderer object
    renderer = Common.extend(renderer, Renderer.defaults());

    // Create new canvas if not provided
    let elt = renderer.canvas.element;
    if (!(elt && elt.tagName == 'canvas')) {
      elt = document.createElement('canvas');
      renderer.element.appendChild(elt);
    }

    // Get the canvas render context
    renderer.canvas.pen = elt.getContext('2d');

    // Set canvas properties
    elt.width = renderer.canvas.width;
    elt.height = renderer.canvas.height;
    elt.style.backgroundColor = renderer.canvas.fillStyle;

    // Update changes
    renderer.canvas.element = elt;

    return renderer;
  };

  // Random color
  Renderer.randomColor = function(theme) {
    if (theme == undefined) return Math.floor(Math.random()*16777215).toString(16);
    return Common.randList(Renderer.themes[theme]);
  };

  // Clears canvas
  Renderer.clearCanvas = function(renderer) {
    let c = renderer.canvas;
    c.pen.clearRect(0, 0, c.width, c.height);
  };

  // Focus on a specific point by always keeping it at a specified centre
  Renderer.focusOn = function(renderer, subject, center) {
    renderer.offset = Vector.sub(center, subject);
    renderer.focus = subject;
  };

  Renderer._transformVertex = function(renderer, vertex) {
    let v = Common.clone(vertex);
    v = Geometry.scalePoint(v, renderer.scale, renderer.focus);
    v = Vector.add(v, renderer.offset);
    return v;
  }

  // Render polygon from Vertices
  Renderer.polygon = function(renderer, vertices, stroke, fill) {
    let pen = renderer.canvas.pen;

    let verts = [];
    for (let i = 0; i < vertices.length; i++) {
      verts.push(Renderer._transformVertex(renderer, vertices[i]));
    }

    pen.beginPath();
    pen.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) {
      pen.lineTo(verts[i].x, verts[i].y);
    }
    pen.lineTo(verts[0].x, verts[0].y);
    if (stroke) pen.stroke();
    if (fill) pen.fill();
  };

  // Render circle
  Renderer.circle = function(renderer, x, y, r, stroke, fill) {
    let pen = renderer.canvas.pen;

    let transform = Renderer._transformVertex(renderer, Vector.create(x, y));
    let x1 = transform.x;
    let y1 = transform.y;

    pen.beginPath();
    pen.arc(x1, y1, r, 0, 2 * Math.PI);
    if (stroke) pen.stroke();
    if (fill) pen.fill();
  };

  // Render line
  Renderer.line = function(renderer, x1, y1, x2, y2) {
    let pen = renderer.canvas.pen;

    let transform1 = Renderer._transformVertex(renderer, Vector.create(x1, y1));
    let transform2 = Renderer._transformVertex(renderer, Vector.create(x2, y2));
    let x1t = transform1.x;
    let y1t = transform1.y;
    let x2t = transform2.x;
    let y2t = transform2.y;

    pen.beginPath();
    pen.moveTo(x1t, y1t);
    pen.lineTo(x2t, y2t);
    pen.stroke();
  };

})();
