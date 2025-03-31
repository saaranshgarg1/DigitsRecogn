import React, { useRef, useEffect } from 'react';

const DrawingCanvas = ({ grid, setGrid }) => {
    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const lastPosition = useRef({ x: 0, y: 0 });

    const gridSize = 28;
    const canvasSize = 280; // 10x scale for drawing
    const cellSize = canvasSize / gridSize;

    const startDrawing = (e) => {
        drawing.current = true;
        const { x, y } = getPosition(e);
        lastPosition.current = { x, y };
    };

    const stopDrawing = () => {
        drawing.current = false;
    };

    // Get mouse/touch position relative to the canvas
    const getPosition = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX || e.touches[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches[0]?.clientY) - rect.top;
        return { x, y };
    };

    // Draw pencil-like effect
    const draw = (e) => {
        if (!drawing.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const { x, y } = getPosition(e);

        ctx.beginPath();
        ctx.moveTo(lastPosition.current.x, lastPosition.current.y); // Start from the last position
        ctx.lineTo(x, y); // Draw to the current position
        ctx.strokeStyle = 'black';
        ctx.lineWidth = cellSize * 2; // Pencil thickness
        ctx.lineCap = 'round'; // Smooth line ends
        ctx.stroke();

        lastPosition.current = { x, y }; // Update last position

        // Update grid in real-time
        updateGrid(ctx);
    };

    // Downscale canvas content to 28x28 and update grid
    const updateGrid = (ctx) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasSize;
        tempCanvas.height = canvasSize;

        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(ctx.canvas, 0, 0, canvasSize, canvasSize);

        const imageData = tempCtx.getImageData(0, 0, canvasSize, canvasSize).data;

        let minX = canvasSize, maxX = 0, minY = canvasSize, maxY = 0;
        for (let i = 0; i < canvasSize; i++) {
            for (let j = 0; j < canvasSize; j++) {
                const index = (i * canvasSize + j) * 4;
                const grayscale = imageData[index]; // Grayscale value (from R channel)

                if (grayscale < 255) { // Check if pixel is not white
                    if (j < minX) { minX = j; }
                    if (j > maxX) { maxX = j; }
                    if (i < minY) { minY = i; }
                    if (i > maxY) { maxY = i; }
                }
            }
        }

        // If no drawing exists, return the original grid (empty)
        if (minX === canvasSize || maxX === 0 || minY === canvasSize || maxY === 0) {
            setGrid(Array(gridSize).fill().map(() => Array(gridSize).fill(0)));
            return;
        }

        // Calculate the width and height of the drawn region
        const drawnWidth = maxX - minX + 1;
        const drawnHeight = maxY - minY + 1;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = drawnWidth;
        cropCanvas.height = drawnHeight;

        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.putImageData(tempCtx.getImageData(minX, minY, drawnWidth, drawnHeight), 0, 0);

        // Create a new temporary canvas to center the image
        const centredCanvas = document.createElement('canvas');
        const centredCtx = centredCanvas.getContext('2d');

        centredCanvas.width = canvasSize;
        centredCanvas.height = canvasSize;

        const scale = Math.max(drawnWidth, drawnHeight) / (canvasSize-56);
        // Draw the centered image
        centredCtx.clearRect(0, 0, canvasSize, canvasSize);
        centredCtx.drawImage(cropCanvas,14 + (252-drawnWidth/scale)/2 ,14 + (252-drawnHeight/scale)/2 ,drawnWidth/scale, drawnHeight/scale);
        var scaledImageData = centredCtx.getImageData(0, 0, canvasSize, canvasSize).data;
        // transparent to white
        for (let i = 0; i < scaledImageData.length; i += 4) {
            const alpha = scaledImageData[i + 3]; // Alpha channel
            if (alpha < 255) { // Check if the pixel is fully transparent
                scaledImageData[i] = 255;     // Red
                scaledImageData[i + 1] = 255; // Green
                scaledImageData[i + 2] = 255; // Blue
                scaledImageData[i + 3] = 255; // Alpha (fully opaque)
            }
        }

        // write the scaled image to the canvas
        centredCtx.putImageData(new ImageData(scaledImageData, canvasSize, canvasSize), 0, 0);
        const DownscaleCanvas = document.createElement('canvas');
        DownscaleCanvas.width = gridSize;
        DownscaleCanvas.height = gridSize;

        const DownscaleCtx = DownscaleCanvas.getContext('2d');
        DownscaleCtx.drawImage(centredCanvas, 0, 0, gridSize, gridSize);
        scaledImageData = DownscaleCtx.getImageData(0, 0, gridSize, gridSize).data;

        // Convert the image data to the grid
        const newGrid = [];
        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                const index = (i * gridSize + j) * 4; // RGBA index
                const grayscale = scaledImageData[index]; // R channel (grayscale)
                row.push(grayscale);
            }
            newGrid.push(row);
        }

        // Update the grid state
        setGrid(newGrid);
    };

    useEffect(() => {
        // Initialize the canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
    }, []);

    return (
        <canvas
            id="draw"
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            style={{ border: '1px solid black', touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        ></canvas>
    );
};

export default DrawingCanvas;
