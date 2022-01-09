var __requestAnimationFrame__, __cancelAnimationFrame__;

var Runner = {};

(function() {

  // Runner defaults
  Runner.defaults = function() {
    return {
      loop: null,
      fps: 0,
      isRunning: false,
      event: null,
      mouse: null
    }
  };

  __requestAnimationFrame__ = window.requestAnimationFrame;
  __cancelAnimationFrame__ = window.cancelAnimationFrame;

  // Set up Runner
  Runner.create = function(options) {
    options = options || {};
    let runner = Common.extend(options, Runner.defaults());
    return runner;
  };

  // Runs the simulation
  Runner.run = function(runner) {
    let frameTime, currentTime, accumulator = 0;
    runner.isRunning = true;

    function updateLoop() {

      // Find real time progressed
      currentTime = Date.now();
      runner.fps = Math.round(1000 / (currentTime - frameTime));
      frameTime = currentTime;

      // Update inputs
      if (runner.mouse) Mouse.update(runner.mouse);
      Keys.update();

      // Callback event
      if (runner.event) runner.event();

      if (runner.isRunning) {
        runner.loop = __requestAnimationFrame__(updateLoop);
      } else {
        __cancelAnimationFrame__(runner.loop);
        return;
      }

    }

    frameTime = Date.now();
    runner.loop = __requestAnimationFrame__(updateLoop);
  };

  // Pauses the simulation
  Runner.stop = function(runner) {
    __cancelAnimationFrame__(runner.loop);
    runner.isRunning = false;
  };

})();
