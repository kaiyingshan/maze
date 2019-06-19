
// 别看了，写得可烂了 ￣へ￣

const colors = [document.getElementById('colorInput')];

const ctx = document.getElementById('canvas').getContext('2d');

let colorRecord;

let gameRecord;

let cacheObj = {
    record: '',
    colored: '',
    heartShaped: '',
    consts: '',
    start: '',
    n: '',
};

let created = false;

let onGame = false;

let curSquare = 0;

let startSquare = 0;

let endSquare = 0;

let pacMan = new Image();

pacMan.src = '../assets/1.png';

$("#pics").hide();

function initiate() {
    // const ctx = document.getElementById('canvas').getContext('2d');
    ctx.clearRect(0, 0, document.getElementById('canvas').width, document.getElementById('canvas').height);
    ctx.font = '96px serif';
    ctx.strokeText('Create your maze', 50, 400, 500);
    ctx.strokeRect(0, 0, 700, 700);
    document.getElementById('heartShaped').checked = false;
    $('#sizeRange').hide();
    $('#addColor').show();
    $('#winMessage').hide();
    created = false;
    onGame = false;
    curSquare = 0;
    startSquare = 0;
    endSquare = 0;
}

function RGB(rgbColor) {
    let rgb = rgbColor;
    while (rgb.length < 7) {
        rgb += '0';
    }
    const r = parseInt(rgb.substring(1, 3), 16);
    const g = parseInt(rgb.substring(3, 5), 16);
    const b = parseInt(rgb.substring(5, 7), 16);
    return [r, g, b];
}

/**
 * acknowledgement: referred to https://css-tricks.com/
 * converting-color-spaces-in-javascript/
 */
function HSL(rgbColor) {
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

    if (delta === 0) h = 0;
    // Red is max
    else if (cmax === r) h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax === g) h = (b - r) / delta + 2;
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

function insideHeartCurve(i, n, ratio, offset, eqX, eqY) {
    const x = ((i % n) - offset) * ratio;
    const y = -1 * (Math.floor(i / n) - offset) * ratio;
    return (((x ** 2) + (y ** 2) - 1) ** 3) - (x ** 2) * (y ** 3) < 0;
}

function makeAdjList(rawList, n, ratio, offset, eqX, eqY) {
    const result = [];
    for (let i = 0; i < rawList.length; i++) {
        if (insideHeartCurve(rawList[i], n, ratio, offset, eqX, eqY)) {
            result.push(rawList[i]);
        }
    }
    return result;
}


function addColor() {
    $('#colorBoard').append(`<div id="b${colors.length}" class="mb-1">
    <input onchange="if(created){render();}" class="moreColor" id="c${colors.length}" type="color"> Choose color
    <button class="close" onclick="deleteColor(${colors.length});if(created){render()}">&times;</button>
    </div>`);
    colors.push(document.getElementById(`c${colors.length}`));
}


function deleteColor(index) {
    for (let i = index; i < colors.length - 1; i++) {
        colors[i].value = colors[i + 1].value;
    }
    $(`#b${colors.length - 1}`).remove();
    colors.pop();
}

/**
 * TODO: Change colorspace to RGB
 */
function render() {
    document.getElementById('playBtn').innerHTML = 'Press to start game';
    const {
        record, colored, heartShaped, consts, start, n,
    } = cacheObj;
    // const color = RGB(document.getElementById('colorInput').value);
    const color = [];
    const options = document.getElementsByName('option');
    const option = options[0].checked ? 1 : 2;
    for (let i = 0; i < colors.length; i++) {
        color.push(option === 1 ? RGB(colors[i].value) : HSL(colors[i].value));
    }
    let colorCounter = 0;
    const cl = colors.length;
    const t = 700 / n;
    let x = 0;
    let y = 0;
    ctx.clearRect(0, 0, document.getElementById('canvas').width, document.getElementById('canvas').height);
    colorRecord = new Array(n * n);
    colorRecord.fill(['rgb', 255, 255, 255]);
    console.time('render');
    if (colored) {
        const mul = parseInt(document.getElementById('colorRange').value, 10);
        // const delta = mul * 2 / n;

        let [h, s, l] = color[0];

        let deltaH = mul * (color[(colorCounter + 1) % cl][0] - h) / (n * 25);
        let deltaS = mul * (color[(colorCounter + 1) % cl][1] - s) / (n * 25);
        let deltaL;
        const originalL = l;
        if (option === 1) {
            deltaL = mul * (color[(colorCounter + 1) % cl][2] - l) / (n * 25);
        } else {
            deltaL = mul * (100 - l) / (n * 25);
        }


        const stack = [start];
        const visited = new Array(n * n);
        visited.fill(false);
        let curNode = start;

        while (stack.length !== 0) {
            curNode = stack.pop();
            visited[curNode] = true;
            stack.push(...(record[curNode].filter(cur => cur !== -1 && (!visited[cur]))));
            // eslint-disable-next-line no-nested-ternary
            ctx.fillStyle = option === 1 ? `rgb(${h}, ${s}, ${l})` : option === 2 ? `hsl(${h}, ${s}%, ${l}%)` : '';
            colorRecord[curNode] = [option === 1 ? 'rgb' : 'hsl', h, s, l];
            ctx.fillRect((curNode % n) * t - 1, Math.floor(curNode / n) * t - 1, t + 1, t + 1);
            if (option === 1) {
                h += deltaH;
                s += deltaS;
            }
            l += deltaL;
            if ((option === 1) && ((
                (deltaH <= 0 && h <= color[(colorCounter + 1) % cl][0])
                || (deltaH >= 0 && h >= color[(colorCounter + 1) % cl][0])
            ) || ((deltaS <= 0
                && s <= color[(colorCounter + 1) % cl][1])
                || (deltaS >= 0
                    && s >= color[(colorCounter + 1) % cl][1])
            ) || ((deltaL <= 0
                    && l <= color[(colorCounter + 1) % cl][2])
                    || (deltaL >= 0
                        && l >= color[(colorCounter + 1) % cl][2])
            ))) {
                colorCounter = (colorCounter + 1) % cl;
                deltaH = mul * (color[(colorCounter + 1) % cl][0] - h) / (n * 25);
                deltaS = mul * (color[(colorCounter + 1) % cl][1] - s) / (n * 25);
                deltaL = mul * (color[(colorCounter + 1) % cl][2] - l) / (n * 25);
            }

            if ((option === 2) && (l > 100)) {
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
        if (heartShaped && insideHeartCurve(i, ...consts)) {
            ctx.moveTo(x - t, y - t);
            if (!insideHeartCurve(i - 1, ...consts)) {
                ctx.lineTo(x - t, y);
            }
            ctx.moveTo(x - t, y - t);
            if (!insideHeartCurve(i - n, ...consts)) {
                ctx.lineTo(x, y - t);
            }
            ctx.moveTo(x, y);
        }
        // if right and bottom
        if ((i + 1) % n === 0 && i >= n * (n - 1)) {
            continue;
        } else if ((i + 1) % n === 0) { // if right
            if (record[i].indexOf(i + n) === -1
                && (!heartShaped || insideHeartCurve(i, ...consts))) {
                ctx.lineTo(x - t, y);
            }
            ctx.moveTo(t, y + t);
            x = t;
            y += t;
        } else if (i >= n * (n - 1)) { // if bottom
            if (record[i].indexOf(i + 1) === -1
                && (!heartShaped || insideHeartCurve(i, ...consts))) {
                ctx.lineTo(x, y - t);
            }
            ctx.moveTo(x + t, y);
            x += t;
        } else {
            if (record[i].indexOf(i + n) === -1
                && (!heartShaped || insideHeartCurve(i, ...consts))) {
                ctx.lineTo(x - t, y);
            }
            ctx.moveTo(x, y);
            if (record[i].indexOf(i + 1) === -1
                && (!heartShaped || insideHeartCurve(i, ...consts))) {
                ctx.lineTo(x, y - t);
            }
            ctx.moveTo(x + t, y);
            x += t;
        }
    }
    ctx.stroke();
    if (!heartShaped) {
        ctx.beginPath();
        ctx.moveTo(0, t);
        ctx.lineTo(0, 700);
        ctx.lineTo(700, 700);
        ctx.moveTo(700, 700 - t);
        ctx.lineTo(700, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();
    }
    console.timeEnd('render');
}

/**
 * TODO: Arbitrary shape
 *       More generating algorithms & coloring algorithms
 */

function createMaze(colored, heartShaped) {
    const n = parseInt(document.getElementById('rows').value, 10);
    const heartSize = document.getElementById('heartSizeRange').value;
    const ratio = (((100 - heartSize) / 50) ** 0.7) * 3.5 / n;
    const offset = n / 2;
    const eqX = nerdamer('x = t');
    const eqY = nerdamer('y = sqrt(t)');
    const consts = [n, ratio, offset, eqX, eqY];
    created = false;
    onGame = false;
    curSquare = 0;
    startSquare = 0;
    endSquare = 0;

    if (n < 2) {
        alert('DID YOU READ THE NOTE??');
        return 0;
    }
    // initiate n * n nodes;
    const adjList = new Array(n * n);

    let counter = 0;
    // create adjacency list
    for (let i = 0; i < n * n; i++) {
        if (heartShaped && !insideHeartCurve(i, n, ratio, offset, eqX, eqY)) {
            adjList[i] = [];
            continue;
        }
        counter++;
        // 9 situations
        if (i === 0) { // left top
            adjList[i] = heartShaped ? makeAdjList([1, n], ...consts) : [1, n];
        } else if (i === n - 1) { // right top
            adjList[i] = heartShaped ? makeAdjList([i - 1, i + n], ...consts) : [i - 1, i + n];
        } else if (i === n * (n - 1)) { // left bottom
            adjList[i] = heartShaped ? makeAdjList([i - n, i + 1], ...consts) : [i - n, i + 1];
        } else if (i === n * n - 1) { // right bottom
            adjList[i] = heartShaped ? makeAdjList([i - n, i - 1], ...consts) : [i - n, i - 1];
        } else if (i < n) { // first row
            adjList[i] = heartShaped
                ? makeAdjList([i - 1, i + 1, i + n], ...consts) : [i - 1, i + 1, i + n];
        } else if (i % n === 0) { // left col
            adjList[i] = heartShaped
                ? makeAdjList([i - n, i + 1, i + n], ...consts) : [i - n, i + 1, i + n];
        } else if ((i + 1) % n === 0) { // right col
            adjList[i] = heartShaped
                ? makeAdjList([i - n, i - 1, i + n], ...consts) : [i - n, i - 1, i + n];
        } else if (i > n * (n - 1)) { // bottom row
            adjList[i] = heartShaped
                ? makeAdjList([i - 1, i - n, i + 1], ...consts) : [i - 1, i - n, i + 1];
        } else {
            adjList[i] = heartShaped
                ? makeAdjList([i - 1, i + n, i + 1, i - n], ...consts)
                : [i - 1, i + n, i + 1, i - n];
        }
    }

    // a new adjacency node for querying connected edges
    const record = [];
    for (let i = 0; i < n * n; i++) {
        record[i] = [-1, -1, -1, -1];
    }

    // pick a random node
    let start = Math.floor(Math.random() * n * n) % (n * n);

    while (heartShaped && !insideHeartCurve(start, ...consts)) {
        start = Math.floor(Math.random() * n * n) % (n * n);
    }
    // set of known nodes; won't stop until its size is n * n
    const knowns = [start];
    const knownNodes = new Uint8Array(n * n);
    knownNodes[start] = 1;
    let count = 1;
    console.time('spanning tree generation');
    // set of candidate vertex
    while (count !== counter) {
        let chosenNode = knowns[Math.floor(Math.random() * count)];
        let adj = adjList[chosenNode];
        let next = adj[Math.floor(Math.random() * adj.length)];

        while (knownNodes[next]) {
            chosenNode = knowns[Math.floor(Math.random() * count)];
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
        count++;
    }
    console.timeEnd('spanning tree generation');

    cacheObj = {
        record, colored, heartShaped, consts, start, n,
    };
    render();
    return 0;
}


function preprocess() {
    const radios = document.getElementById('color');
    const colored = radios.checked;
    const heartShaped = document.getElementById('heartShaped').checked;

    createMaze(colored, heartShaped);
}


function showAndHide() {
    const radios = document.getElementById('color');
    if (radios.checked) {
        $('.colorSelection').show();
    } else {
        $('.colorSelection').hide();
    }
}


function showAddColor() {
    const radios = document.getElementsByName('option');
    if (radios[0].checked) {
        $('#addColor').show();
        for (let i = 1; i < colors.length; i++) {
            $(`#b${i}`).show();
        }
    } else {
        $('#addColor').hide();
        for (let i = 1; i < colors.length; i++) {
            $(`#b${i}`).hide();
        }
    }
}

function showHideSizeRange() {
    const box = document.getElementById('heartShaped').checked;
    if (box) {
        $('#sizeRange').show();
    } else {
        $('#sizeRange').hide();
    }
}

function onPressGameBtn(){
    if(!created){
        alert('create a maze first');
        return;
    }
    if(onGame){
        render();
    }else{
        document.getElementById('playBtn').innerHTML = 'Press to stop';
        prepareForGame();
    }
    onGame = !onGame;
    // if not on game
}

function handleSquare(from, to){
    const append = colorRecord[from][0] === 'hsl' ? '%' : '';
    ctx.fillStyle = `${colorRecord[from][0]}(${colorRecord[from][1]}, ${colorRecord[from][2]}${append}, ${colorRecord[from][3]}${append})`;
    const len = 700 /cacheObj.n;
    ctx.fillRect((from % cacheObj.n + 0.05) * len, (Math.floor(from / cacheObj.n) + 0.05) * len, len * 0.9, len * 0.9);
    ctx.drawImage(pacMan, (to % cacheObj.n + 0.1) * len, (Math.floor(to / cacheObj.n) + 0.1) * len, len * 0.8, len * 0.8);
    if(to === endSquare){
        $('#winMessage').show();
        onGame = false;
    }
}

function update(event){
    if(!onGame) return;
    if(event.keyCode === 37){ // left
        if(cacheObj.record[curSquare].indexOf(curSquare - 1) != -1){
            pacMan.src = './assets/pac-man.3.png';
            handleSquare(curSquare, curSquare - 1);
            curSquare = curSquare - 1;
        }
    }else if(event.keyCode === 39){ // right
        if(cacheObj.record[curSquare].indexOf(curSquare + 1) != -1){
            pacMan.src = './assets/pac-man.1.png';
            handleSquare(curSquare, curSquare + 1);
            curSquare = curSquare + 1;
        }
    }else if(event.keyCode === 38){ // up
        if(cacheObj.record[curSquare].indexOf(curSquare - cacheObj.n) != -1){
            pacMan.src = './assets/pac-man.4.png';
            handleSquare(curSquare, curSquare - cacheObj.n);
            curSquare = curSquare - cacheObj.n;
        }
    }else if(event.keyCode === 40){ // down
        if(cacheObj.record[curSquare].indexOf(curSquare + cacheObj.n) != -1){
            pacMan.src = './assets/pac-man.2.png';
            handleSquare(curSquare, curSquare + cacheObj.n);
            curSquare = curSquare + cacheObj.n;
        }
    }
}

function prepareForGame(){
    // figure out starting point;
    let start = 0;
    let end = cacheObj.n * cacheObj.n - 1;
    let haveStart = false;
    let haveEnd = false;
    for(let i = 0; i < cacheObj.record.length; i++){
        if(cacheObj.record[start].filter(x => x !== -1).length > 0){
            haveStart = true;
        }
        if(cacheObj.record[end].filter(x => x !== -1).length > 0){
            haveEnd = true;
        }
        if(haveEnd && haveStart){
            break;
        }else{
            if(!haveStart) start++;
            if(!haveEnd) end--;
        }
    }
    if(!haveStart || !haveEnd){
        alert("You don't have a maze or your maze is too small.");
        return;
    }
    // mark start & end point
    curSquare = start;
    startSquare = start;
    endSquare = end;
    const len = 700 / cacheObj.n;
    // ctx.fillRect((start % cacheObj.n) * len, Math.floor(start / cacheObj.n) * len, len, len);

    const startAdj = cacheObj.record[start][0];
    if(startAdj === start + 1){
        pacMan.src = './assets/pac-man.1.png';
    }else if(startAdj === start + cacheObj.n){
        pacMan.src = './assets/pac-man.2.png';
    }else if(startAdj === start - 1){
        pacMan.src = './assets/pac-man.3.png';
    }else{
        pacMan.src = './assets/pac-man.4.png';
    }
    ctx.drawImage(pacMan, (start % cacheObj.n + 0.1) * len, (Math.floor(start / cacheObj.n) + 0.1) * len, len * 0.8, len * 0.8);
    ctx.fillRect((end % cacheObj.n) * len, Math.floor(end / cacheObj.n) * len, len, len);
}

window.onload = initiate;
