
function initiate() {
    const ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, document.getElementById('canvas').width, document.getElementById('canvas').height);
    ctx.font = '96px serif';
    ctx.strokeText('Create your maze', 50, 250, 400);
}

// acknowledgement: this function is derived from an article on CSS tricks
function RGBtoHSL(rgbColor) {
    let rgb = rgbColor;
    while (rgb.length < 7) {
        rgb += '0';
    }
    let r = parseInt(rgb.substring(1, 3), 16);
    let g = parseInt(rgb.substring(3, 5), 16);
    let b = parseInt(rgb.substring(5, 7), 16);
    // Make r, g, and b fractions of 1
    r /= 255;
    g /= 255;
    b /= 255;

    // Find greatest and smallest channel values
    const cmin = Math.min(r, g, b);
    const cmax = Math.max(r, g, b);
    const delta = cmax - cmin;
    let h = 0;
    let s = 0;
    let l = 0;

    if (delta === 0) { h = 0; }
    // Red is max
    else if (cmax === r) { h = ((g - b) / delta) % 6; }
    // Green is max
    else if (cmax === g) { h = (b - r) / delta + 2; }
    // Blue is max
    else { h = (r - g) / delta + 4; }

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0) { h += 360; }

    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return [h, s, l];
}

// eslint-disable-next-line no-unused-vars
function createMaze(colored, color) {
    const n = parseInt(document.getElementById('rows').value, 10);
    if (n < 2) {
        alert('DID YOU READ THE NOTE??');
        return 0;
    }
    // initiate n * n nodes;
    const adjList = new Array(n * n);

    // create adjacency list
    for (let i = 0; i < n * n; i++) {
        // 9 situations
        if (i === 0) { // left top
            adjList[i] = [1, n];
        } else if (i === n - 1) { // right top
            adjList[i] = [i - 1, i + n];
        } else if (i === n * (n - 1)) { // left bottom
            adjList[i] = [i - n, i + 1];
        } else if (i === n * n - 1) { // right bottom
            adjList[i] = [i - n, i - 1];
        } else if (i < n) { // first row
            adjList[i] = [i - 1, i + 1, i + n];
        } else if (i % n === 0) { // left col
            adjList[i] = [i - n, i + 1, i + n];
        } else if ((i + 1) % n === 0) { // right col
            adjList[i] = [i - n, i - 1, i + n];
        } else if (i > n * (n - 1)) { // bottom row
            adjList[i] = [i - 1, i - n, i + 1];
        } else {
            adjList[i] = [i - 1, i + n, i + 1, i - n];
        }
    }

    // a new adjacency node for querying connected edges
    const record = [];
    for (let i = 0; i < n * n; i++) {
        record[i] = [-1, -1, -1, -1];
    }

    // pick a random node
    const start = Math.floor(Math.random() * n * n) % (n * n);

    // set of known nodes; won't stop until its size is n * n
    const knownNodes = new Set([start]);
    console.time('spanning tree generation');
    // set of candidate vertex
    while (knownNodes.size !== n * n) {
        const knowns = Array.from(knownNodes.keys());
        let chosenNode = knowns[Math.floor(Math.random() * knowns.length) % knowns.length];
        let adj = adjList[chosenNode];
        let next = adj[Math.floor(Math.random() * adj.length) % adj.length];

        while (knownNodes.has(next)) {
            chosenNode = knowns[Math.floor(Math.random() * knowns.length) % knowns.length];
            adj = adjList[chosenNode];
            next = adj[Math.floor(Math.random() * adj.length) % adj.length];
        }

        for (let i = 0; i < 4; i++) {
            if (record[chosenNode][i] === -1) {
                record[chosenNode][i] = next;
                break;
            }
        }
        for (let i = 0; i < 4; i++) {
            if (record[next][i] === -1) {
                record[next][i] = chosenNode;
                break;
            }
        }
        knownNodes.add(next);
    }
    console.timeEnd('spanning tree generation');
    // draw on canvas based on record;
    const t = 500 / n;
    let x = 0;
    let y = 0;

    console.time('render');
    const ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, document.getElementById('canvas').width, document.getElementById('canvas').height);

    if (colored) {
        const delta = 100 / n;
        const h = color[0];
        const s = color[1];
        let l = color[2];
        const originalL = l;

        const stack = [start];
        const visited = new Array(n * n);
        visited.fill(false);
        let curNode = start;

        while (stack.length !== 0) {
            curNode = stack.pop();
            visited[curNode] = true;
            stack.push(...(record[curNode].filter(cur => cur !== -1 && (!visited[cur]))));
            ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
            ctx.fillRect((curNode % n) * t, Math.floor(curNode / n) * t, t, t);
            l += delta;
            if (l > 100) {
                l = originalL;
            }
        }
    }

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(x + t, y + t);
    x += t;
    y += t;
    // every time move to the right bottom of its next cell and set the value
    for (let i = 0; i < n * n; i++) {
        // if right and bottom
        if ((i + 1) % n === 0 && i >= n * (n - 1)) {
            continue;
        } else if ((i + 1) % n === 0) { // if right
            if (record[i].indexOf(i + n) === -1) {
                ctx.lineTo(x - t, y);
            }
            ctx.moveTo(t, y + t);
            x = t;
            y += t;
        } else if (i >= n * (n - 1)) { // if bottom
            if (record[i].indexOf(i + 1) === -1) {
                ctx.lineTo(x, y - t);
            }
            ctx.moveTo(x + t, y);
            x += t;
        } else {
            if (record[i].indexOf(i + n) === -1) {
                ctx.lineTo(x - t, y);
            }
            ctx.moveTo(x, y);
            if (record[i].indexOf(i + 1) === -1) {
                ctx.lineTo(x, y - t);
            }
            ctx.moveTo(x + t, y);
            x += t;
        }
    }
    ctx.stroke();
    console.timeEnd('render');

    return 0;
}

// eslint-disable-next-line no-unused-vars
function preprocess() {
    const radios = document.getElementsByName('color');
    let colored = false;
    if (radios[0].checked) {
        colored = true;
    }

    if (colored) {
        const color = RGBtoHSL(document.getElementById('colorInput').value);
        createMaze(true, color);
    } else {
        createMaze(false);
    }
}

// eslint-disable-next-line no-unused-vars
function showAndHide() {
    const radios = document.getElementsByName('color');
    if (radios[0].checked) {
        $('#colorInput').show();
    } else {
        $('#colorInput').hide();
    }
}


window.onload = initiate();
