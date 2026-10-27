// NovaSudoku Interactive Guided Tour Steps

export const TOUR_STEPS = [
    {
        title: "Welcome to NovaSudoku",
        text: "Let's take a quick 30-second walkthrough of the board and controls.",
        target: "game-heading",
    },
    {
        title: "Difficulty & New Game",
        text: "Select your preferred difficulty (Easy, Medium, Hard, Expert) and tap 'New Game' to generate an instant unique puzzle.",
        target: "game-toolbar",
    },
    {
        title: "The 9x9 Sudoku Grid",
        text: "Tap or click any empty square. The row, column, and 3x3 block highlight automatically to guide your focus.",
        target: "board",
    },
    {
        title: "Number Pad",
        text: "Use these number buttons or your physical keyboard (keys 1-9) to place a number into the selected square.",
        target: "number-pad",
    },
    {
        title: "Pencil Notes Mode",
        text: "Toggle Notes mode on or hold Shift to pencil in possible candidates. As you solve, candidates help narrow down deductions.",
        target: "notes-btn",
    },
    {
        title: "Smart Hints & Checks",
        text: "Stuck? Tap 'Hint' for intelligent deductive step explanations, or 'Check' to verify your current board for conflicts.",
        target: "game-actions",
    },
];
