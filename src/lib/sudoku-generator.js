// NovaSudoku High-Speed Guaranteed-Unique Puzzle Generator

function shuffled(values) {
    const a = [...values];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function generateSolution() {
    const pattern = (r, c) => (r * 3 + Math.floor(r / 3) + c) % 9;
    const bands = shuffled([0, 1, 2]);
    const rows = bands.flatMap(b => shuffled([0, 1, 2]).map(r => b * 3 + r));
    const stacks = shuffled([0, 1, 2]);
    const cols = stacks.flatMap(b => shuffled([0, 1, 2]).map(c => b * 3 + c));
    const digits = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    return Array.from({ length: 81 }, (_, i) => {
        const r = rows[Math.floor(i / 9)];
        const c = cols[i % 9];
        return digits[pattern(r, c)];
    });
}

function getCandidates(grid, index) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const used = new Set();

    for (let n = 0; n < 9; n++) {
        used.add(grid[row * 9 + n]);
        used.add(grid[n * 9 + col]);
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            used.add(grid[r * 9 + c]);
        }
    }

    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n));
}

function countSolutions(grid, limit = 2) {
    let best = -1;
    let options = null;

    for (let i = 0; i < 81; i++) {
        if (!grid[i]) {
            const current = getCandidates(grid, i);
            if (!current.length) return 0;
            if (!options || current.length < options.length) {
                best = i;
                options = current;
                if (current.length === 1) break;
            }
        }
    }

    if (best < 0) return 1;

    let count = 0;
    for (const n of options) {
        grid[best] = n;
        count += countSolutions(grid, limit - count);
        if (count >= limit) break;
    }
    grid[best] = 0;
    return count;
}

export function generatePuzzle(solution, difficulty = 'easy') {
    const grid = [...solution];
    const targetGivens = {
        easy: 40,
        medium: 32,
        hard: 26,
        expert: 22,
    }[difficulty] || 36;

    const indices = shuffled(Array.from({ length: 81 }, (_, i) => i));

    for (const index of indices) {
        if (grid.filter(Boolean).length <= targetGivens) break;
        const oldVal = grid[index];
        grid[index] = 0;

        // Verify that the puzzle maintains exactly ONE unique solution
        if (countSolutions(grid) !== 1) {
            grid[index] = oldVal;
        }
    }

    return grid;
}
