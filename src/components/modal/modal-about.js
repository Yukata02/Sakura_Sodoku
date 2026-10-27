import projectPackageJson from '../../../package.json';

const appVersion = projectPackageJson.version || "1.0.32";

export default function ModalAbout({modalHandler}) {
    const closeHandler = () => modalHandler('cancel');
    const thisYear = (new Date()).getFullYear();

    return (
        <div className="modal about">
            <div className="about-header">
                <div className="about-icon-badge">
                    <svg viewBox="0 0 36 36" width="44" height="44" fill="none">
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
                <h1>NovaSudoku</h1>
                <p className="app-subtitle">The Modern Pure Logic Experience</p>
                <div className="version-pill">v{appVersion} • Revamped Edition</div>
            </div>

            <div className="about-content">
                <p>
                    <strong>NovaSudoku</strong> is an elegant, high-performance web application designed for solving, mastering, and sharing Sudoku puzzles in pure, uninterrupted flow.
                </p>
                <p>
                    Featuring real-time conflict detection, dual pencil marking, step-by-step logical hints, synthesized acoustic feedback, and quick-toggle themes.
                </p>
                <p className="license-info">
                    Free & Open Source under the terms of the GNU Affero General Public License v3 (<a href="https://opensource.org/licenses/AGPL-3.0" target="_blank" rel="noreferrer">AGPLv3</a>). Based on the original SudokuExchange codebase by <a href="https://grantm.github.io/" target="_blank" rel="noreferrer">Grant McLean</a>.
                </p>
                <p className="copyright-info">Copyright © 2020–{thisYear} NovaSudoku / SudokuExchange Contributors</p>
            </div>

            <div className="buttons">
                <button className="primary" onClick={closeHandler} autoFocus>Close</button>
            </div>
        </div>
    );
}
