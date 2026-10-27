import TimerWithPause from '../timer-with-pause/timer-with-pause';
import MenuButton from '../buttons/menu-button';
import SettingsButton from '../buttons/settings-button';
import HintButton from '../buttons/hint-button';
import FullscreenButton from '../buttons/fullscreen-button';
import ThemeToggleButton from '../buttons/theme-toggle-button';
import SoundToggleButton from '../buttons/sound-toggle-button';

import './status-bar.css';

const stopPropagation = (e) => e.stopPropagation();

function BrandLogo () {
    return (
        <div className="brand-logo-container">
            <a href="./" className="brand-link" title="NovaSudoku — Home">
                <svg className="brand-icon" viewBox="0 0 36 36" width="32" height="32" fill="none">
                    <defs>
                        <linearGradient id="novaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="50%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                        <linearGradient id="novaGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>
                    <rect x="2" y="2" width="32" height="32" rx="9" fill="url(#novaGrad1)" />
                    {/* 3x3 Micro Sudoku Grid Motif */}
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
                <div className="brand-text">
                    <span className="brand-nova">NOVA</span>
                    <span className="brand-sudoku">SUDOKU</span>
                </div>
            </a>
        </div>
    );
}

function StatusBar ({
    showTimer, startTime, intervalStartTime, endTime, pausedAt, hintsUsedCount,
    showPencilmarks, menuHandler, pauseHandler, initialDigits,
    isDark, onToggleTheme
}) {
    const timer = showTimer
        ? (
            <TimerWithPause
                startTime={startTime}
                intervalStartTime={intervalStartTime}
                endTime={endTime}
                pausedAt={pausedAt}
                pauseHandler={pauseHandler}
                hintsUsedCount={hintsUsedCount}
            />
        )
        : null;

    return (
        <header className="status-bar" onMouseDown={stopPropagation}>
            <BrandLogo />
            {timer}
            <div className="status-bar-buttons">
                <SoundToggleButton />
                <ThemeToggleButton isDark={isDark} onToggleTheme={onToggleTheme} />
                <FullscreenButton />
                <HintButton menuHandler={menuHandler} />
                <SettingsButton menuHandler={menuHandler} />
                <MenuButton
                    initialDigits={initialDigits}
                    showPencilmarks={showPencilmarks}
                    menuHandler={menuHandler}
                />
            </div>
        </header>
    );
}

export default StatusBar;
