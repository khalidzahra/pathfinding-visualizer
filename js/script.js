/*
    KEY -> used for node type identification 
    0 - unvisited
    1 - visited
    2 - start node
    3 - end node
    4 - queued
    5 - blocked
    6 - location
*/

// Defines the total number of nodes in the grid, and calculates number of rows for initializing the nodes array.
const NUMBER_OF_NODES = 1000, NODES_PER_ROW = 50, NUMBER_OF_ROWS = NUMBER_OF_NODES / NODES_PER_ROW;
const TABLE_QUERY = '#grid-container table'; // Used to select the grid using its css ID.
var start_node, end_node, pathLocations; // Stores the start node, end node, and locations that the path must pass through.
var isReset = false, isDragging = false, hasStarted = false, isInEndPhase = false; // Flags for identifying different actions and current project phase.

// Declaring nodes array
var nodes;

// Initializing all variables
function init() {
    nodes = Array.from({ length: NUMBER_OF_ROWS }, () => 
        Array.from({ length: NODES_PER_ROW }, () => 0)
    );
    end_node = [9, 30];
    start_node = [9, 13];
    pathLocations = [];
    nodes[start_node[0]][start_node[1]] = 2; // start node
    nodes[end_node[0]][end_node[1]] = 3; // end node
}

// Handles a node click event
function nodeClickHandler(e) {
    if (!e.target.classList.contains("blocked-node")) {
        if (isDragging || hasStarted)
            return;
        let row = e.target.parentNode.rowIndex;
        let col = e.target.cellIndex;
        if (nodes[row][col] !== 0) // If the clicked node is not a normal unvisited node, then ignore.
            return;
        if (e.shiftKey) { // If it was a shift-click, then set the node as a path location.
            nodes[row][col] = 6;
            e.target.classList.add("location-node");
            pathLocations.push([row, col]);
        } else { // If it was a normal click, then set the node as a blocked node.
            nodes[row][col] = 5;
            e.target.classList.add("blocked-node");
        }
    } 
}

// Adds required listeners to support draggable nodes
function addDragListeners() {
    // Listeners for each cell
    document.querySelectorAll("td").forEach(cell => {
        // Start of dragging
        cell.addEventListener("dragstart", e => {
            if (!hasStarted && cell.draggable && !isInEndPhase) {
                isDragging = true;
                e.dataTransfer.setData("text/plain", cell.classList[0]);
                e.dataTransfer.setData("boolean", true);
            }
        });
        // Highlights node currently being dragged over
        cell.addEventListener("dragover", e => {
            e.preventDefault();
            if (e.dataTransfer.getData("boolean") && !isInEndPhase && !hasStarted)
                cell.classList.add("drag-over");
        });
        // Removes cell highlighting when dragged node leaves the cell
        cell.addEventListener("dragleave", e => removeClassFromCell(cell.parentNode.rowIndex, cell.cellIndex, "drag-over"));
        // Handles dropping the node in its final location.
        cell.addEventListener("drop", e => {
            e.preventDefault();
            let isNode = e.dataTransfer.getData("boolean");
            let data = e.dataTransfer.getData("text/plain");
            if (isNode && data != null && !e.target.classList.contains("blocked-node") && !hasStarted && !isInEndPhase) { // Checks if dropped node and target node are both valid
                // Checks which node was dragged (start/end) and updates their locations in the nodes array.
                if (data === "start-node") {
                    removeClassFromCell(start_node[0], start_node[1], data);
                    setCellDraggable(start_node[0], start_node[1], false);
                    nodes[start_node[0]][start_node[1]] = 0;
                    start_node = [cell.parentNode.rowIndex, cell.cellIndex];
                    nodes[start_node[0]][start_node[1]] = 2;
                } else {
                    removeClassFromCell(end_node[0], end_node[1], data);
                    setCellDraggable(end_node[0], end_node[1], false);
                    nodes[end_node[0]][end_node[1]] = 0;
                    end_node = [cell.parentNode.rowIndex, cell.cellIndex];
                    nodes[end_node[0]][end_node[1]] = 3;
                }
                // Transfers the CSS class to the new node and allows it to be dragged.
                cell.classList.add(data);
                setCellDraggable(cell, true);
            }
            removeClassFromCell(cell.parentNode.rowIndex, cell.cellIndex, "drag-over"); // Removes the dragover class after dropping the node.
            isDragging = false;
        });
    });

}

// Grid generation
function generateGrid(table) {
    for (let i = 0; i < NUMBER_OF_ROWS; i++) {
        let row = table.insertRow();
        row.draggable = false;
        for (let j = 0; j < NODES_PER_ROW; j++) {
            let cell = row.insertCell();
            // Checks if current node is start/end node and allows it to be draggable.   
            if (nodes[i][j] == 2) {
                cell.classList.add("start-node");
                setCellDraggable(cell, true);
            } else if (nodes[i][j] == 3) {
                cell.classList.add("end-node");
                setCellDraggable(cell, true);
            }
            cell.addEventListener("click", e => nodeClickHandler(e)); // Adds the click handler to each cell in the grid.
            cell.addEventListener("mouseover", e => { // Does the same but this is for supporting holding down mouse button.
                if (e.buttons == 1)
                    nodeClickHandler(e);
            });
        }
    }
    // Adds drag listeners to all cells.
    addDragListeners();
}

// Resets the grid and clears system variables.
function reset() {
    isReset = true;
    isInEndPhase = false;
    let cells = document.getElementById("grid-container").getElementsByTagName("td");
    // Clears classes given to all cells.
    for (let cell of cells) {
        cell.classList = [];
    }
    init();
    addClassToCell(start_node[0], start_node[1], "start-node");
    addClassToCell(end_node[0], end_node[1], "end-node");
}

// Does a soft reset by only clearing cell classes. Used when pathing from a new path location.
function softReset() {
    let cells = document.getElementById("grid-container").getElementsByTagName("td");
    for (let cell of cells) {
        if (cell.classList.contains("visited") || cell.classList.contains("queued")) {
            removeClassFromCell(cell.parentNode.rowIndex, cell.cellIndex, "visited");
            removeClassFromCell(cell.parentNode.rowIndex, cell.cellIndex, "queued");
            nodes[cell.parentNode.rowIndex][cell.cellIndex] = 0;
        }
    }
}

// Checks if the given cell is traversable.
function canBeTraveresed(row, col) {
    return !(nodes[row][col] == 1 || nodes[row][col] == 4 || nodes[row][col] == 5);
}

// Returns given node's valid and traversable immediate neighbours.
function getNeighbours(row, col) {
    neighbours = [];
    if (row - 1 > -1 && canBeTraveresed(row - 1, col)) 
        neighbours.push([row - 1, col]); 
    if (row + 1 < NUMBER_OF_ROWS && canBeTraveresed(row + 1, col)) 
        neighbours.push([row + 1, col]);
    if (col - 1 > -1 && canBeTraveresed(row, col - 1)) 
        neighbours.push([row, col - 1]);
    if (col + 1 < NODES_PER_ROW && canBeTraveresed(row, col + 1)) 
        neighbours.push([row, col + 1]);
    return neighbours;
}

// Returns the DOM object of the given cell.
function getCell(row, col) {
    return document.querySelector(TABLE_QUERY).rows[row].cells[col];
}

// Removes the given class from the specified cell.
function removeClassFromCell(row, col, clazz) {
    let cell = document.querySelector(TABLE_QUERY).rows[row].cells[col];
    cell.className = cell.className.replace(new RegExp('(?:^|\\s)'+ clazz + '(?:\\s|$)'), ' ');
}

// Adds the given class to the specified cell.
function addClassToCell(row, col, clazz) {
    document.querySelector(TABLE_QUERY).rows[row].cells[col].classList.add(clazz);
}

// Sets the draggable property of a cell to the specified value (boolean).
function setCellDraggable(cell, draggable) {
    cell.draggable = draggable;
}

// Marks specified node as visited.
function setVisited(row, col) {
    nodes[row][col] = 1;
    addClassToCell(row, col, "visited");
}

// Creates a timeout for the specified amount of time.
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Returns the cost calculated according to the cost function specified.
function calculateCost(node, f) {
    if (f == "cost") {
        return node.cost;
    } else if (f == "heuristic") {
        return node.heuristic;
    } else {
        return node.cost + node.heuristic;
    }
}

// Priority queue implementation. Takes the cost function to sort by.
function PriorityQueue(prop) {
    var arr = [];
    this.push = function (el) {
        if (this.isEmpty()) {
            arr.push(el);
        } else {
            var added = false;
            for (var i = 0; i < arr.length; i++) {
                if (calculateCost(el, prop) < calculateCost(arr[i], prop)) {
                    arr.splice(i, 0, el);
                    added = true;
                    break;
                }
            }
            if (!added) {
                arr.push(el);
            }
        }
    };
    this.pop = function () {
        var value = arr.shift();
        return value;
    };
    this.front = function () {
        return arr[0];
    };
    this.length = function () {
        return arr.length;
    };
    this.isEmpty = function () {
        return arr.length === 0;
    };
}

// Sets the parent and the cost of the specified node
function setParentCost(path, node, _parent, _cost) {
    path[node] = {
        parent: _parent,
        cost: _cost
    }
}

// Finds the shortest path to the end node
async function findEndNode(startRow, startCol, finalPath) {
    // Sets system flags.
    if (isReset)
        isReset = false;
    hasStarted = true;

    let path = {};
    path[`${startRow},${startCol}`] = {
        parent: null,
        cost: 1,
        heuristic: Math.sqrt(Math.pow(startRow - end_node[0], 2) + Math.pow(startCol - end_node[1], 2))
    };

    let queue = new PriorityQueue(document.getElementById("algorithm-selector").value);
    queue.push({
        pos: [startRow, startCol],
        cost: path[`${startRow},${startCol}`].cost,
        heuristic: path[`${startRow},${startCol}`].heuristic
    });

    // Sets the current target node to be found. Sets it to the end node if no path locations are present.
    let targetNode;
    if (pathLocations.length > 0) {
        targetNode = pathLocations.shift();
    } else {
        targetNode = end_node;
    }

    while (queue.length() > 0) {
        await timeout(10); // Timeout for animation.
        if (isReset) // Stops if user resets mid-way through.
            break;
        let node = queue.pop(); // Pops node at the top of the frontier.
        node = node.pos; // The node returned from the frontier is an object with cost and heuristic but we only need its position now.
        if (node[0] == targetNode[0] && node[1] == targetNode[1]) { // If the target node was reached then add the path to the final path and check if there are more target nodes (path locations/end node).
            finalPath = finalPath.concat(getPathBetween(path, [startRow, startCol], targetNode)); // Adds the path between the start node and the target node to the final path.
            if (targetNode != end_node) { // If the target node is not the end node then start again and find the end node.
                softReset();
                findEndNode(targetNode[0], targetNode[1], finalPath);
            } else { // Otherwise, draw the final path for the user.
                softReset();
                drawPath(finalPath);
            }
            break;
        }
        // Sets current node to visited.
        setVisited(node[0], node[1]);
        // Finds neighbours, calculates their costs, and adds them to the queue.
        handleNeighbours(node, queue, path, targetNode);
    }

    hasStarted = false;
}

// Adds neighbours to queue to be processed and calculates their costs.
function handleNeighbours(node, queue, path, targetNode) {
    getNeighbours(node[0], node[1]).forEach(n => {
        // Pushes node object containing cost and heuristic to the queue.
        queue.push({
            pos: [n[0], n[1]],
            cost: 1,
            heuristic: Math.sqrt(Math.pow(n[0] - targetNode[0], 2) + Math.pow(n[1] - targetNode[1], 2))
        });
        // Sets node type to queued.
        nodes[n[0]][n[1]] = 4;
        addClassToCell(n[0], n[1], "queued");
        // Sets parent and cost of the node.
        let nodeKey = `${n[0]},${n[1]}`;
        let parentKey = `${node[0]},${node[1]}`;
        if (!path.hasOwnProperty(nodeKey) || path[parentKey].cost + 1 < path[nodeKey].cost)
            setParentCost(path, nodeKey, parentKey, path[parentKey].cost + 1);
    });
}

// Finds the nodes creating the path between the two specified nodes.
function getPathBetween(path, start, end) {
    // Starts from the end node and goes up to each parent until it finds the start node.
    let curr = `${end[0]},${end[1]}`;
    let finalPath = [];
    while (curr != `${start[0]},${start[1]}`) {
        let info  = curr.split(",");
        finalPath.push([parseInt(info[0]), parseInt(info[1])]);
        curr = path[curr].parent;
    }
    // Adds the start node because the loop terminates before it is added.
    finalPath.push([start[0], start[1]]);
    return finalPath.reverse(); // Returns the reversed path so that it is in-order (start to end).
}

// Draws the final shortest path between the start and end nodes.
async function drawPath(path) {
    while (path.length > 0) {
        await timeout(5); // Timeout for animation.
        let currNode = path.shift(); // Finds the node at the top of the queue.
        addClassToCell(currNode[0], currNode[1], "path"); // Colors the node to indicate that it is part of the final path.
    }
    isInEndPhase = true; // Sets system flag.
}

// Initializes system variables.
init();
// Generates the HTML tables that forms the grid.
generateGrid(document.querySelector(TABLE_QUERY));

// Event listener for the start button.
document.querySelector("#start-button").addEventListener("click", () => {
    if (isInEndPhase) // If visualization had already ended, then reset the grid and the system variables.
        reset();
    // Sort the path locations according to their distance from the start node.
    pathLocations.sort(function(a,b) {
        var firstDist = Math.pow((start_node[1] - a[1]), 2) + Math.pow((start_node[0] - a[0]), 2);
        var secDist = Math.pow((start_node[1] - b[1]), 2) + Math.pow((start_node[0] - b[0]), 2);
        return firstDist - secDist;
    });
    // Find the shortest path.
    findEndNode(start_node[0], start_node[1], []);
});

// Event listener for the reset button.
document.querySelector("#reset-button").addEventListener("click", () => {
    reset();
});