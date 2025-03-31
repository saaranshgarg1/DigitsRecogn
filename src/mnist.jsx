// Import TensorFlow.js
const tf = require('@tensorflow/tfjs-node');

// Load the MNIST dataset
const loadMnistData = async () => {
    const mnist = require('mnist'); // Install "mnist" via npm

    // Load dataset with 48k training and 12k testing samples
    const dataset = mnist.set(48000, 12000);

    const prepareData = (data) => {
        const images = data.map(sample => sample.input.map(val => val));
        const labels = data.map(sample => sample.output);

        const imagesTensor = tf.tensor2d(images, [images.length, 28 * 28]);
        const labelsTensor = tf.tensor2d(labels, [labels.length, 10]);

        return {
            images: imagesTensor,
            labels: labelsTensor,
        };
    };

    return {
        train: prepareData(dataset.training),
        test: prepareData(dataset.test),
    };
};

// Define the advanced model
const createModel = () => {
    const model = tf.sequential();

    // Reshape the input to [28, 28, 1] for convolution layers
    model.add(tf.layers.reshape({ targetShape: [28, 28, 1], inputShape: [28 * 28] }));

    // First Convolutional Block
    model.add(tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
    model.add(tf.layers.dropout({ rate: 0.25 }));

    // Fully Connected Layers
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 10, activation: 'softmax' })); // Output layer

    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
};

// Train the model
const trainModel = async (model, trainData) => {
    const { images, labels } = trainData;

    await model.fit(images, labels, {
        epochs: 3,
        batchSize: 64,
        validationSplit: 0.2,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, acc = ${logs.acc.toFixed(4)}`);
            },
        },
    });
};

// Test the model
const testModel = async (model, testData) => {
    const { images, labels } = testData;
    const result = await model.evaluate(images, labels);
    const testLoss = result[0].dataSync()[0];
    const testAcc = result[1].dataSync()[0];
    console.log(`Test Loss: ${testLoss.toFixed(4)}, Test Accuracy: ${testAcc.toFixed(4)}`);
};

// Save the model
const saveModel = async (model) => {
    const path = 'file://./mnist-model'; // Specify save directory
    await model.save(path);
    console.log(`Model saved to ${path}`);
};

// Main function
(async () => {
    console.log('Loading MNIST data...');
    const data = await loadMnistData();

    console.log('Creating the advanced model...');
    const model = createModel();

    console.log('Training the model...');
    await trainModel(model, data.train);

    console.log('Testing the model...');
    await testModel(model, data.test);

    console.log('Saving the model...');
    await saveModel(model);

    console.log('Training, testing, and saving completed.');
})();
