import { useCallback, useEffect } from 'react';

import { secondsAsHMS } from '../../lib/string-utils';
import { launchConfetti } from '../../lib/confetti';
import { playVictoryFanfare } from '../../lib/sound-effects';

import "./solved-puzzle-options.css";

export default function SolvedPuzzleOptions({elapsedTime, hintsUsedCount, menuHandler}) {
    useEffect(() => {
        launchConfetti();
        playVictoryFanfare();
    }, []);

    const clickHandler = useCallback(
        e => {
            const menuAction = e.target.dataset.menuAction;
            if (menuAction) {
                e.preventDefault();
                menuHandler(menuAction);
            }
        },
        [menuHandler]
    );

    return (
        <div className="solved-puzzle-options" onClick={clickHandler}>
            <div className="victory-icon-wrapper">
                <div className="victory-trophy">🏆</div>
            </div>

            <div className="victory-header">
                <h2>Puzzle Solved!</h2>
                <p className="victory-sub">Brilliant logic & precision</p>
            </div>

            <div className="victory-stats">
                <div className="stat-card">
                    <span className="stat-label">TIME</span>
                    <span className="stat-val">{secondsAsHMS(elapsedTime)}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">HINTS</span>
                    <span className="stat-val">{hintsUsedCount}</span>
                </div>
            </div>

            <div className="victory-actions">
                <button className="victory-btn primary-action" data-menu-action="show-share-modal">
                    Share Puzzle
                </button>
                <a href="./" className="victory-btn accent-action">
                    New Puzzle
                </a>
                <button className="victory-btn secondary-action" data-menu-action="restart-puzzle">
                    Restart
                </button>
            </div>
        </div>
    );
}
