var NeuralNetwork = {};

(function() {

  // Create a new neural network
  NeuralNetwork.create = function(...layers) {
    let neuralNet = {
      layers: [],
      weights: [],
      biases: [],
      learningRate: 0.1,
      dimensions: null
    }

    neuralNet.dimensions = layers;

    // Create nodes and biases
    for (let i = 0; i < layers.length; i++) {
      neuralNet.layers.push(Matrix.create(layers[i], 1, 0));
      if (i > 0) {
        neuralNet.biases.push(Matrix.create(layers[i], 1, 0));
      }
    }

    // Create and initialise weights
    for (let i = 0; i < layers.length - 1; i++) {
      neuralNet.weights.push(Matrix.create(layers[i + 1], layers[i]));
      Matrix.map(neuralNet.weights[neuralNet.weights.length - 1], () => {
        let p = Random.normalRandom();
        return p / Math.sqrt(layers[i]);
      });
    }

    return neuralNet;
  };

  // Get an output for a set of inputs (inputs must be single column matrix)
  NeuralNetwork.getOutput = function(neuralNet, inputs) {
    if (neuralNet.layers[0].length != inputs.length)
      console.warn('User input matrix does not match input layer matrix. Inputs layer size: ' +
                    neuralNet.layers[0].length.toString() +
                    '. User input size: ' +
                    inputs.length.toString());
    neuralNet.layers[0] = inputs;

    let layers = neuralNet.layers,
        weights = neuralNet.weights,
        biases = neuralNet.biases;

    for (let i = 0; i < layers.length - 1; i++) {
      let nextLayerValues = Matrix.add(
        Matrix.mult(weights[i], layers[i]),
        biases[i]
      );
      Matrix.map(nextLayerValues, Functions.sigmoid);
      neuralNet.layers[i + 1] = Matrix.clone(nextLayerValues);
    }

    return neuralNet.layers[neuralNet.layers.length - 1];
  };

  // Backpropagation for neural network learning
  NeuralNetwork.train = function(neuralNet, input, target) {
    let weights = neuralNet.weights,
        layers = neuralNet.layers,
        lr = neuralNet.learningRate;

    // Get an output for given inputs
    let output = NeuralNetwork.predict(neuralNet, input);

    // Get errors of each layer
    let errors = [Matrix.sub(target, output)];
    for (let i = weights.length - 1; i > 0; i--) {
      let mat = Matrix.transpose(weights[i]);
      let prevLayerErrors = Matrix.mult(mat, errors[errors.length - 1]);
      errors.push(prevLayerErrors);
    }
    errors.reverse();

    // Compute weight deltas
    for (let i = 0; i < weights.length; i++) {
      let thisInput = layers[i];
      let thisOutput = layers[i + 1];

      let sigmoidPrime = function(x) {
        return x * (1 - x);
      }

      let a = Matrix.mult(errors[i], lr);

      let b = Matrix.clone(thisOutput);
      Matrix.map(b, sigmoidPrime);

      let c = Matrix.hadamardProduct(a, b); // biasDelatas = c

      let weightDeltas = Matrix.mult(
        c,
        Matrix.transpose(thisInput)
      );

      // Apply weight deltas
      neuralNet.weights[i] = Matrix.add(neuralNet.weights[i], weightDeltas);
      // Apply bias deltas
      neuralNet.biases[i] = Matrix.add(neuralNet.biases[i], c);
    }

  };

  // Get error values for the output layer
  NeuralNetwork.getErrors = function(neuralNet, input, target) {
    // Get an output for given inputs
    let output = NeuralNetwork.predict(neuralNet, input);

    // Get errors of each layer
    return Matrix.sub(target, output);
  };

  // Get child of two parent networks
  NeuralNetwork.getChild = function(parentA, parentB, crossProb) {
    crossProb = crossProb || 0.8;
    let parentRand = Math.round(Random.random(0, 1));
    let child = Common.clone(parentA, true);
    if (parentRand == 1) child = Common.clone(parentB, true);

    let crossRand = Random.random(0, 1);
    if (crossRand > crossProb) return child;

    for (let i = 0; i < child.weights.length; i++) {
      for (let r = 0; r < child.weights[i].length; r++) {
        for (let c = 0; c < child.weights[i][r].length; c++) {
          let rand = Math.round(Random.random(0, 1));
          if (rand == 0) child.weights[i][r][c] = parentA.weights[i][r][c];
          if (rand == 1) child.weights[i][r][c] = parentB.weights[i][r][c];
        }
      }
    }
    return child;
  };

  // Mutate a neural network
  NeuralNetwork.mutate = function(neuralNet, mutationProb) {
    mutationProb = mutationProb || 0.03;
    for (let i = 0; i < neuralNet.weights.length; i++) {
      Matrix.map(neuralNet.weights[i], (x) => {
        let rand = Random.random(0, 1);
        if (rand < mutationProb) {
          return x + Random.normalRandom();
        }
        return x;
      });
    }
    for (let i = 0; i < neuralNet.biases.length; i++) {
      Matrix.map(neuralNet.biases[i], (x) => {
        let rand = Random.random(0, 1);
        if (rand < mutationProb) {
          return x + Random.normalRandom();
        }
        return x;
      });
    }
  };

  // Get two parent networks using roulette wheel algorithm
  NeuralNetwork.getParents = function(population, fitnesses) {
    let pop = Functions.sortNonNumerical(population, fitnesses);
    let parents = {
      parentA: null,
      parentB: null
    };
    let partialSum, sum;
    for (let i = 0; i < 2; i++) {
      sum = Functions.arraySum(fitnesses);
      partialSum = Random.random(0, sum);
      partialSum += fitnesses[0];
      let index = 0;
      while (partialSum < sum) {
        index++;
        partialSum += fitnesses[index];
      }
      if (i == 0) {
        parents.parentA = pop[index];
      } else {
        parents.parentB = pop[index];
      }
    }
    return parents;
  };

})();
