document.addEventListener('DOMContentLoaded', () => {
    // These lines must run AFTER the DOM is loaded.
    const chessboard = document.getElementById('chessboard');
    const statusText = document.getElementById('status-text');
    const resetButton = document.getElementById('reset-button');

    // This will now only run if the above elements were found.
    if (!chessboard || !statusText || !resetButton) {
        console.error("Critical HTML elements not found. Check your HTML file for missing IDs.");
        return;
    }

    const boardState = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ];

    // CORRECTED: Uses solid pieces for both colors
    const pieceSymbols = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚', 'P': '♟'
    };

    let selectedPiece = null;
    let selectedSquare = null;
    let currentPlayer = 'white';
    let validMoves = [];

    function renderBoard() {
        chessboard.innerHTML = ''; // This is line 28 where the error occurred
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = boardState[row][col];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.classList.add('piece');
                    pieceElement.textContent = pieceSymbols[piece];
                    // CORRECTED: Sets visible colors for solid pieces
                    pieceElement.style.color = (piece === piece.toUpperCase()) ? '#FFFFFF' : '#000000';
                    square.appendChild(pieceElement);
                }
                
                square.addEventListener('click', onSquareClick);
                chessboard.appendChild(square);
            }
        }

        if (selectedSquare) {
            const el = getSquareElement(selectedSquare.row, selectedSquare.col);
            if (el) el.classList.add('selected');
        }
        validMoves.forEach(({row, col}) => {
             const el = getSquareElement(row, col);
             if (el) el.classList.add('valid-move');
        });
    }
    
    function onSquareClick(event) {
        const square = event.currentTarget;
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = boardState[row][col];

        if (selectedPiece) {
            const move = validMoves.find(m => m.row === row && m.col === col);
            if (move) {
                movePiece(selectedSquare, { row, col });
                resetSelection();
                switchPlayer();
            } else {
                resetSelection();
                if (piece && isPlayerPiece(piece, currentPlayer)) {
                    selectPiece(row, col, piece);
                }
            }
        } else {
            if (piece && isPlayerPiece(piece, currentPlayer)) {
                selectPiece(row, col, piece);
            }
        }
        renderBoard();
    }
    
    function isPlayerPiece(piece, player) {
        if (!piece) return false;
        return player === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
    }
    
    function selectPiece(row, col, piece) {
        selectedPiece = piece;
        selectedSquare = { row, col };
        validMoves = getValidMoves(row, col, piece);
    }
    
    function resetSelection() {
        selectedPiece = null;
        selectedSquare = null;
        validMoves = [];
    }
    
    function movePiece(from, to) {
        boardState[to.row][to.col] = boardState[from.row][from.col];
        boardState[from.row][from.col] = null;
    }
    
    function switchPlayer() {
        currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
        statusText.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
    }
    
    function getValidMoves(row, col, piece) {
        const moves = [];
        const isWhite = piece === piece.toUpperCase();
        
        if (piece.toLowerCase() === 'p') {
            const direction = isWhite ? -1 : 1;
            const startRow = isWhite ? 6 : 1;
            
            if (row + direction >= 0 && row + direction < 8 && !boardState[row + direction][col]) {
                moves.push({ row: row + direction, col });
            }
            
            if (row === startRow && !boardState[row + direction][col] && !boardState[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }

            [-1, 1].forEach(side => {
                if (col + side >= 0 && col + side < 8) {
                    const targetPiece = boardState[row + direction]?.[col + side];
                    if (targetPiece && !isPlayerPiece(targetPiece, currentPlayer)) {
                        moves.push({row: row + direction, col: col + side});
                    }
                }
            });
        }
        
        return moves;
    }

    function getSquareElement(row, col) {
        return chessboard.querySelector(`[data-row='${row}'][data-col='${col}']`);
    }

    function resetGame() {
        window.location.reload();
    }
    
    resetButton.addEventListener('click', resetGame);

    renderBoard();
});

