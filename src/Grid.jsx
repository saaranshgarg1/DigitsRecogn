import React from 'react';
import './Grid.css'; // CSS file for styling

const Grid = ({ grid, setGrid, isDrawing, setIsDrawing}) => {
    const gridSize = 28;

    // Handle mouse down event (start drawing)
    const handleMouseDown = (row, col) => {
        setIsDrawing(true);
        updateGridCell(row, col, 1);
        if (row > 0 && grid[row - 1][col] === 0) {
            updateGridCell(row - 1, col);
        }
        if (row < gridSize - 1 && grid[row + 1][col] === 0) {
            updateGridCell(row + 1, col);
        }
        if (col > 0 && grid[row][col - 1] === 0) {
            updateGridCell(row, col - 1);
        }
        if (col < gridSize - 1 && grid[row][col + 1] === 0) {
            updateGridCell(row, col + 1);
        }
    };

    // Handle mouse over event (continue drawing)
    const handleMouseOver = (row, col) => {
        if (isDrawing) {
            updateGridCell(row, col, 1);
            if (row > 0 && grid[row - 1][col] === 0) {
                updateGridCell(row - 1, col);
            }
            if (row < gridSize - 1 && grid[row + 1][col] === 0) {
                updateGridCell(row + 1, col);
            }
            if (col > 0 && grid[row][col - 1] === 0) {
                updateGridCell(row, col - 1);
            }
            if (col < gridSize - 1 && grid[row][col + 1] === 0) {
                updateGridCell(row, col + 1);
            }
        }
    };

    // Handle mouse up event (stop drawing)
    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const updateGridCell = (row, col, val = 0.5) => {
            setGrid((prevGrid) => {
                const newGrid = prevGrid.map((rowArr, r) =>
                    rowArr.map((cell, c) => (r === row && c === col ? val : cell))
                );
                return newGrid;
            });
        };
    return (
        <div
            className="grid"
            onMouseLeave={() => setIsDrawing(false)} // Stop drawing if mouse leaves the grid
        >
            {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`cell ${cell===1 ? 'active' : cell===0.5 ? 'semi-active' : ''}`}
                        onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                        onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
                        onMouseUp={handleMouseUp}
                    ></div>
                ))
            )}
        </div>
    );
};

export default Grid;