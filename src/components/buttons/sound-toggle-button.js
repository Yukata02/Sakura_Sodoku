import { useState, useCallback } from 'react';
import { isSoundEnabled, toggleSound } from '../../lib/sound-effects';

export default function SoundToggleButton() {
    const [soundOn, setSoundOn] = useState(isSoundEnabled());

    const clickHandler = useCallback((e) => {
        e.stopPropagation();
        const newState = toggleSound();
        setSoundOn(newState);
    }, []);

    return (
        <button
            type="button"
            className="sound-toggle-btn"
            title={soundOn ? "Mute Sound Effects" : "Enable Sound Effects"}
            onClick={clickHandler}
            aria-label="Toggle Sound"
        >
            {soundOn ? (
                // Speaker with waves
                <svg className="button-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
            ) : (
                // Muted speaker
                <svg className="button-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
            )}
        </button>
    );
}
