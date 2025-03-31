import React, { useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import './vis.css';

function Visualization({ model, grid }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Normalize and flatten the grid into a single array
  const normalizedGrid = grid.map(row => row.map(val => 1 - val / 255));
  const flatGrid = normalizedGrid.flat();

  // Create a tensor for the grid input
  const gridTensor = tf.tensor2d(flatGrid, [1, 28 * 28]);

  // Filter and process only Dense layers
  const denseLayers = model.layers.filter(layer => layer.getClassName() === 'Dense');

  // Get layer information
  const layerInfo = denseLayers.map((layer, index) => {
    const layerName = layer.name;
    const layerType = layer.getClassName(); // Should always be 'Dense'
    const numNodes = layer.outputShape.slice(-1)[0]; // Number of nodes in the layer
    const weights = layer.getWeights();

    // Create a submodel to get outputs of this layer
    const subModel = tf.model({
      inputs: model.input,
      outputs: layer.output,
    });
    const activationTensor = subModel.predict(gridTensor);
    const activation = activationTensor.arraySync()[0];

    return {
      layerIndex: index,
      layerName,
      layerType,
      numNodes,
      weights: weights.map(w => w.arraySync()), // Convert weights to plain arrays
      activation, // Array of activation values
    };

  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;

    // Match canvas size to container size
    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Select all node elements
    const layerDivs = Array.from(container.querySelectorAll('.layer-info .node'));

    layerInfo.forEach((layer, layerIndex) => {
      if (layerIndex < layerInfo.length - 1) {
        const nextLayer = layerInfo[layerIndex + 1];
        const weights = nextLayer.weights[0]; // Connections from current to next layer

        // Get container's bounding rect once (for offset calculations)
        const containerRect = container.getBoundingClientRect();

        layer.activation.forEach((value, nodeIndex) => {
          const startNode = layerDivs.find(
            node =>
              Number(node.dataset.layerIndex) === layerIndex &&
              Number(node.dataset.nodeIndex) === nodeIndex
          );

          // Retrieve bounding rectangle for the start node
          const startNodeRect = startNode.getBoundingClientRect();

          // Calculate node center/edge, relative to container
          const startX = startNodeRect.left - containerRect.left + startNodeRect.width / 2;
          // If you want the line to start at bottom center:
          const startY = startNodeRect.top - containerRect.top + startNodeRect.height;

          nextLayer.activation.forEach((_, nextNodeIndex) => {
            const weight = weights[nodeIndex][nextNodeIndex];
            const normalizedWeight = Math.tanh(weight); // Scale between -1 and 1

            // Choose color based on sign of weight
            const color =
              normalizedWeight >= 0
                ? `rgba(0, 0, 255, ${normalizedWeight})` // Blue for positive
                : `rgba(255, 0, 0, ${Math.abs(normalizedWeight)})`; // Red for negative

            const endNode = layerDivs.find(
              node =>
                Number(node.dataset.layerIndex) === layerIndex + 1 &&
                Number(node.dataset.nodeIndex) === nextNodeIndex
            );

            // Retrieve bounding rectangle for the end node
            const endNodeRect = endNode.getBoundingClientRect();

            // If you want the line to end at the top center of the next node:
            const endX = endNodeRect.left - containerRect.left + endNodeRect.width / 2;
            const endY = endNodeRect.top - containerRect.top;

            // Draw the line
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.abs(normalizedWeight) * 2;
            ctx.stroke();
          });
        });
      }
    });

  }, [layerInfo]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        textAlign: 'center',
        width: '100%', // (Adjust as needed)
        // minHeight: '600px', // (Adjust as needed or remove if you have your own container styles)
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: '-10px',
          left: 0,
          zIndex: 0,
          pointerEvents: 'none',
          width: '100%',
          height: '100%',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {layerInfo.map((layer, index) => (
          <div
            key={index}
            className="layer-info"
            style={{ margin: '20px 0', textAlign: 'center', width: '100%' }}
          >

            Layer {layer.layerIndex + 1}: {layer.layerName}

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {layer.activation.map((value, nodeIndex) => {
                // Scale value between -1 and 1
                const normalizedValue = Math.tanh(value);
                // Color depends on sign of activation
                const color =
                  value >= 0
                    ? `rgba(0, 0, 255, ${normalizedValue})`
                    : `rgba(255, 0, 0, ${Math.abs(normalizedValue)})`;

                return (
                  <div
                    key={nodeIndex}
                    className="node"
                    data-layer-index={index}
                    data-node-index={nodeIndex}
                    style={{
                      flex: 1,
                      height: '30px',
                      backgroundColor: color,
                      border: '1px solid #ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: index === layerInfo.length - 1 ? '10px' : '0px',
                      color: '#000',
                      borderRadius: '5px',
                      boxSizing: 'border-box',
                      margin: '2px',
                    }}
                    title={`Node ${nodeIndex + 1}: ${Number(value).toFixed(3)}`}
                  >
                    {index === layerInfo.length - 1 ? Number(value).toFixed(2) : ''}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>

  );
}

export default Visualization; 