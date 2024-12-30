import React, { useState, useEffect } from 'react';
import DrawingCanvas from './canvas';
import * as tf from '@tensorflow/tfjs';
import './App.css';

let model;
try {
  model = await tf.loadLayersModel('/model.json');
  console.log(model);
  console.log(model.summary());
} catch (error) {
  console.error('Error loading model:', error);
}


function predict(gridvalue) {
  console.log(gridvalue);
  const flatGrid = gridvalue.map(row => row.map(val => 1 - val / 255)).flat();
  const tensor = tf.tensor2d(flatGrid, [1, 28 * 28]);
  const prediction = model.predict(tensor);
  const digit = prediction.argMax(1).dataSync()[0];
  return digit;
}

const PredictionComponent = ({ grid, predict }) => {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const updatePrediction = () => {
      if (grid) {
        const result = predict(grid); // Call the predict function with the grid
        setPrediction(result);
      }
    };
    updatePrediction();

  }, [grid, predict]); // Re-run effect if grid or predict changes

  return (
    <div>
      prediction: {prediction !== null ? prediction : 'Calculating...'}
    </div>
  );
};

const App = () => {
  const gridSize = 28;
  const [grid, setGrid] = useState(Array(gridSize).fill().map(() => Array(gridSize).fill(0)));

  const clearCanvas = () => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="container">
      <h1>Draw a number!</h1>
      <DrawingCanvas grid={grid} setGrid={setGrid} />
      <PredictionComponent grid={grid} predict={predict} />
      <button onClick={clearCanvas}>Clear</button>
    </div>
  );
};



export default App;
