import { newSudokuModel } from './sudoku-model';
import { generateLocalHint } from './nova-hint-engine';

describe('NovaSudoku Intelligent Hint Engine', () => {
    test('generates Naked Single hint when only 1 candidate remains for a cell', () => {
        // Simple puzzle with an obvious naked single
        const partial =
            '003020600' +
            '900305001' +
            '001806400' +
            '008102900' +
            '700000008' +
            '006708200' +
            '002609500' +
            '800203009' +
            '005010300';
        const grid = newSudokuModel({ initialDigits: partial, skipCheck: true });
        const hint = generateLocalHint(grid);

        expect(hint).toBeDefined();
        expect(hint.noHint).toBeFalsy();
        expect(hint.digitValue).toMatch(/^[1-9]$/);
        expect(hint.digitIndex).toBeGreaterThanOrEqual(0);
        expect(hint.digitIndex).toBeLessThan(81);
        expect(hint.title).toContain('Single');
        expect(hint.html).toContain('<strong>');
        expect(hint.stepRating).toBeDefined();
    });

    test('returns puzzle complete message when grid has no unfilled cells', () => {
        const solvedDigits =
            '453826197' +
            '962571483' +
            '871943526' +
            '528467931' +
            '349185762' +
            '106392845'.replace('0', '7') +
            '687214359' +
            '215739608'.replace('0', '4') +
            '794658210'.replace('0', '3');
        const grid = newSudokuModel({ initialDigits: solvedDigits, skipCheck: true });
        const hint = generateLocalHint(grid);

        expect(hint.noHint).toBe(true);
        expect(hint.title).toBe('Puzzle Complete');
    });
});
