//config
const canvas2 = document.getElementById('canvas2');
const canvas1 = document.getElementById('canvas1');
const ctx2 = canvas2.getContext('2d');
const ctx = canvas1.getContext('2d');
const seed = 4208;
const n3 = 0;
const n4 = 8;
const n = 10;
const k1 = 1.0 - n3 * 0.01 - n4 * 0.005 - 0.05;
const w = canvas1.width;
const h = canvas1.height;

//matrix
function genRandNum(seed) {
    const RANDOM_NUMBER = 2147483647;
    let value = seed % RANDOM_NUMBER;
    if (value <= 0) value += RANDOM_NUMBER;

    return function () {
        value = (value * 16807) % RANDOM_NUMBER;
        return (value - 1) / RANDOM_NUMBER;
    };
}

function genDirMatrix(rand, k) {
    const rawMatrix = Array.from({length: n}, () => Array.from({length: n}, () => rand() * 2.0));

    const dirMatrix = rawMatrix.map((row) => row.map((value) => (value * k >= 1.0 ? 1 : 0)));

    return dirMatrix;
}

function genUndirMatrix(dir) {
    const undir = Array.from({length: n}, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (dir[i][j] === 1 || dir[j][i] === 1) {
                undir[i][j] = 1;
                undir[j][i] = 1;
            }
        }
    }

    return undir;
}

function printMatrix(matrix, title) {
    console.log(`\n${title}\n`);
    let i = 0
    matrix.forEach((row) => {
        const line = row.map((v) => String(v).padStart(2, ' ')).join(' ') + ' ';
        console.log(line + ` row ${i + 1}`);
        i++
    });
}

//drawing
const PADD = 50;
const RAD = 20;

const positions = [{x: PADD + 20, y: PADD + 20}, {x: w / 2, y: PADD + 20}, {x: w - PADD - 20, y: PADD + 20}, {
    x: w - PADD - 20, y: h / 2
}, {x: w - PADD - 20, y: h - PADD - 20}, {x: (w / 3) * 2, y: h - PADD - 20}, {x: w / 3, y: h - PADD - 20}, {
    x: PADD + 20, y: h - PADD - 20
}, {
    x: PADD + 20, y: h / 2
}, {x: w / 2, y: h / 2},];

function distanceToLine(p1, p2, p) {
    const A = p.x - p1.x;
    const B = p.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const scal = A * C + B * D;
    const len2 = C * C + D * D;
    const param = scal / len2;

    let xx;
    let yy;

    if (param < 0) {
        xx = p1.x;
        yy = p1.y;
    } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
    } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
    }

    const vx = p.x - xx;
    const vy = p.y - yy;
    return Math.sqrt(vx * vx + vy * vy);
}

function drawArrow(from, to, rad, controlPoint, ctx) {
    let angle;

    if (controlPoint) {
        const t = 0.95;
        const x = 2 * (1 - t) * (controlPoint.x - from.x) + 2 * t * (to.x - controlPoint.x);
        const y = 2 * (1 - t) * (controlPoint.y - from.y) + 2 * t * (to.y - controlPoint.y);
        angle = Math.atan2(y, x);
    } else {
        angle = Math.atan2(to.y - from.y, to.x - from.x);
    }

    const x = to.x - rad * Math.cos(angle);
    const y = to.y - rad * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 10 * Math.cos(angle - Math.PI / 10), y - 10 * Math.sin(angle - Math.PI / 10));
    ctx.lineTo(x - 10 * Math.cos(angle + Math.PI / 10), y - 10 * Math.sin(angle + Math.PI / 10));
    ctx.fill();
    ctx.closePath();
}

function getCurvPoint(p1, p2, i, j, OFFSET, direction) {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    const vx = p2.x - p1.x;
    const vy = p2.y - p1.y;

    const perp = {x: -vy, y: vx};

    const length = Math.sqrt(perp.x * perp.x + perp.y * perp.y);

    const dir = direction ? direction : i < j ? 1 : -1;

    const point = {
        x: midX + dir * (perp.x / length) * OFFSET, y: midY + dir * (perp.y / length) * OFFSET,
    };

    return point;
}

function drawGraph(matrix, ctx, directed = true, n, W) {
    ctx.clearRect(0, 0, w, h);
    const boxes = []

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!directed && i > j) continue;
            if (matrix[i][j] === 1) {
                if (directed && matrix[j][i] === 1 && j < i) continue;
                if (!directed && j < i) continue;
                if (i === j) {
                    let offsetX;
                    let offsetY;

                    if (i <= 2) {
                        offsetX = 0;
                        offsetY = -20;
                    } else if (i === 3) {
                        offsetX = 20;
                        offsetY = 0;
                    } else if (i === 8) {
                        offsetX = -20;
                        offsetY = 0;
                    } else {
                        offsetX = 0;
                        offsetY = 20;
                    }
                    const cx = positions[i].x + offsetX;
                    const cy = positions[i].y + offsetY;

                    ctx.beginPath();
                    ctx.arc(cx, cy, RAD, Math.PI, -Math.PI);
                    ctx.stroke();

                    continue;
                }
                const p1 = positions[i];
                const p2 = positions[j];

                let curved = false;
                let curvPoint = null;

                for (let k = 0; k < n; k++) {
                    if (j === i) break;
                    if (k === i || k === j) continue;
                    const pk = positions[k];

                    if (distanceToLine(p1, p2, pk) < 25) {
                        curved = true;

                        curvPoint = getCurvPoint(p1, p2, i, j, 90);
                    }
                }

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);

                if (curved) {
                    ctx.quadraticCurveTo(curvPoint.x, curvPoint.y, p2.x, p2.y);
                } else {
                    ctx.lineTo(p2.x, p2.y);
                }
                ctx.stroke();

                if (directed) {
                    drawArrow(p1, p2, RAD, curved ? curvPoint : null, ctx);

                    if (matrix[j][i] === 1) {
                        const curvPoint2 = getCurvPoint(p1, p2, i, j, 90, -1);

                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);

                        ctx.quadraticCurveTo(curvPoint2.x, curvPoint2.y, p2.x, p2.y);
                        ctx.stroke();

                        drawArrow(p2, p1, RAD, curvPoint2, ctx);
                    }
                }
            }
        }
    }

    for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.arc(positions[i].x, positions[i].y, RAD, Math.PI, -Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.font = '15px Arial';
        ctx.fillText(i + 1, positions[i].x - 5, positions[i].y + 5);
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!directed && i > j) continue;
            const p1 = positions[i];
            const p2 = positions[j];

            let curved = false;
            let curvPoint = null;
            for (let k = 0; k < n; k++) {
                if (j === i) break;
                if (k === i || k === j) continue;
                const pk = positions[k];

                if (distanceToLine(p1, p2, pk) < 25) {
                    curved = true;

                    curvPoint = getCurvPoint(p1, p2, i, j, 90);
                }
            }

            const weight = W[i][j];

            if (weight === 0 || weight === Infinity) {
                continue
            }

            if (curved) {
                let peakx = 0.25 * p1.x + 0.5 * curvPoint.x + 0.25 * p2.x
                let peaky = 0.25 * p1.y + 0.5 * curvPoint.y + 0.25 * p2.y
                const xcheck = Math.ceil(peakx)
                const ycheck = Math.ceil(peaky)
                drawSquare(xcheck, ycheck, weight, ctx, 20)
                boxes.push(`${xcheck},${ycheck}`)
            } else {
                let x = (p1.x + p2.x) / 2
                let y = (p1.y + p2.y) / 2
                const xcheck = Math.ceil(x)
                const ycheck = Math.ceil(y)
                if (boxes.includes(`${xcheck},${ycheck}`)) {
                    x = (x + p2.x) / 2
                    y = (y + p2.y) / 2
                    x = (x + xcheck) / 2
                    y = (y + ycheck) / 2
                    boxes.push(`${Math.ceil(x)},${Math.ceil(y)}`)
                }
                drawSquare(x, y, weight, ctx, 20)
                boxes.push(`${xcheck},${ycheck}`)
            }
        }
    }
}

//button's functions
const rand = genRandNum(seed);
const dirMatrix1 = genDirMatrix(rand, k1);
const undirMatrix = genUndirMatrix(dirMatrix1);

printMatrix(undirMatrix, 'Undirected Matrix');

//**************
//lab 6
//**************

//matrix's creation
//_________________

//B
function genMatrixB(rand, n) {
    return Array.from({length: n}, () => Array.from({length: n}, () => rand() * 2.0));
}

const B = genMatrixB(rand, n);


//C
function genMatrixC(B, undir) {
    const n = B.length;
    const C = Array.from({length: n}, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            C[i][j] = Math.ceil(B[i][j] * 100 * undir[i][j]);
        }
    }

    return C;
}

const C = genMatrixC(B, undirMatrix);

//D
function genMatrixD(C) {
    const n = C.length;    // Кількість рядків
    const D = Array.from({length: n}, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            D[i][j] = (C[i][j] > 0) ? 1 : 0;
        }
    }

    return D;
}

const D = genMatrixD(C);

//H
function genMatrixH(D) {
    const n = D.length; // Розмір матриці (n x n)
    const H = Array.from({length: n}, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            H[i][j] = (D[i][j] !== D[j][i]) ? 1 : 0;
        }
    }

    return H;
}

const H = genMatrixH(D);

//Tr
function genMatrixTr(n) {

    return Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => (i < j) ? 1 : 0));

}

const Tr = genMatrixTr(n);

//W
function genMatrixW(C, D, H, Tr) {
    const n = C.length;

    const W = Array.from({length: n}, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            const val = (D[i][j] + H[i][j] * Tr[i][j]) * C[i][j];

            let weight;

            if (i === j) {
                weight = 0;
            } else {
                if (val === 0) {
                    weight = Infinity;
                } else {
                    weight = val;
                }
            }

            W[i][j] = weight;
            W[j][i] = weight;
        }
    }

    return W;
}

const W = genMatrixW(C, D, H, Tr);

function printW(W) {
    const formatted = W.map(row => row.map(value => value === Infinity ? 'INF' : value.toString().padStart(3, ' ')));

    formatted.forEach((row, i) => {
        console.log('\n', row.join('  ') + `   row ${i + 1}`);
    });
}


console.log('\nW\n');
printW(W, 'W')


//Kruskal
class UnionFind {
    constructor(n) {
        this.parent = Array.from({length: n}, (_, i) => i);
    }

    #find(i) {
        while (this.parent[i] !== i) {
            i = this.parent[i];
        }
        return i;
    }

    union(i, j) {
        const rootI = this.#find(i);
        const rootJ = this.#find(j);
        if (rootI === rootJ) {
            return false;
        }
        this.parent[rootJ] = rootI;
        return true
    }
}

function kruskal(W) {
    const n = W.length;
    const edges = [];

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const weight = W[i][j];
            if (weight !== Infinity && weight !== 0) {
                edges.push([i, j, weight]);
            }
        }
    }

    edges.sort((a, b) => a[2] - b[2]);

    const uf = new UnionFind(n);
    const mst = [];

    for (const [i, j, weight] of edges) {
        if (uf.union(i, j)) {
            mst.push([i, j, weight]);
        }
        if (mst.length === n - 1) {
            break
        }

    }
    return mst;
}

const mst = kruskal(W);

//drawing
function drawSquare(x, y, number, ctx, size) {
    ctx.fillStyle = 'green';
    const xx = x - (size / 2)
    const yy = y - (size / 2)
    ctx.fillRect(xx, yy, size, size);

    ctx.fillStyle = 'white';
    ctx.font = size > 25 ? '16px Arial' : '11px Arial'

    ctx.fillText(number, xx + size / 5 - 4, yy + size / 1.5);
}

function* drawMST(mst) {
    let firstDenie = true
    let order = mst

    //start function draw on canvas2
    for (let i = 0; i < n; i++) {
        ctx2.beginPath();
        ctx2.arc(positions[i].x, positions[i].y, RAD, Math.PI, -Math.PI);
        ctx2.fillStyle = 'white';
        ctx2.fill();
        ctx2.stroke();
        ctx2.fillStyle = 'black';
        ctx2.font = '15px Arial';
        ctx2.fillText(i + 1, positions[i].x - 5, positions[i].y + 5);
    }

    for (const [i, j, w] of order) {

        ctx2.beginPath();
        ctx2.arc(positions[i].x, positions[i].y, RAD, Math.PI, -Math.PI);
        ctx2.fillStyle = 'green';
        ctx2.fill();
        ctx2.strokeStyle = 'black';
        ctx2.stroke();
        ctx2.strokeStyle = 'green';
        ctx2.fillStyle = 'black';
        ctx2.font = '15px Arial';
        ctx2.fillText(i + 1, positions[i].x - 5, positions[i].y + 5);

        if (firstDenie) {
            ctx2.beginPath();
            ctx2.arc(positions[i].x, positions[i].y, RAD, Math.PI, -Math.PI);
            ctx2.fillStyle = 'green';
            ctx2.fill();
            ctx2.strokeStyle = 'black';
            ctx2.stroke();
            ctx2.strokeStyle = 'green';
            ctx2.fillStyle = 'black';
            ctx2.font = '15px Arial';
            ctx2.fillText(i + 1, positions[i].x - 5, positions[i].y + 5);

            firstDenie = false

            yield
        }

        const p1 = positions[i];
        const p2 = positions[j];
        let curved = false;
        let curvPoint = null;
        for (let k = 0; k < n; k++) {
            if (j === i) break;
            if (k === i || k === j) continue;
            const pk = positions[k];
            if (distanceToLine(p1, p2, pk) < 25) {
                curved = true;
                curvPoint = getCurvPoint(p1, p2, i, j, 90);
            }
        }
        ctx2.beginPath();
        ctx2.moveTo(p1.x, p1.y);
        if (curved) {
            ctx2.quadraticCurveTo(curvPoint.x, curvPoint.y, p2.x, p2.y);
        } else {
            ctx2.lineTo(p2.x, p2.y);
        }
        ctx2.strokeStyle = 'green'
        ctx2.stroke();

        ctx2.beginPath();
        ctx2.arc(positions[j].x, positions[j].y, RAD, Math.PI, -Math.PI);
        ctx2.fillStyle = 'green';
        ctx2.fill();
        ctx2.strokeStyle = 'black';
        ctx2.stroke();
        ctx2.strokeStyle = 'green';
        ctx2.fillStyle = 'black';
        ctx2.font = '15px Arial';
        ctx2.fillText(j + 1, positions[j].x - 5, positions[j].y + 5);

        if (curved) {
            const peakx = 0.25 * p1.x + 0.5 * curvPoint.x + 0.25 * p2.x
            const peaky = 0.25 * p1.y + 0.5 * curvPoint.y + 0.25 * p2.y
            drawSquare(peakx, peaky, w, ctx2, 30)
        } else {
            const x = (p1.x + p2.x) / 2
            const y = (p1.y + p2.y) / 2
            drawSquare(x, y, w, ctx2, 30)
        }

        yield
    }
}

//weight sum
function wsum(mst) {
    let counter = 0
    for (const [i, j, w] of mst) {
        counter += w
    }
    return counter
}

const sum = wsum(mst)
console.log('\nСума ребер кістяка:', sum)

const mstGen = drawMST(mst)
drawGraph(undirMatrix, ctx, false, n, W);
mstButton.addEventListener('click', () => {
    mstGen.next()
});







































































































































