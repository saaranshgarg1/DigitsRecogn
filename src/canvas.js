import React, { useRef, useEffect } from 'react';

const DrawingCanvas = ({ grid, setGrid }) => {
    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const lastPosition = useRef({ x: 0, y: 0 });

    const gridSize = 28;
    const canvasSize = 280; // 10x scale for drawing
    const cellSize = canvasSize / gridSize;

    // Start drawing
    const startDrawing = (e) => {
        drawing.current = true;
        const { x, y } = getPosition(e);
        lastPosition.current = { x, y };
    };

    // Stop drawing
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
        ctx.lineWidth = cellSize*2; // Pencil thickness
        ctx.lineCap = 'round'; // Smooth line ends
        ctx.stroke();

        lastPosition.current = { x, y }; // Update last position

        // Update grid in real-time
        updateGrid(ctx);
    };

    // Downscale canvas content to 28x28 and update grid
    const updateGrid = (ctx) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = gridSize;
        tempCanvas.height = gridSize;
    
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(ctx.canvas, 0, 0, gridSize, gridSize);
    
        const imageData = tempCtx.getImageData(0, 0, gridSize, gridSize).data;
    
        // Find the bounding box of the drawn content
        let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0;
    
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const index = (i * gridSize + j) * 4;
                const grayscale = imageData[index]; // Grayscale value (from R channel)
    
                if (grayscale > 0) { // Check if pixel is non-white (part of the drawing)
                    if (i < minY) minY = i;
                    if (i > maxY) maxY = i;
                    if (j < minX) minX = j;
                    if (j > maxX) maxX = j;
                }
            }
        }
    
        // If no drawing exists, return the original grid (empty)
        if (minX === gridSize || maxX === 0 || minY === gridSize || maxY === 0) {
            setGrid(Array(gridSize).fill().map(() => Array(gridSize).fill(0)));
            return;
        }
    
        // Calculate the width and height of the drawn region
        const drawnWidth = maxX - minX + 1;
        const drawnHeight = maxY - minY + 1;
    
        // Determine the scale factor to fit the drawing into the 28x28 grid
        let scaleFactor = 1;
        if (drawnWidth > drawnHeight) {
            scaleFactor = gridSize / drawnWidth;
        } else {
            scaleFactor = gridSize / drawnHeight;
        }
    
        // Create a new temporary canvas to scale and center the image
        const scaledCanvas = document.createElement('canvas');
        const scaledCtx = scaledCanvas.getContext('2d');
    
        scaledCanvas.width = gridSize;
        scaledCanvas.height = gridSize;
    
        // Draw the scaled and centered image
        scaledCtx.clearRect(0, 0, gridSize, gridSize);
        scaledCtx.drawImage(tempCanvas, minX, minY, drawnWidth, drawnHeight, 
            (gridSize - drawnWidth * scaleFactor) / 2, 
            (gridSize - drawnHeight * scaleFactor) / 2, 
            drawnWidth * scaleFactor, drawnHeight * scaleFactor);
    
        // Now, get the image data from the scaled canvas
        const scaledImageData = scaledCtx.getImageData(0, 0, gridSize, gridSize).data;
    
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
