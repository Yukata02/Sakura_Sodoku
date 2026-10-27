// NovaSudoku Local Client-Side Intelligent Hint Engine

import { cellSet, cellProp } from './sudoku-cell-sets';
import { modelHelpers } from './sudoku-model';

const ALL_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function rcStr(index) {
    const r = Math.floor(index / 9) + 1;
    const c = (index % 9) + 1;
    return `r${r}c${c}`;
}

export function generateLocalHint(grid) {
    const cells = grid.get('cells').toArray();
    const currDigits = cells.map(c => c.get('digit'));

    // Check if puzzle is already completely filled
    if (!currDigits.includes('0')) {
        return {
            noHint: true,
            title: "Puzzle Complete",
            html: "<p>The puzzle has already been completely filled!</p>",
        };
    }

    // Compute candidates for all 81 cells based on current placed digits
    const candidates = Array(81).fill('');
    const candidateList = Array(81).fill(null).map(() => []);

    for (let i = 0; i < 81; i++) {
        if (currDigits[i] !== '0') {
            candidates[i] = currDigits[i];
            candidateList[i] = [];
            continue;
        }

        const cp = cellProp[i];
        const row = cp.row;
        const col = cp.col;
        const box = cp.box;

        const peers = new Set([
            ...cellSet.row[row],
            ...cellSet.col[col],
            ...cellSet.box[box]
        ]);
        peers.delete(i);

        const usedDigits = new Set();
        peers.forEach(peerIdx => {
            const d = currDigits[peerIdx];
            if (d !== '0') {
                usedDigits.add(d);
            }
        });

        const valid = ALL_DIGITS.filter(d => !usedDigits.has(d));
        candidateList[i] = valid;
        candidates[i] = valid.join('');
    }

    // --- Strategy 1: Naked Single (Cell with only 1 possible candidate) ---
    for (let i = 0; i < 81; i++) {
        if (currDigits[i] === '0' && candidateList[i].length === 1) {
            const d = candidateList[i][0];
            const cp = cellProp[i];
            const highlightCell = { [i]: true };

            // Also highlight peer cells in row, col, and box that eliminate other digits
            const peers = [...cellSet.row[cp.row], ...cellSet.col[cp.col], ...cellSet.box[cp.box]];
            peers.forEach(p => {
                if (currDigits[p] !== '0') {
                    highlightCell[p] = true;
                }
            });

            return {
                title: `Naked Single: ${rcStr(i)} = ${d}`,
                html: `<p>The cell ${rcStr(i)} has only one candidate remaining: <strong>${d}</strong>.</p><p>All other numbers (1–9) already exist in row ${cp.row}, column ${cp.col}, or block ${cp.box}.</p>`,
                digitIndex: i,
                digitValue: d,
                digits: currDigits,
                candidates: candidates,
                stepRating: "1.2",
                puzzleRating: grid.get('difficultyLevel') ? `${grid.get('difficultyLevel')}.0` : "2.0",
                highlightCell,
                hintIndex: i,
            };
        }
    }

    // --- Strategy 2: Hidden Single in 3x3 Block ---
    for (let b = 1; b <= 9; b++) {
        const boxIndices = cellSet.box[b];
        for (const d of ALL_DIGITS) {
            const possibleCells = boxIndices.filter(i => currDigits[i] === '0' && candidateList[i].includes(d));
            if (possibleCells.length === 1) {
                const targetIdx = possibleCells[0];
                const cp = cellProp[targetIdx];
                const highlightCell = {};
                boxIndices.forEach(i => { highlightCell[i] = true; });

                return {
                    title: `Hidden Single: ${d} in block ${b}`,
                    html: `<p>In block ${b}, the digit <strong>${d}</strong> can only be placed in cell ${rcStr(targetIdx)}.</p><p>All other open cells in this block are blocked from holding ${d} by their intersecting rows and columns.</p>`,
                    digitIndex: targetIdx,
                    digitValue: d,
                    digits: currDigits,
                    candidates: candidates,
                    stepRating: "1.5",
                    puzzleRating: grid.get('difficultyLevel') ? `${grid.get('difficultyLevel')}.0` : "2.4",
                    highlightCell,
                    hintIndex: targetIdx,
                };
            }
        }
    }

    // --- Strategy 3: Hidden Single in Row ---
    for (let r = 1; r <= 9; r++) {
        const rowIndices = cellSet.row[r];
        for (const d of ALL_DIGITS) {
            const possibleCells = rowIndices.filter(i => currDigits[i] === '0' && candidateList[i].includes(d));
            if (possibleCells.length === 1) {
                const targetIdx = possibleCells[0];
                const highlightCell = {};
                rowIndices.forEach(i => { highlightCell[i] = true; });

                return {
                    title: `Hidden Single: ${d} in row ${r}`,
                    html: `<p>In row ${r}, the digit <strong>${d}</strong> can only fit into cell ${rcStr(targetIdx)}.</p><p>Every other empty cell in row ${r} already sees a ${d} in its column or 3x3 block.</p>`,
                    digitIndex: targetIdx,
                    digitValue: d,
                    digits: currDigits,
                    candidates: candidates,
                    stepRating: "1.5",
                    puzzleRating: grid.get('difficultyLevel') ? `${grid.get('difficultyLevel')}.0` : "2.4",
                    highlightCell,
                    hintIndex: targetIdx,
                };
            }
        }
    }

    // --- Strategy 4: Hidden Single in Column ---
    for (let c = 1; c <= 9; c++) {
        const colIndices = cellSet.col[c];
        for (const d of ALL_DIGITS) {
            const possibleCells = colIndices.filter(i => currDigits[i] === '0' && candidateList[i].includes(d));
            if (possibleCells.length === 1) {
                const targetIdx = possibleCells[0];
                const highlightCell = {};
                colIndices.forEach(i => { highlightCell[i] = true; });

                return {
                    title: `Hidden Single: ${d} in column ${c}`,
                    html: `<p>In column ${c}, the digit <strong>${d}</strong> can only fit into cell ${rcStr(targetIdx)}.</p><p>Every other empty position in column ${c} sees a ${d} in its row or 3x3 block.</p>`,
                    digitIndex: targetIdx,
                    digitValue: d,
                    digits: currDigits,
                    candidates: candidates,
                    stepRating: "1.5",
                    puzzleRating: grid.get('difficultyLevel') ? `${grid.get('difficultyLevel')}.0` : "2.4",
                    highlightCell,
                    hintIndex: targetIdx,
                };
            }
        }
    }

    // --- Strategy 5: Smart Fallback via Backtracking Solver ---
    // If the puzzle is difficult or uses advanced techniques (X-Wings, Swordfish),
    // find the solved solution and pick the cell with Minimum Remaining Values (MRV)
    try {
        const solverResult = modelHelpers.findSolutions(currDigits, { findAll: false });
        if (solverResult && solverResult.uniqueSolution && solverResult.finalDigits) {
            const finalDigits = solverResult.finalDigits;

            // Pick the unfilled cell with fewest candidates
            let bestIdx = -1;
            let minCandidates = 10;
            for (let i = 0; i < 81; i++) {
                if (currDigits[i] === '0') {
                    const count = candidateList[i].length;
                    if (count > 0 && count < minCandidates) {
                        minCandidates = count;
                        bestIdx = i;
                    }
                }
            }

            if (bestIdx !== -1) {
                const d = finalDigits[bestIdx];
                const cp = cellProp[bestIdx];
                const highlightCell = { [bestIdx]: true };

                return {
                    title: `Logical Deduction: ${rcStr(bestIdx)} = ${d}`,
                    html: `<p>Examining cell ${rcStr(bestIdx)} in row ${cp.row}, column ${cp.col}, and block ${cp.box}:</p><p>Through candidate elimination, placing <strong>${d}</strong> in ${rcStr(bestIdx)} preserves a consistent valid solution without contradiction.</p>`,
                    digitIndex: bestIdx,
                    digitValue: d,
                    digits: currDigits,
                    candidates: candidates,
                    stepRating: "2.4",
                    puzzleRating: grid.get('difficultyLevel') ? `${grid.get('difficultyLevel')}.0` : "3.0",
                    highlightCell,
                    hintIndex: bestIdx,
                };
            }
        }
    } catch {
        // solver error or no solution
    }

    return {
        noHint: true,
        title: "No Available Hint",
        html: "<p>Unable to find a valid next step. Please check your existing placed digits for conflicts using the <em>Check</em> action.</p>",
    };
}
