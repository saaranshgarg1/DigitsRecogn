const tf = require('@tensorflow/tfjs-node');
const { createCanvas } = require('canvas'); // For drawing the image
const mnist = require('mnist'); // Load the MNIST dataset

(async () => {
    // Load the dataset
    const dataset = mnist.set(48000, 12000);

    // Extract the first sample
    const firstSample = dataset.training[0];
    const imageArray = firstSample.input; // 1D array of 784 values
    const label = firstSample.output.findIndex(val => val === 1); // Label is the index of 1 in output array

    // Reshape the 1D array to a 2D array (28x28)
    const image2D = [];
    for (let i = 0; i < 28; i++) {
        image2D.push(imageArray.slice(i * 28, (i + 1) * 28));
    }

    // Create a canvas
    const canvas = createCanvas(280, 280); // Scale up for better visualization
    const ctx = canvas.getContext('2d');

    // Draw the image
    for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
            const pixel = image2D[y][x];
            const grayscale = Math.floor((pixel=== 0) ? 0 : 255); // Convert to grayscale
            ctx.fillStyle = `rgb(${grayscale}, ${grayscale}, ${grayscale})`;
            ctx.fillRect(x * 10, y * 10, 10, 10); // Scale each pixel 10x10 for better visibility
        }
    }

    // Save the canvas to a file
    const fs = require('fs');
    const out = fs.createWriteStream('mnist-sample.png');
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => console.log(`Saved MNIST sample to mnist-sample.png with label: ${label}`));
})();