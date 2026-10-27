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
        setStatusMsg('New game started. Choose a square, then enter a number.');
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
            setStatusMsg('🎉 Puzzle Solved! Magnificent logic!');
            launchConfetti();
            playVictoryFanfare();
        } else {
            setStatusMsg(`Placed ${number}. Keep going!`);
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
            setStatusMsg('All placed numbers are already correct!');
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
        setStatusMsg(`💡 Hint: Row ${r}, Column ${c} is ${correctVal}.`);

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
            setStatusMsg(`⚠️ ${mistakes} ${mistakes === 1 ? 'entry needs' : 'entries need'} another look. Red squares highlight conflicts.`);
        } else {
            playDigitSound('5');
            setStatusMsg('✨ Looking good! No mistakes detected so far.');
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
                        <div className="brand-gem">
                            <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
                                <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#brandGrad)" />
                                <rect x="6" y="6" width="5.5" height="5.5" rx="1.5" fill="#ffffff" />
                                <rect x="13.25" y="13.25" width="5.5" height="5.5" rx="1.5" fill="#38bdf8" />
                                <rect x="20.5" y="20.5" width="5.5" height="5.5" rx="1.5" fill="#ffffff" />
                                <defs>
                                    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#38bdf8" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span>Nova<strong>Sudoku</strong></span>
                        <span className="brand-chip">Studio</span>
                    </a>
                    <nav className="site-nav">
                        <a href="#how-to-play">How to Play</a>
                        <a href="#project">About</a>
                        <div className="header-controls">
                            <button
                                type="button"
                                className="icon-ctrl-btn"
                                title={soundOn ? "Mute Audio" : "Enable Audio"}
                                onClick={handleSoundToggle}
                            >
                                {soundOn ? "🔊" : "🔇"}
                            </button>
                            <button
                                type="button"
                                className="icon-ctrl-btn"
                                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                onClick={handleThemeToggle}
                            >
                                {isDark ? "☀️" : "🌙"}
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            <main id="top" className="main-content">
                {/* Hero Banner */}
                <section className="hero">
                    <div className="hero-content">
                        <p className="eyebrow">✦ PURE LOGIC • SUBLIME SATISFACTION</p>
                        <h1 className="hero-title">Make room for <em>one more number.</em></h1>
                        <p className="hero-copy">Grab your keyboard or tap away. A crisp, guaranteed-unique puzzle awaits your intuition.</p>
                    </div>
                    <div className="hero-badge">
                        <span className="badge-spark">✧</span>
                        <span className="badge-grid">9 × 9</span>
                        <small className="badge-sub">one clear goal</small>
                    </div>
                </section>

                {/* Main Game Layout */}
                <section className="game-layout">
                    {/* Primary Game Card */}
                    <div className="game-card">
                        <div className="game-heading" id="game-heading">
                            <div>
                                <p className="card-eyebrow">YOUR PUZZLE</p>
                                <h2 className="card-title">Let's play.</h2>
                            </div>
                            <div className="heading-actions">
                                <button
                                    className="tour-btn"
                                    type="button"
                                    onClick={() => setTourStep(0)}
                                >
                                    ✦ Take a tour
                                </button>
                                <div className="timer-badge">
                                    <span className="timer-dot"></span>
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
                                    <option value="easy">Easy (Relaxing)</option>
                                    <option value="medium">Medium (Balanced)</option>
                                    <option value="hard">Hard (Challenging)</option>
                                    <option value="expert">Expert (Master)</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                className="new-game-btn"
                                onClick={() => startNewGame(difficulty)}
                            >
                                New game
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
                                    setStatusMsg(!notesMode ? 'Notes mode ON: pencil in candidates.' : 'Notes mode OFF: place numbers.');
                                }}
                            >
                                <span className="action-icon">✏️</span>
                                <span className="action-label">Notes {notesMode ? '• ON' : ''}</span>
                            </button>
                            <button
                                type="button"
                                className="action-btn"
                                onClick={handleErase}
                            >
                                <span className="action-icon">🧹</span>
                                <span className="action-label">Erase</span>
                            </button>
                            <button
                                type="button"
                                className="action-btn"
                                onClick={handleHint}
                            >
                                <span className="action-icon">💡</span>
                                <span className="action-label">Hint</span>
                            </button>
                            <button
                                type="button"
                                className="action-btn"
                                onClick={handleCheck}
                            >
                                <span className="action-icon">✅</span>
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
                        <div className="side-badge">💡</div>
                        <p className="card-eyebrow">MASTER THE LOGIC</p>
                        <h2 className="side-title">Every square has a place.</h2>
                        <p className="side-desc">
                            Fill empty squares with numbers <strong>1 through 9</strong>. Every horizontal row, vertical column, and bold 3 × 3 box must contain each number exactly once.
                        </p>

                        <div className="quick-tip-box">
                            <strong>✦ Pro Tip</strong>
                            <p>Look for lines or 3x3 blocks with the most prefilled numbers first. Toggle Notes to narrow down possibilities.</p>
                        </div>

                        <div className="live-stats-box">
                            <div className="stat-row">
                                <span className="stat-name">Difficulty:</span>
                                <span className="stat-badge">{difficulty.toUpperCase()}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-name">Hints Used:</span>
                                <span className="stat-val">{hintsUsed}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-name">Mistakes Flagged:</span>
                                <span className="stat-val">{mistakesCount}</span>
                            </div>
                        </div>

                        <a href="#how-to-play" className="text-link">
                            Read the complete rules ➔
                        </a>
                    </aside>
                </section>

                {/* How to Play Section */}
                <section id="how-to-play" className="info-section">
                    <p className="section-eyebrow">THE RULES</p>
                    <h2 className="section-title">How to play Sudoku</h2>
                    <div className="steps-grid">
                        <article className="step-card">
                            <span className="step-num">01</span>
                            <h3>Scan for Missing Numbers</h3>
                            <p>Check any row, column, or 3 × 3 box. Each zone must feature numbers 1 through 9 with zero repeats.</p>
                        </article>
                        <article className="step-card">
                            <span className="step-num">02</span>
                            <h3>Select & Enter</h3>
                            <p>Click or tap an empty square, then choose a number from the keypad or your physical keyboard (1–9).</p>
                        </article>
                        <article className="step-card">
                            <span className="step-num">03</span>
                            <h3>Note & Deduce</h3>
                            <p>Turn on Notes to pencil candidates. Use Hint for logical explanations, or Check to highlight mistakes.</p>
                        </article>
                    </div>
                    <p className="rule-footer">Prefilled numbers are locked and cannot be edited. The puzzle is complete when all 81 squares are filled correctly.</p>
                </section>

                {/* About Project Section */}
                <section id="project" className="project-section">
                    <div className="project-header">
                        <p className="section-eyebrow">ABOUT NOVASUDOKU</p>
                        <h2 className="section-title">Designed for a calmer, focused puzzle break.</h2>
                    </div>
                    <p className="project-body">
                        NovaSudoku combines high-speed procedural puzzle generation, intelligent client-side hint deduction, tactile acoustic feedback, and responsive layouts across desktop and mobile. Built with modern React and web standards.
                    </p>
                </section>
            </main>

            {/* Footer */}
            <footer className="site-footer">
                <span className="footer-brand">NovaSudoku</span>
                <span className="footer-tagline">A little progress, one square at a time.</span>
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
