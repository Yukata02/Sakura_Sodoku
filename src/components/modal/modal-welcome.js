import { useState } from 'react';

import { modelHelpers } from '../../lib/sudoku-model';
import { compressPuzzleDigits } from '../../lib/string-utils';

import SudokuMiniGrid from '../sudoku-grid/sudoku-mini-grid';
import Spinner from '../spinner/spinner';

function stopPropagation (e) {
    e.stopPropagation();
}

const PRESET_PUZZLES = [
    {
        level: "1",
        name: "Easy",
        tag: "Relaxed",
        desc: "Ideal for warm-up and fast-paced logic.",
        digits: "003020600900305001001806400008102900700000008006708200002609500800203009005010300",
        rating: "1.2",
    },
    {
        level: "2",
        name: "Medium",
        tag: "Balanced",
        desc: "Requires singles, pairs, and pointing lines.",
        digits: "020608000580009700000040000370000500600000004008000013000020000009800036000306090",
        rating: "2.4",
    },
    {
        level: "3",
        name: "Hard",
        tag: "Challenging",
        desc: "Requires advanced candidate elimination & wings.",
        digits: "000000012000000003002300400001800005060070800000009000008500000900040500470006000",
        rating: "3.6",
    },
    {
        level: "4",
        name: "Diabolical",
        tag: "Expert",
        desc: "Unforgiving pure logic with complex chaining.",
        digits: "800000000003600000070090200050007000000045700000100030001000068008500010090000400",
        rating: "4.8",
    },
];

function DifficultyCards() {
    return (
        <div className="difficulty-grid">
            {PRESET_PUZZLES.map((p) => {
                const url = `./?s=${p.digits}&d=${p.level}`;
                return (
                    <a key={p.level} href={url} className={`diff-card diff-card-${p.level}`}>
                        <div className="diff-card-header">
                            <span className="diff-title">{p.name}</span>
                            <span className="diff-badge">{p.tag}</span>
                        </div>
                        <p className="diff-desc">{p.desc}</p>
                        <div className="diff-action">
                            <span>Play Now</span>
                            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </a>
                );
            })}
        </div>
    );
}

function RecentlySharedSection ({level, puzzles, showRatings, shortenLinks}) {
    const [collapsed, setCollapsed] = useState(true);
    const levelName = modelHelpers.difficultyLevelName(level);
    if (!levelName || !puzzles || puzzles.length < 1) {
        return null;
    }
    const puzzleLinks = puzzles.map((puzzle, i) => {
        const puzzleString = shortenLinks
            ? compressPuzzleDigits(puzzle.digits || puzzle)
            : (puzzle.digits || puzzle);
        return (
            <li key={i}>
                <a href={`./?s=${puzzleString}&d=${level}&i=${i+1}`} onClick={stopPropagation}>
                    <SudokuMiniGrid puzzle={puzzle} showRatings={showRatings} />
                </a>
            </li>
        );
    });
    const classes = `section ${collapsed ? 'collapsed' : ''}`;
    const clickHandler = () => setCollapsed(old => !old);
    return (
        <div className={classes} onClick={clickHandler}>
            <h2>{levelName}</h2>
            <ul>
                {puzzleLinks}
            </ul>
        </div>
    );
}

function RecentlyShared({modalState}) {
    if (modalState.loadingFailed) {
        return null; // Don't show network failure banner if backend isn't hosted
    }
    else if (modalState.loading) {
        return <Spinner />;
    }
    const {recentlyShared} = modalState;
    if (!recentlyShared) return null;

    const sections = ['1', '2', '3', '4'].map(level => {
        return <RecentlySharedSection
            key={level}
            level={level}
            puzzles={recentlyShared[level]}
            showRatings={modalState.showRatings}
            shortenLinks={modalState.shortenLinks}
        />;
    });

    return (
        <div className="recently-shared-container">
            <h3 className="section-subtitle">Community Shared Puzzles</h3>
            <div className="recently-shared">
                {sections}
            </div>
        </div>
    );
}

function CountBadge ({count}) {
    return <span className="count-badge">{count}</span>;
}

function SavedPuzzlesButton({savedPuzzles, modalHandler}) {
    if (!savedPuzzles || savedPuzzles.length === 0) {
        return null;
    }
    const savedPuzzlesHandler = () => modalHandler("show-saved-puzzles-modal");
    return (
        <button className="secondary new-puzzle resume-btn" onClick={savedPuzzlesHandler}>
            <span>Resume in Progress</span>
            <CountBadge count={savedPuzzles.length} />
        </button>
    );
}

function ModalWelcome({modalState, modalHandler}) {
    const {savedPuzzles} = modalState;
    const cancelHandler = () => modalHandler('cancel');
    const showPasteHandler = () => modalHandler('show-paste-modal');

    return (
        <div className="modal welcome">
            <div className="welcome-banner">
                <div className="welcome-logo-badge">
                    <svg viewBox="0 0 36 36" width="46" height="46" fill="none">
                        <rect x="2" y="2" width="32" height="32" rx="9" fill="url(#novaGrad1)" />
                        <rect x="6" y="6" width="6.5" height="6.5" rx="2" fill="#ffffff" fillOpacity="0.95" />
                        <rect x="14.75" y="6" width="6.5" height="6.5" rx="2" fill="#ffffff" fillOpacity="0.45" />
                        <rect x="23.5" y="6" width="6.5" height="6.5" rx="2" fill="#ffffff" fillOpacity="0.45" />
                        <rect x="6" y="14.75" width="6.5" height="6.5" rx="2" fill="#ffffff" fillOpacity="0.45" />
                        <rect x="14.75" y="14.75" width="6.5" height="6.5" rx="2" fill="url(#novaGrad2)" />
                        <rect x="23.5" y="14.75" width="6.5" height="6.5" rx="2" fill="#ffffff" fillOpacity="0.9" />
                        <rect x="6" y="23.5" width="6.5" height="6.5" rx="2" fill="#ffffff" fillOpacity="0.45" />
                        <rect x="14.75" y="23.5" width="6.5" height="6.5" rx="2" fill="#ffffff" fillOpacity="0.9" />
                        <rect x="23.5" y="23.5" width="6.5" height="6.5" rx="2" fill="#ffffff" fillOpacity="0.45" />
                    </svg>
                </div>
                <h1>Welcome to NovaSudoku</h1>
                <p className="welcome-tagline">Choose a difficulty or start with your own puzzle</p>
            </div>

            <DifficultyCards />

            <div className="welcome-action-strip">
                <button className="outline-btn" onClick={cancelHandler}>
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Blank Grid
                </button>
                <button className="outline-btn" onClick={showPasteHandler}>
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 2H9a3 3 0 01-3-2z" />
                    </svg>
                    Paste Puzzle
                </button>
                <SavedPuzzlesButton savedPuzzles={savedPuzzles} modalHandler={modalHandler} />
            </div>

            <RecentlyShared modalState={modalState} />
        </div>
    );
}

export default ModalWelcome;
