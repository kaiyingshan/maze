
function createMaze() {
    const n = parseInt(document.getElementById('rows').value);
    if (n < 2) {
        alert('Bad input. DID YOU READ THE NOTE??');
    }
    // initiate n * n nodes;
    let adjList = new Array(n * n);

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
    const record = new Array(n * n);
    record.fill(new Set());

    // pick a random node
    const start = Math.floor(Math.random() * n * n) % (n * n);

    // set of known nodes; won't stop until its size is n * n
    let knownNodes = new Set([start]);
    console.time('spanning tree generation');
    // set of candidate vertex
    while (knownNodes.size !== n * n) {
        const knowns = Array.from(knownNodes.keys());
        // let idx1 = Math.floor(Math.random() * knowns.length) % knowns.length; //possible optimization; use .next().value()
        let chosenNode = knowns[Math.floor(Math.random() * knowns.length) % knowns.length];
        let adj = adjList[chosenNode];
        let next = adj[Math.floor(Math.random() * adj.length) % adj.length];

        let counter = 0;
        while (knownNodes.has(next)) {
            chosenNode = knowns[Math.floor(Math.random() * knowns.length) % knowns.length];
            adj = adjList[chosenNode];
            next = adj[Math.floor(Math.random() * adj.length) % adj.length];
            counter++;
            if (counter === knownNodes.size) { // this is not possible... but still want to ensure
                break;
            }
        }
        const tempArr = Array.from(record[chosenNode].keys());
        tempArr.push(next);
        record[chosenNode] = new Set(tempArr);
        const tempArr2 = Array.from(record[next].keys())
        tempArr2.push(chosenNode);
        record[next] = new Set(tempArr2);
        knownNodes.add(next);
    }
    console.timeEnd('spanning tree generation');
    // draw on canvas based on record;
    const t = 500 / n;
    let x = 0;
    let y = 0;

    console.time('render');
    let ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, document.getElementById('canvas').width, document.getElementById('canvas').height);
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
            if (!record[i].has(i + n)) {
                ctx.lineTo(x - t, y);
            }
            ctx.moveTo(t, y + t);
            x = t;
            y += t;
        } else if (i >= n * (n - 1)) { // if bottom
            if (!record[i].has(i + 1)) {
                ctx.lineTo(x, y - t);
            }
            ctx.moveTo(x + t, y);
            x += t;
        } else {
            if (!record[i].has(i + n)) {
                ctx.lineTo(x - t, y);
            }
            ctx.moveTo(x, y);
            if (!record[i].has(i + 1)) {
                ctx.lineTo(x, y - t);
            }
            ctx.moveTo(x + t, y);
            x += t;
        }
    }
    ctx.stroke();
    console.timeEnd('render');
    return record;
}