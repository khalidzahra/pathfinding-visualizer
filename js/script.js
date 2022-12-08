/*
     KEY
    0 - unvisited
    1 - visited
    2 - start node
    3 - end node
    4 - queued
    5 - blocked
    6 - location
*/

const NUMBER_OF_NODES = 1000, NODES_PER_ROW = 50, NUMBER_OF_ROWS = NUMBER_OF_NODES / NODES_PER_ROW;
const TABLE_QUERY = '#grid-container table';
var start_node, end_node, pathLocations;
var isReset = false, isDragging = false, hasStarted = false, isInEndPhase = false;

// declaring nodes array
var nodes;

// initializing all variables
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

// handles a node click event
function nodeClickHandler(e) {
    if (!e.target.classList.contains("blocked-node")) {
        if (isDragging || hasStarted)
            return;
        let row = e.target.parentNode.rowIndex;
        let col = e.target.cellIndex;
        if (nodes[row][col] !== 0)
            return;
        if (e.shiftKey) {
            nodes[row][col] = 6;
            e.target.classList.add("location-node");
            pathLocations.push([row, col]);
        } else {
            nodes[row][col] = 5;
            e.target.classList.add("blocked-node");
        }
    } 
}

// adds required listeners to support draggable nodes
function addDragListeners() {
    // listeners for each cell
    document.querySelectorAll("td").forEach(cell => {
        // the beginning of dragging
        cell.addEventListener("dragstart", e => {
            if (!hasStarted && cell.draggable && !isInEndPhase) {
                isDragging = true;
                e.dataTransfer.setData("text/plain", cell.classList[0]);
                e.dataTransfer.setData("boolean", true);
            }
        });
        // when dragging over the cell
        cell.addEventListener("dragover", e => {
            e.preventDefault();
            if (e.dataTransfer.getData("boolean") && !isInEndPhase && !hasStarted)
                cell.classList.add("drag-over");
        });
        // when cursor leaves the cell while dragging
        cell.addEventListener("dragleave", e => removeClassFromCell(cell.parentNode.rowIndex, cell.cellIndex, "drag-over"));
        // when dropping the image into the cell
        cell.addEventListener("drop", e => {
            e.preventDefault();
            let isNode = e.dataTransfer.getData("boolean");
            let data = e.dataTransfer.getData("text/plain");
            if (isNode && data != null && !e.target.classList.contains("blocked-node") && !hasStarted && !isInEndPhase) {
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
                cell.classList.add(data);
                setCellDraggable(cell, true);
            }
            removeClassFromCell(cell.parentNode.rowIndex, cell.cellIndex, "drag-over");
            isDragging = false;
        });
    });

}

// grid generation
function generateGrid(table) {
    for (let i = 0; i < NUMBER_OF_ROWS; i++) {
        let row = table.insertRow();
        row.draggable = false;
        for (let j = 0; j < NODES_PER_ROW; j++) {
            let cell = row.insertCell();   
            if (nodes[i][j] == 2) {
                cell.classList.add("start-node");
                setCellDraggable(cell, true);
            } else if (nodes[i][j] == 3) {
                cell.classList.add("end-node");
                setCellDraggable(cell, true);
            }
            cell.addEventListener("click", e => nodeClickHandler(e))
            cell.addEventListener("mouseover", e => {
                if (e.buttons == 1)
                    nodeClickHandler(e);
            });
        }
    }
    addDragListeners();
}

// reset the grid
function reset() {
    isReset = true;
    isInEndPhase = false;
    let cells = document.getElementById("grid-container").getElementsByTagName("td");
    for (let cell of cells) {
        cell.classList = [];
    }
    init();
    addClassToCell(start_node[0], start_node[1], "start-node");
    addClassToCell(end_node[0], end_node[1], "end-node");
}

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

function canBeTraveresed(row, col) {
    return !(nodes[row][col] == 1 || nodes[row][col] == 4 || nodes[row][col] == 5);
}

// returns node's immediate neighbours
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

function getCell(row, col) {
    return document.querySelector(TABLE_QUERY).rows[row].cells[col];
}

function removeClassFromCell(row, col, clazz) {
    let cell = document.querySelector(TABLE_QUERY).rows[row].cells[col];
    cell.className = cell.className.replace(new RegExp('(?:^|\\s)'+ clazz + '(?:\\s|$)'), ' ');
}

function addClassToCell(row, col, clazz) {
    document.querySelector(TABLE_QUERY).rows[row].cells[col].classList.add(clazz);
}

function setCellDraggable(cell, draggable) {
    cell.draggable = draggable;
}

// marks node as visited
function setVisited(row, col) {
    nodes[row][col] = 1;
    addClassToCell(row, col, "visited");
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// selects cost function to use
function calculateCost(node, f) {
    if (f == "cost") {
        return node.cost;
    } else if (f == "heuristic") {
        node.heuristic;
    } else {
        return node.cost + node.heuristic;
    }
}

// priority queue implementation
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

// sets the parent and the cost of the specified node
function setParentCost(path, node, _parent, _cost) {
    path[node] = {
        parent: _parent,
        cost: _cost
    }
}

// finds the shortest path to the end node
async function findEndNode(startRow, startCol, finalPath) {
    if (isReset)
        isReset = false;
    hasStarted = true;
    let path = {};
    path[`${startRow},${startCol}`] = {
        parent: null,
        cost: 0,
        heuristic: Math.sqrt(Math.pow(startRow - end_node[0], 2) + Math.pow(startCol - end_node[1], 2))
    };
    let queue = new PriorityQueue("f");
    queue.push({
        pos: [startRow, startCol],
        cost: path[`${startRow},${startCol}`].cost,
        heuristic: path[`${startRow},${startCol}`].heuristic
    });
    let targetNode;
    if (pathLocations.length > 0) {
        targetNode = pathLocations.shift();
    } else {
        targetNode = end_node;
    }
    while (queue.length() > 0) {
        await timeout(10);
        if (isReset)
            break;
        let node = queue.pop();
        node = node.pos;
        if (node[0] == targetNode[0] && node[1] == targetNode[1]) {
            finalPath = finalPath.concat(getPathBetween(path, [startRow, startCol], targetNode));
            if (targetNode != end_node) {
                softReset();
                findEndNode(targetNode[0], targetNode[1], finalPath);
            } else {
                softReset();
                drawPath(finalPath);
            }
            break;
        }
        setVisited(node[0], node[1]);
        handleNeighbours(node, queue, path);
    }
    hasStarted = false;
}

// adds neighbours to queue to be processed and calculates their costs
function handleNeighbours(node, queue, path) {
    getNeighbours(node[0], node[1]).forEach(n => {
        queue.push({
            pos: [n[0], n[1]],
            cost: 0,
            heuristic: Math.sqrt(Math.pow(n[0] - end_node[0], 2) + Math.pow(n[1] - end_node[1], 2))
        });
        nodes[n[0]][n[1]] = 4;
        addClassToCell(n[0], n[1], "queued");
        let nodeKey = `${n[0]},${n[1]}`;
        let parentKey = `${node[0]},${node[1]}`;
        if (!path.hasOwnProperty(nodeKey) || path[parentKey].cost + 1 < path[nodeKey].cost)
            setParentCost(path, nodeKey, parentKey, path[parentKey].cost + 1);
    });
}

function getPathBetween(path, start, end) {
    let curr = `${end[0]},${end[1]}`;
    let finalPath = [];
    while (curr != `${start[0]},${start[1]}`) {
        let info  = curr.split(",");
        finalPath.push([parseInt(info[0]), parseInt(info[1])]);
        curr = path[curr].parent;
    }
    finalPath.push([start[0], start[1]]);
    return finalPath.reverse();
}

// draws the final shortest path between the start and end nodes
async function drawPath(path) {
    while (path.length > 0) {
        await timeout(5);
        let currNode = path.shift();
        addClassToCell(currNode[0], currNode[1], "path");
    }
    isInEndPhase = true;
}

init();
generateGrid(document.querySelector(TABLE_QUERY));

document.querySelector("#start-button").addEventListener("click", () => {
    if (isInEndPhase)
        reset();
    pathLocations.sort(function(a,b) {
        var firstDist = Math.pow((start_node[1] - a[1]), 2) + Math.pow((start_node[0] - a[0]), 2);
        var secDist = Math.pow((start_node[1] - b[1]), 2) + Math.pow((start_node[0] - b[0]), 2);
        return firstDist - secDist;
    });
    findEndNode(start_node[0], start_node[1], []);
});

document.querySelector("#reset-button").addEventListener("click", () => {
    reset();
});