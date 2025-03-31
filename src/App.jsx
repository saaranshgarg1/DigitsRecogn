import React, { useState, useEffect } from 'react';
import DrawingCanvas from './canvas';
import Visualization from './vis';
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
    gridvalue = gridvalue.map(row => row.map(val => 1 - val / 255));
    const flatGrid = gridvalue.flat();

    // Flatten the grid into a single array for each row and reshape to 4D tensor [1, 28, 28, 1]
    const tensor = tf.tensor2d(flatGrid, [1, 28 * 28]);

    // Make a prediction through the model
    const prediction = model.predict(tensor);

    // Get the predicted digit (index of the highest probability)
    const digit = prediction.argMax(1).dataSync()[0];
    return digit;
}

const PredictionComponent = ({ grid, predict }) => {
    const [prediction, setPrediction] = useState(null);

    useEffect(() => {
        // Function to update the prediction
        const updatePrediction = () => {
            if (grid) {
                const result = predict(grid); // Call the predict function with the grid
                setPrediction(result);
            }
        };
        updatePrediction();

    }, [grid, predict]); // Re-run effect if grid or predict changes

    return (
        <div className="prediction-display">
            {prediction !== null ? `Prediction: ${prediction}` : 'Draw a digit to see prediction...'}
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
        setGrid(Array(gridSize).fill().map(() => Array(gridSize).fill(0)));
    };

    return (
        <div className="container">
            <h1 className="app-header">Handwritten Digit Recognition</h1>
            
            <div className="drawing-section">
                <div className="canvas-container">
                    <DrawingCanvas grid={grid} setGrid={setGrid} />
                </div>
                
                <div className="controls">
                    <button onClick={clearCanvas} className="btn btn-clear">Clear Drawing</button>
                </div>
                
                <PredictionComponent grid={grid} predict={predict} />
            </div>
            
            <div className="visualization-section">
                <h2>Neural Network Visualization</h2>
                <Visualization model={model} grid={grid} />
            </div>
        </div>
    );
};

export default App;
