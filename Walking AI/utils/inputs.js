var Mouse = {};

(function() {

  // Mouse defulats
  Mouse.defaults = function() {
    return {
      scope: null,
      canvas: null,
      isSetup: false,
      position: {
        x: 0,
        y: 0
      },
      positionPrev: {
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
  Mouse.create = function(options) {
    let mouse = Common.extend(options, Mouse.defaults());

    // Ensure an element for the canvas and scope is provided
    if (mouse.canvas.pen) {
      mouse.canvas = mouse.canvas.element;
    }
    if (mouse.scope.pen) {
      mouse.scope = mouse.scope.element;
    }

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
  Mouse.applyRendererTransform = function(mouse, renderer) {
    let sfm = Vector.create(1 / renderer.scale.x, 1 / renderer.scale.y);
    mouse.transform = function(m) {
      m = Vector.sub(m, renderer.offset);
      m = Geometry.scalePoint(m, sfm, renderer.focus);
      return m;
    }
  };

  // Updates mouse properties
  Mouse.update = function(mouse) {
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

    // Update position
    mouse.positionPrev = mouse.position;
  };
})();




var Keys = {};

(function() {

  Keys.key = null,
  Keys.status = {
    isDown: false
  },
  Keys.events = {
    keyup: null,
    keydown: null,
    keyrelease: null,
    keyclick: null
  }

  // Create event listeners
  document.addEventListener('keydown', function(event) {
    Keys.key = event.key || event.keyCode;
    if (!Keys.status.isDown) {
      if (typeof Keys.events.keyclick === 'function') {
        Keys.events.keyclick();
      }
    }
    Keys.status.isDown = true;
  });

  document.addEventListener('keyup', function(event) {
    Keys.key = event.key || event.keyCode;
    if (Keys.status.isDown) {
      if (typeof Keys.events.keyrelease === 'function') {
        Keys.events.keyrelease();
      }
    }
    Keys.status.isDown = false;
  });

  // Update keys properties
  Keys.update = function() {
    if (Keys.status.isDown) {
      if (typeof Keys.events.keydown === 'function') {
        Keys.events.keydown();
      }
    } else {
      if (typeof Keys.events.keyup === 'function') {
        Keys.events.keyup();
      }
    }
  }

})();
