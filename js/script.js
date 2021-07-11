/*
     KEY
    0 - unvisited
    1 - visited
    2 - start node
    3 - end node
    4 - queued
    5 - blocked
*/

const NUMBER_OF_NODES = 1000;
const NODES_PER_ROW = 50;
const NUMBER_OF_ROWS = NUMBER_OF_NODES / NODES_PER_ROW;
const TABLE_QUERY = '#grid-container table';
var end_node = [NUMBER_OF_ROWS - 2, NODES_PER_ROW - 2];
var start_node = [1, 1];
var isReset = false;

// initializing nodes array
var nodes;

// initializing array
function init() {
    nodes = Array.from({ length: NUMBER_OF_ROWS }, () => 
        Array.from({ length: NODES_PER_ROW }, () => 0)
    );
    end_node = [NUMBER_OF_ROWS - 2, NODES_PER_ROW - 2];
    start_node = [1, 1];
    nodes[start_node[0]][start_node[1]] = 2; // start node
    nodes[NUMBER_OF_ROWS - 2][NODES_PER_ROW - 2] = 3; // end node
}

// handles a node click event
function nodeClickHandler(e) {
    if (!e.target.classList.contains("blocked-node")) {
        let row = e.target.parentNode.rowIndex;
        let col = e.target.cellIndex;
        if (nodes[row][col] == 2 || nodes[row][col] == 3)
            return;
        if (e.ctrlKey) {
            removeClassFromCell(start_node[0], start_node[1], "start-node");
            nodes[start_node[0]][start_node[1]] = 0;
            nodes[row][col] = 2;
            start_node = [row, col];
            addClassToCell(row, col, "start-node");
        } else if (e.shiftKey) {
            removeClassFromCell(end_node[0], end_node[1], "end-node");
            nodes[end_node[0]][end_node[1]] = 0;
            nodes[row][col] = 3;
            end_node = [row, col];
            addClassToCell(row, col, "end-node");
        } else {
            nodes[row][col] = 5;
            e.target.classList.add("blocked-node");
        }
    }
}

// grid generation
function generateGrid(table) {
    for (let i = 0; i < NUMBER_OF_ROWS; i++) {
        let row = table.insertRow();
        for (let j = 0; j < NODES_PER_ROW; j++) {
            let cell = row.insertCell();   
            if (nodes[i][j] == 2) {
                cell.classList.add("start-node");
            } else if (nodes[i][j] == 3) {
                cell.classList.add("end-node");
            }
            cell.addEventListener("click", e => nodeClickHandler(e))
            cell.addEventListener("mouseover", e => {
                if (e.buttons == 1)
                    nodeClickHandler(e);
            });
        }
    }
}

// reset the grid
function reset() {
    isReset = true;
    let cells = document.getElementById("grid-container").getElementsByTagName("td");
    for (let cell of cells) {
        cell.classList = [];
    }
    init();
    addClassToCell(start_node[0], start_node[1], "start-node");
    addClassToCell(NUMBER_OF_ROWS - 2, NODES_PER_ROW - 2, "end-node");
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

function removeClassFromCell(row, col, clazz) {
    let cell = document.querySelector(TABLE_QUERY).rows[row].cells[col];
    cell.className = cell.className.replace(new RegExp('(?:^|\\s)'+ clazz + '(?:\\s|$)'), ' ');
}

function addClassToCell(row, col, clazz) {
    document.querySelector(TABLE_QUERY).rows[row].cells[col].classList.add(clazz);
}

// marks node as visited
function setVisited(row, col) {
    nodes[row][col] = 1;
    addClassToCell(row, col, "visited");
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// sets the parent and the cost of the specified node
function setParentCost(path, node, _parent, _cost) {
    path[node] = {
        parent: _parent,
        cost: _cost
    }
}

// finds the shortest path to the end node
async function findEndNode(startRow, startCol) {
    if (isReset)
        isReset = false;
    let path = {};
    path[`${startRow},${startCol}`] = {
        parent: null,
        cost: 0
    };
    let queue = [];
    queue.push([startRow, startCol]);
    while (queue.length > 0) {
        await timeout(10);
        if (isReset)
            break;
        let node = queue.shift();
        if (node[0] == end_node[0] && node[1] == end_node[1])
            break;
        setVisited(node[0], node[1]);
        handleNeighbours(node, queue, path);
    }
    if (!isReset) {
        drawPath(path);
    }
}

// adds neighbours to queue to be processed and calculates their costs
function handleNeighbours(node, queue, path) {
    getNeighbours(node[0], node[1]).forEach(n => {
        queue.push(n);
        nodes[n[0]][n[1]] = 4;
        addClassToCell(n[0], n[1], "queued");
        let nodeKey = `${n[0]},${n[1]}`;
        let parentKey = `${node[0]},${node[1]}`;
        if (!path.hasOwnProperty(nodeKey) || path[parentKey].cost + 1 < path[nodeKey].cost)
            setParentCost(path, nodeKey, parentKey, path[parentKey].cost + 1);
    });
}

// draws the final shortest path between the start and end nodes
async function drawPath(path) {
    let curr = `${end_node[0]},${end_node[1]}`;
    let finalPath = [];
    while (curr != null) {
        let info  = curr.split(",");
        finalPath.push([parseInt(info[0]), parseInt(info[1])]);
        curr = path[curr].parent;
    }

    while (finalPath.length > 0) {
        await timeout(5);
        let node = finalPath.pop();
        addClassToCell(node[0], node[1], "path");
    }
}

init();
generateGrid(document.querySelector(TABLE_QUERY));

document.querySelector("#start-button").addEventListener("click", () => {
    findEndNode(start_node[0], start_node[1]);
});

document.querySelector("#reset-button").addEventListener("click", () => {
    reset();
});