import { useState, useEffect, useCallback, useRef } from 'react';
import { generateSolution, generatePuzzle } from '../../lib/sudoku-generator';
import {
    playDigitSound,
    playPencilSound,
    playEraseSound,
    playErrorSound,
    playVictoryFanfare,
    isSoundEnabled,
    toggleSound
} from '../../lib/sound-effects';
import { launchConfetti } from '../../lib/confetti';
import { TOUR_STEPS } from '../../lib/game-tour';
import './SudokuStudio.css';

export default function SudokuStudio() {
    // Game State
    const [difficulty, setDifficulty] = useState('easy');
    const [solution, setSolution] = useState([]);
    const [puzzle, setPuzzle] = useState([]);
    const [entries, setEntries] = useState(Array(81).fill(0));
    const [notes, setNotes] = useState(Array.from({ length: 81 }, () => new Set()));
    const [selected, setSelected] = useState(-1);
    const [notesMode, setNotesMode] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [finished, setFinished] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [statusMsg, setStatusMsg] = useState('Choose a square, then enter a number.');
    const [hintsUsed, setHintsUsed] = useState(0);
    const [mistakesCount, setMistakesCount] = useState(0);
    const [undoStack, setUndoStack] = useState([]);

    // Theme & Audio State
    const [isDark, setIsDark] = useState(() => {
        try {
            return document.body.classList.contains('dark') || localStorage.getItem('nova-theme') === 'dark';
        } catch {
            return false;
        }
    });
    const [soundOn, setSoundOn] = useState(isSoundEnabled());

    // Tour State
    const [tourStep, setTourStep] = useState(-1);

    const cellRefs = useRef([]);

    // Sync Dark Theme class to body
    useEffect(() => {
        if (isDark) {
            document.body.classList.add('dark');
            try { localStorage.setItem('nova-theme', 'dark'); } catch {}
        } else {
            document.body.classList.remove('dark');
            try { localStorage.setItem('nova-theme', 'light'); } catch {}
        }
    }, [isDark]);

    const handleThemeToggle = () => setIsDark(d => !d);
    const handleSoundToggle = () => {
        const next = toggleSound();
        setSoundOn(next);
    };

    // Start New Game
    const startNewGame = useCallback((diff = difficulty) => {
        const sol = generateSolution();
        const puz = generatePuzzle(sol, diff);
        setSolution(sol);
        setPuzzle(puz);
        setEntries(Array(81).fill(0));
        setNotes(Array.from({ length: 81 }, () => new Set()));
        setSelected(-1);
        setSeconds(0);
        setIsTimerRunning(true);
        setFinished(false);
        setShowErrors(false);
        setHintsUsed(0);
        setMistakesCount(0);
        setUndoStack([]);
        setStatusMsg('Welcome! Take a breath, pick any square, and enjoy.');
    }, [difficulty]);

    // Initial mount start
    useEffect(() => {
        startNewGame('easy');
    }, [startNewGame]);

    // Timer Interval
    useEffect(() => {
        if (!isTimerRunning || finished) return;
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, finished]);

    // Save snapshot for Undo
    const saveSnapshot = useCallback(() => {
        setUndoStack(prev => [
            ...prev.slice(-30),
            {
                entries: [...entries],
                notes: notes.map(s => new Set(s)),
                selected,
            }
        ]);
    }, [entries, notes, selected]);

    // Undo action
    const handleUndo = useCallback(() => {
        if (finished || undoStack.length === 0) return;
        const last = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        setEntries(last.entries);
        setNotes(last.notes);
        if (last.selected >= 0) setSelected(last.selected);
        setStatusMsg('Action undone.');
        playEraseSound();
    }, [finished, undoStack]);

    // Number Entry
    const setNumber = useCallback((number) => {
        if (selected < 0) {
            setStatusMsg('Select an empty square on the board first.');
            return;
        }
        if (finished || puzzle[selected]) return;

        saveSnapshot();

        if (notesMode && number > 0) {
            playPencilSound();
            setNotes(prev => {
                const next = prev.map((s, idx) => {
                    if (idx !== selected) return s;
                    const updated = new Set(s);
                    if (updated.has(number)) updated.delete(number);
                    else updated.add(number);
                    return updated;
                });
                return next;
            });
            setEntries(prev => {
                const next = [...prev];
                next[selected] = 0;
                return next;
            });
            setShowErrors(false);
            setStatusMsg(`Penciled note ${number} in square.`);
            return;
        }

        if (number === 0) {
            playEraseSound();
            setEntries(prev => {
                const next = [...prev];
                next[selected] = 0;
                return next;
            });
            setNotes(prev => {
                const next = prev.map((s, idx) => {
                    if (idx !== selected) return s;
                    return new Set();
                });
                return next;
            });
            setShowErrors(false);
            setStatusMsg('Square erased.');
            return;
        }

        // Normal number placement
        playDigitSound(String(number));
        const newEntries = [...entries];
        newEntries[selected] = number;
        setEntries(newEntries);

        // Clear notes in this cell
        setNotes(prev => prev.map((s, idx) => idx === selected ? new Set() : s));
        setShowErrors(false);

        // Check if solved
        const isSolved = newEntries.every((val, i) => puzzle[i] || val === solution[i]);
        if (isSolved) {
            setFinished(true);
            setIsTimerRunning(false);
            setStatusMsg('✨ Delightful! You solved the puzzle with calm grace.');
            launchConfetti();
            playVictoryFanfare();
        } else {
            setStatusMsg(`Placed ${number}. Taking shape nicely!`);
        }
    }, [selected, finished, puzzle, notesMode, entries, solution, saveSnapshot]);

    // Erase action
    const handleErase = () => setNumber(0);

    // Intelligent Hint action
    const handleHint = useCallback(() => {
        if (finished || !solution.length) return;

        // Find cell needing hint: prefer currently selected if unfilled/wrong, else first wrong
        let target = -1;
        if (selected >= 0 && !puzzle[selected] && entries[selected] !== solution[selected]) {
            target = selected;
        } else {
            target = entries.findIndex((val, i) => !puzzle[i] && val !== solution[i]);
        }

        if (target < 0) {
            setStatusMsg('Everything placed so far sits in perfect harmony!');
            return;
        }

        saveSnapshot();
        const correctVal = solution[target];
        setSelected(target);
        setEntries(prev => {
            const next = [...prev];
            next[target] = correctVal;
            return next;
        });
        setNotes(prev => prev.map((s, idx) => idx === target ? new Set() : s));
        setHintsUsed(h => h + 1);
        setShowErrors(false);
        playDigitSound(String(correctVal));

        const r = Math.floor(target / 9) + 1;
        const c = (target % 9) + 1;
        setStatusMsg(`💡 Gentle hint: Row ${r}, Column ${c} can be ${correctVal}.`);

        const isSolved = entries.every((val, i) => i === target ? true : (puzzle[i] || val === solution[i]));
        if (isSolved) {
            setFinished(true);
            setIsTimerRunning(false);
            launchConfetti();
            playVictoryFanfare();
        }
    }, [finished, solution, selected, puzzle, entries, saveSnapshot]);

    // Check Mistakes action
    const handleCheck = useCallback(() => {
        if (finished || !solution.length) return;
        const mistakes = entries.filter((n, i) => n > 0 && n !== solution[i]).length;
        setShowErrors(mistakes > 0);
        if (mistakes > 0) {
            playErrorSound();
            setMistakesCount(m => m + mistakes);
            setStatusMsg(`✦ A small conflict found in ${mistakes === 1 ? 'one square' : mistakes + ' squares'} — take a gentle look.`);
        } else {
            playDigitSound('5');
            setStatusMsg('✨ Looking wonderful! Every square placed so far is in harmony.');
        }
    }, [finished, solution, entries]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;

            const key = e.key;
            if (key >= '1' && key <= '9') {
                e.preventDefault();
                setNumber(Number(key));
            } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
                e.preventDefault();
                setNumber(0);
            } else if (key === 'n' || key === 'N') {
                e.preventDefault();
                setNotesMode(prev => !prev);
                setStatusMsg(prev => prev.includes('Notes') ? 'Notes toggled.' : 'Notes mode changed.');
            } else if (key === 'h' || key === 'H') {
                e.preventDefault();
                handleHint();
            } else if (key === 'c' || key === 'C') {
                e.preventDefault();
                handleCheck();
            } else if ((key === 'z' || key === 'Z') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleUndo();
            } else if (selected >= 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                e.preventDefault();
                const delta = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[key];
                const next = selected + delta;
                if (
                    next >= 0 && next < 81 &&
                    !(key === 'ArrowLeft' && selected % 9 === 0) &&
                    !(key === 'ArrowRight' && selected % 9 === 8)
                ) {
                    setSelected(next);
                    if (cellRefs.current[next]) {
                        cellRefs.current[next].focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selected, setNumber, handleHint, handleCheck, handleUndo]);

    // Check same area (peer)
    const isPeer = (i, sel) => {
        if (sel < 0 || i === sel) return false;
        const r1 = Math.floor(i / 9);
        const c1 = i % 9;
        const b1 = Math.floor(r1 / 3) * 3 + Math.floor(c1 / 3);

        const r2 = Math.floor(sel / 9);
        const c2 = sel % 9;
        const b2 = Math.floor(r2 / 3) * 3 + Math.floor(c2 / 3);

        return r1 === r2 || c1 === c2 || b1 === b2;
    };

    // Format time display
    const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

    // Selected value for same-digit highlights
    const selectedVal = selected >= 0 ? (puzzle[selected] || entries[selected]) : 0;

    return (
        <div className="studio-app-shell">
            {/* Top Navigation Header */}
            <header className="site-header">
                <div className="site-header-inner">
                    <a className="brand" href="#top">
                        <span className="brand-gem" role="img" aria-label="Strawberry">🍓</span>
                        <span className="brand-text">Sakura<strong>Sudoku</strong></span>
                        <span className="brand-chip">🎀 Sweet &amp; Cozy</span>
                    </a>
                    <nav className="site-nav">
                        <a href="#how-to-play">How to play</a>
                        <a href="#project">About</a>
                        <div className="header-controls">
                            <button
                                type="button"
                                className="icon-ctrl-btn"
                                title={soundOn ? "Mute Acoustic Chimes" : "Enable Acoustic Chimes"}
                                onClick={handleSoundToggle}
                            >
                                {soundOn ? "🔔" : "🔕"}
                            </button>
                            <button
                                type="button"
                                className="icon-ctrl-btn"
                                title={isDark ? "Switch to Strawberry Milk" : "Switch to Velvet Berry"}
                                onClick={handleThemeToggle}
                            >
                                {isDark ? "🌸" : "🌙"}
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            <main id="top" className="main-content">
                {/* Hero Banner */}
                <section className="hero">
                    <div className="hero-content">
                        <p className="eyebrow">🍓 SWEET LOGIC • RELAXING MOMENTS</p>
                        <h1 className="hero-title">Sweet numbers, <span className="highlight-text">peaceful minds. 🌸</span></h1>
                        <p className="hero-copy">A cozy, pastel pink puzzle haven. Take a soft breath and unwind with guaranteed-unique puzzles at your own sweet pace.</p>
                    </div>
                    <div className="hero-stamp-wrapper">
                        <div className="hero-stamp-badge">
                            <span className="stamp-grid">9 × 9</span>
                            <span className="stamp-sub">sweet &amp; calm</span>
                        </div>
                        <span className="stamp-star">🌸</span>
                    </div>
                </section>

                {/* Main Game Layout */}
                <section className="game-layout">
                    {/* Primary Game Card */}
                    <div className="game-card">
                        <div className="game-heading" id="game-heading">
                            <div>
                                <p className="card-eyebrow">DAILY SWEETNESS 🍓</p>
                                <h2 className="card-title">Relax &amp; Play 🌸</h2>
                            </div>
                            <div className="heading-actions">
                                <button
                                    className="tour-btn"
                                    type="button"
                                    onClick={() => setTourStep(0)}
                                >
                                    ✨ Quick Tour
                                </button>
                                <div className="timer-badge">
                                    <span className="timer-icon">⏱</span>
                                    <span>{formattedTime}</span>
                                </div>
                            </div>
                        </div>

                        {/* Toolbar: Difficulty + New Game */}
                        <div className="game-toolbar" id="game-toolbar">
                            <div className="difficulty-picker">
                                <label htmlFor="diff-select">Difficulty</label>
                                <select
                                    id="diff-select"
                                    value={difficulty}
                                    onChange={(e) => {
                                        const newDiff = e.target.value;
                                        setDifficulty(newDiff);
                                        startNewGame(newDiff);
                                    }}
                                >
                                    <option value="easy">Easy 🍓</option>
                                    <option value="medium">Medium 🌸</option>
                                    <option value="hard">Hard 🎀</option>
                                    <option value="expert">Expert 💖</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                className="new-game-btn"
                                onClick={() => startNewGame(difficulty)}
                            >
                                New puzzle 💖
                            </button>
                        </div>

                        {/* The 9x9 Sudoku Board */}
                        <div id="board" className="board" role="grid" aria-label="Sudoku board">
                            {Array.from({ length: 81 }, (_, i) => {
                                const row = Math.floor(i / 9);
                                const col = i % 9;
                                const isGiven = !!puzzle[i];
                                const val = puzzle[i] || entries[i];
                                const isSelected = i === selected;
                                const isPeerCell = isPeer(i, selected);
                                const isSameVal = selectedVal > 0 && val === selectedVal;
                                const isConflict = showErrors && entries[i] > 0 && entries[i] !== solution[i];
                                const cellNotes = notes[i] || new Set();

                                const classes = [
                                    'cell',
                                    (col === 2 || col === 5) && 'box-right',
                                    (row === 2 || row === 5) && 'box-bottom',
                                    isGiven && 'given',
                                    isSelected && 'selected',
                                    isPeerCell && 'peer',
                                    isSameVal && 'same',
                                    isConflict && 'conflict'
                                ].filter(Boolean).join(' ');

                                return (
                                    <button
                                        key={i}
                                        ref={el => cellRefs.current[i] = el}
                                        type="button"
                                        className={classes}
                                        role="gridcell"
                                        aria-selected={isSelected}
                                        onClick={() => setSelected(i)}
                                    >
                                        {val > 0 ? (
                                            <span className="digit-val">{val}</span>
                                        ) : cellNotes.size > 0 ? (
                                            <span className="note-grid">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                    <span key={n} className="note-mark">
                                                        {cellNotes.has(n) ? n : ''}
                                                    </span>
                                                ))}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Live Status Pill */}
                        <div className="status-container">
                            <p className="status-text">{statusMsg}</p>
                        </div>

                        {/* Number Pad (1-9) */}
                        <div className="number-pad" id="number-pad" aria-label="Number pad">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    className="num-btn"
                                    onClick={() => setNumber(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        {/* Game Action Buttons */}
                        <div className="game-actions" id="game-actions">
                            <button
                                id="notes-btn"
                                type="button"
                                className={`action-btn ${notesMode ? 'active-mode' : ''}`}
                                onClick={() => {
                                    setNotesMode(m => !m);
                                    setStatusMsg(!notesMode ? 'Notes mode ON 🎀 pencil in possibilities gently.' : 'Notes mode OFF 🌸 placing numbers.');
                                }}
                            >
                                <span className="action-icon">🎀</span>
                                <span className="action-label">Notes {notesMode ? 'On' : 'Off'}</span>
                            </button>
                            <button
                                type="button"
                                className="action-btn"
                                onClick={handleErase}
                            >
                                <span className="action-icon">🫧</span>
                                <span className="action-label">Erase</span>
                            </button>
                            <button
                                type="button"
                                className="action-btn"
                                onClick={handleHint}
                            >
                                <span className="action-icon">💖</span>
                                <span className="action-label">Hint</span>
                            </button>
                            <button
                                type="button"
                                className="action-btn"
                                onClick={handleCheck}
                            >
                                <span className="action-icon">🌸</span>
                                <span className="action-label">Check</span>
                            </button>
                            <button
                                type="button"
                                className="action-btn"
                                onClick={handleUndo}
                                disabled={undoStack.length === 0}
                            >
                                <span className="action-icon">↩️</span>
                                <span className="action-label">Undo</span>
                            </button>
                        </div>
                    </div>

                    {/* Side Card: Guidance & Live Stats */}
                    <aside className="side-card">
                        <span className="side-corner-spark">🌸</span>
                        <p className="side-eyebrow">A SWEET REMINDER 🍓</p>
                        <h2 className="side-title">Every number finds its bloom.</h2>
                        <p className="side-desc">
                            Fill the cozy squares with numbers 1 through 9. Each row, column, and bold 3 × 3 box holds each number once.
                        </p>

                        <div className="quick-tip-box">
                            <strong>🍓 Sweet tip</strong>
                            <p>Start with a row, column, or box that has lots of numbers. Use Notes to jot down possibilities with zero stress.</p>
                        </div>

                        <a href="#how-to-play" className="text-link">
                            Read the gentle guide ➔
                        </a>
                    </aside>
                </section>

                {/* How to Play Section */}
                <section id="how-to-play" className="info-section">
                    <p className="section-eyebrow">THE THREE BLOOMS 🌸</p>
                    <h2 className="section-title">How to enjoy your puzzle</h2>
                    <div className="steps-grid">
                        <article className="step-card">
                            <span className="step-num">01 🍓</span>
                            <h3>Scan the Blooms</h3>
                            <p>Scan a row, column, or 3 × 3 box. Each must contain numbers 1 through 9 with zero repeats.</p>
                        </article>
                        <article className="step-card">
                            <span className="step-num">02 🌸</span>
                            <h3>Pick &amp; Blossom</h3>
                            <p>Click or tap an empty square and select a number from your candy keypad or keyboard.</p>
                        </article>
                        <article className="step-card">
                            <span className="step-num">03 🎀</span>
                            <h3>Pencil &amp; Nudge</h3>
                            <p>Toggle Notes for possibilities. Erase an entry, request a sweet hint, or check your progress at any time.</p>
                        </article>
                    </div>
                    <p className="rule-footer">Prefilled numbers are locked anchors. The puzzle is complete when all 81 squares sit in harmony 🌸.</p>
                </section>

                {/* About Project Section */}
                <section id="project" className="project-card-pink">
                    <div className="project-left">
                        <p className="project-eyebrow">ABOUT SAKURASUDOKU 🍓</p>
                        <h2 className="project-title">Designed for joyful, calming puzzle breaks 🌸</h2>
                    </div>
                    <p className="project-body">
                        SakuraSudoku is a cute, pastel pink puzzle haven designed for mindful daily play. Featuring four sweet difficulty levels, gentle pencil notes, kind hints, acoustic chimes, and smooth responsive touch controls on both mobile and desktop.
                    </p>
                </section>
            </main>

            {/* Footer */}
            <footer className="site-footer">
                <span className="footer-brand">🍓 SakuraSudoku</span>
                <span className="footer-tagline">Made with sweet logic &amp; calm vibes 🌸</span>
            </footer>

            {/* Victory Modal */}
            {finished && (
                <div className="victory-backdrop">
                    <div className="victory-modal">
                        <div className="trophy-emoji">🏆</div>
                        <h2>Puzzle Solved!</h2>
                        <p className="victory-time">Completed in <strong>{formattedTime}</strong></p>
                        <div className="victory-stats-summary">
                            <div><span>Difficulty</span><strong>{difficulty.toUpperCase()}</strong></div>
                            <div><span>Hints</span><strong>{hintsUsed}</strong></div>
                            <div><span>Mistakes</span><strong>{mistakesCount}</strong></div>
                        </div>
                        <div className="victory-modal-actions">
                            <button
                                type="button"
                                className="play-again-btn"
                                onClick={() => startNewGame(difficulty)}
                            >
                                Play Another
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guided Tour Modal */}
            {tourStep >= 0 && (
                <div className="tour-backdrop" onClick={() => setTourStep(-1)}>
                    <div className="tour-modal" onClick={e => e.stopPropagation()}>
                        <div className="tour-step-badge">Step {tourStep + 1} of {TOUR_STEPS.length}</div>
                        <h3>{TOUR_STEPS[tourStep].title}</h3>
                        <p>{TOUR_STEPS[tourStep].text}</p>
                        <div className="tour-actions">
                            <button
                                type="button"
                                className="tour-skip"
                                onClick={() => setTourStep(-1)}
                            >
                                Skip Tour
                            </button>
                            <button
                                type="button"
                                className="tour-next"
                                onClick={() => {
                                    if (tourStep < TOUR_STEPS.length - 1) {
                                        setTourStep(s => s + 1);
                                    } else {
                                        setTourStep(-1);
                                    }
                                }}
                            >
                                {tourStep === TOUR_STEPS.length - 1 ? 'Got it!' : 'Next ➔'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
