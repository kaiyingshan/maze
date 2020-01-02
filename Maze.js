class Maze{
    constructor(n, colored, shape, shapeSize, muskFunc){
        this.N = n;
        this.record = null,
        this.shapeSize = shapeSize;
        this.colorRecord = null;
        this.colored = colored,
        this.shape = shape, // square, heart, musk
        this.ratio = null,
        this.offset = null,
        this.start = null,
        this.muskFunc = muskFunc;

        // game information
        this.onGame = false;
        this.gameRecord = null;
        this.curSquare = 0;
        this.startSquare = 0;
        this.endSquare = 0;

        this.createMaze();
    }

    neighbors(i){
        const n = this.N;
        // if four corner
        switch(i){
            case 0:
                return [1, n];
            case n - 1:
                return [i - 1, i + n];
            case n * (n - 1):
                return [i - n, i + 1];
            case n * n - 1:
                return [i - n, i - 1];
        }

        if(i < n){
            return [i - 1, i + 1, i + n];
        } else if (i % n === 0){
            return [i - n, i + 1, i + n];
        } else if ((i + 1) % n === 0){
            return [i - n, i - 1, i + n];
        } else if (i > n * (n - 1)){
            return [i - 1, i - n, i + 1];
        }else{
            return [i - 1, i + n, i + 1, i - n];
        }
    }

    // todo: make adj list according to musk function
    makeAdjList(neigh){
        const result = [];
        for (let i = 0; i < neigh.length; i++) {
            if (this.muskFunc(neigh[i], this.N, this.ratio, this.offset)) {
                result.push(neigh[i]);
            }
        }
        return result;
    }

    createMaze(){
        const n = this.N;
        const ratio = (((100 - this.shapeSize) / 50) ** 0.7 * 3.5) / n;
        const offset = n / 2;
        this.ratio = ratio;
        this.offset = offset;

        const adjList = new Array(n * n);

        let counter = 0;
        // create adjacency list
        if(this.shape === 'square'){
            for(let i = 0; i < n * n; i++){
                adjList[i] = this.neighbors(i);
            }
            counter = n * n;
        }else{
            for (let i = 0; i < n * n; i++) {
                if(!this.muskFunc(i, n, ratio, offset)){
                    adjList[i] = [];
                    continue;
                }
                counter++;
                adjList[i] =  this.makeAdjList(this.neighbors(i));     
            }
        }

        // a new adjacency node for querying connected edges
        const record = [];
        for (let i = 0; i < n * n; i++) {
            record[i] = [-1, -1, -1, -1];
        }

        // pick a random node
        let start = Math.floor(Math.random() * n * n) % (n * n);

        while(this.shape !== 'square' && !this.muskFunc(start, n, ratio, offset)){
            start = Math.floor(Math.random() * n * n) % (n * n);
        }

        const knowns = [start];
        const knownNodes = new Uint8Array(n * n);
        knownNodes[start] = 1;
        let treeCounter = 1;

        console.time('spanning tree generation');
        while (treeCounter !== counter) {
            let chosenNode = knowns[Math.floor(Math.random() * treeCounter)];
            let adj = adjList[chosenNode];
            let next = adj[Math.floor(Math.random() * adj.length)];

            while (knownNodes[next]) {
                chosenNode = knowns[Math.floor(Math.random() * treeCounter)];
                adj = adjList[chosenNode];
                next = adj[Math.floor(Math.random() * adj.length)];
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
            knownNodes[next] = 1;
            knowns.push(next);
            treeCounter++;
        }
        console.timeEnd('spanning tree generation');

        this.record = record;
        this.start = start;
    }

    static RGB(rgbColor) {
        let rgb = rgbColor;
        while (rgb.length < 7) {
            rgb += '0';
        }
        const r = parseInt(rgb.substring(1, 3), 16);
        const g = parseInt(rgb.substring(3, 5), 16);
        const b = parseInt(rgb.substring(5, 7), 16);
        return [r, g, b];
    }

    renderColor(ctx, colorOption, colors){
        if(colors.length === 1 && this.shape === 'square'){
            const [r, g, b] = Maze.RGB(colors[0]);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(0, 0, meta.width, meta.height);
        }
    }

    render(ctx){
        ctx.clearRect(0, 0, meta.width, meta.height);
        const n = this.N, record = this.record;
        const ratio = this.ratio, offset = this.offset;
        const t = 700 / n;
        let x = 0, y = 0;

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(x + t, y + t);
        x += t;
        y += t;
        // every time move to the right bottom of its next cell and set the value
        for (let i = 0; i < n * n; i++) {
            if (this.shape !== 'square' && this.muskFunc(i, n, ratio, offset)) {
                ctx.moveTo(x - t, y - t);
                if (!this.muskFunc(i - 1, n, ratio, offset)) {
                    ctx.lineTo(x - t, y);
                }
                ctx.moveTo(x - t, y - t);
                if (!this.muskFunc(i - n, n, ratio, offset)) {
                    ctx.lineTo(x, y - t);
                }
                ctx.moveTo(x, y);
            }
            // if right and bottom
            if ((i + 1) % n === 0 && i >= n * (n - 1)) {
                continue;
            } else if ((i + 1) % n === 0) { // if right
                if (record[i].indexOf(i + n) === -1
                    && (this.shape === 'square' || this.muskFunc(i, n, ratio, offset))) {
                    ctx.lineTo(x - t, y);
                }
                ctx.moveTo(t, y + t);
                x = t;
                y += t;
            } else if (i >= n * (n - 1)) { // if bottom
                if (record[i].indexOf(i + 1) === -1
                    && (this.shape === 'square' || this.muskFunc(i, n, ratio, offset))) {
                    ctx.lineTo(x, y - t);
                }
                ctx.moveTo(x + t, y);
                x += t;
            } else {
                if (record[i].indexOf(i + n) === -1
                    && (this.shape === 'square' || this.muskFunc(i, n, ratio, offset))) {
                    ctx.lineTo(x - t, y);
                }
                ctx.moveTo(x, y);
                if (record[i].indexOf(i + 1) === -1
                    && (this.shape === 'square' || this.muskFunc(i, n, ratio, offset))) {
                    ctx.lineTo(x, y - t);
                }
                ctx.moveTo(x + t, y);
                x += t;
            }
        }
        ctx.stroke();
        if (this.shape === 'square') {
            ctx.beginPath();
            ctx.moveTo(0, t);
            ctx.lineTo(0, 700);
            ctx.lineTo(700, 700);
            ctx.moveTo(700, 700 - t);
            ctx.lineTo(700, 0);
            ctx.lineTo(0, 0);
            ctx.stroke();
        }
    }
}

function insideHeartCurve(i, n, ratio, offset) {
    const x = ((i % n) - offset) * ratio;
    const y = -1 * (Math.floor(i / n) - offset) * ratio;
    return (((x ** 2) + (y ** 2) - 1) ** 3) - (x ** 2) * (y ** 3) < 0;
}

const meta = {
    width: 700,
    height: 700,
    created: false
}

function initiate() {
    const ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, meta.width, meta.height);
    ctx.font = '96px serif';
    ctx.strokeText('Create your maze', 50, 400, 500);
    ctx.strokeRect(0, 0, 700, 700);

    // $('#sizeRange').hide();
    $('#addColor').show();
    $('#winMessage').hide();
}

function createMaze(){
    const n = parseInt(document.getElementById('rows').value);
    const shapes = document.getElementsByName('shape');
    const shape = shapes[0].checked ? 'square' : shapes[1].checked ? 
                'heart' : 'arbitrary';
    const size = parseInt(document.getElementById('heartSizeRange').value);

    let func;
    if(shape === 'heart'){
        func = insideHeartCurve;
    }

    const maze = new Maze(n, false, shape, size, func);
    const ctx = document.getElementById('canvas').getContext('2d');
    maze.render(ctx, 0, []);

    meta.created = true;
}

window.onload = initiate;
