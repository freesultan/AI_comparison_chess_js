document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const statusDisplay = document.getElementById('status');
    const resetButton = document.getElementById('reset-btn');
    const promotionModal = document.getElementById('promotion-modal');
    
    let selectedPiece = null;
    let currentPlayer = 'white';
    let possibleMoves = [];
    let waitingForPromotion = false;
    let promotionSquare = null;
    let whiteKingPosition = { row: 7, col: 4 };
    let blackKingPosition = { row: 0, col: 4 };
    let lastMove = { from: null, to: null };
    
    // Chess board representation
    let board = [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];

    // Create the chessboard
    function createBoard() {
        chessboard.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
                square.dataset.row = row;
                square.dataset.col = col;
                
                if (board[row][col]) {
                    square.textContent = getPieceSymbol(board[row][col]);
                }
                
                square.addEventListener('click', () => handleSquareClick(row, col));
                chessboard.appendChild(square);
            }
        }
        
        createCoordinates();
        updateBoardState();
    }

    // Create algebraic notation coordinates
    function createCoordinates() {
        const leftCoords = document.getElementById('coordinates-left');
        const rightCoords = document.getElementById('coordinates-right');
        const topCoords = document.getElementById('coordinates-top');
        const bottomCoords = document.getElementById('coordinates-bottom');
        
        leftCoords.innerHTML = '';
        rightCoords.innerHTML = '';
        topCoords.innerHTML = '';
        bottomCoords.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            // Rows (8 to 1)
            const leftCoord = document.createElement('div');
            leftCoord.classList.add('coordinate');
            leftCoord.textContent = 8 - i;
            leftCoords.appendChild(leftCoord);
            
            const rightCoord = document.createElement('div');
            rightCoord.classList.add('coordinate');
            rightCoord.textContent = 8 - i;
            rightCoords.appendChild(rightCoord);
            
            // Columns (a to h)
            const topCoord = document.createElement('div');
            topCoord.classList.add('coordinate');
            topCoord.textContent = String.fromCharCode(97 + i);
            topCoords.appendChild(topCoord);
            
            const bottomCoord = document.createElement('div');
            bottomCoord.classList.add('coordinate');
            bottomCoord.textContent = String.fromCharCode(97 + i);
            bottomCoords.appendChild(bottomCoord);
        }
    }

    // Get the Unicode symbol for a piece
    function getPieceSymbol(piece) {
        const symbols = {
            'wP': '♙', 'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔',
            'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
        };
        return symbols[piece];
    }

    // Handle square click
    function handleSquareClick(row, col) {
        if (waitingForPromotion) return;
        
        const clickedPiece = board[row][col];
        const pieceColor = clickedPiece.charAt(0) === 'w' ? 'white' : 'black';
        
        // If a piece is already selected
        if (selectedPiece) {
            const moveIndex = possibleMoves.findIndex(move => 
                move.row === row && move.col === col
            );
            
            if (moveIndex !== -1) {
                // Move the piece
                const { fromRow, fromCol } = selectedPiece;
                movePiece(fromRow, fromCol, row, col);
                resetSelection();
            } else if (clickedPiece && pieceColor === currentPlayer) {
                // Select a different piece of the same color
                selectPiece(row, col);
            } else {
                resetSelection();
            }
        } 
        // If no piece is selected yet
        else if (clickedPiece && pieceColor === currentPlayer) {
            selectPiece(row, col);
        }
    }

    // Select a piece and show possible moves
    function selectPiece(row, col) {
        resetSelection();
        
        const piece = board[row][col];
        if (!piece || piece.charAt(0) !== (currentPlayer === 'white' ? 'w' : 'b')) return;
        
        selectedPiece = { fromRow: row, fromCol: col, type: piece };
        
        // Highlight the selected square
        const selectedSquare = getSquareElement(row, col);
        selectedSquare.classList.add('selected');
        
        // Get and highlight possible moves
        possibleMoves = getValidMoves(row, col);
        highlightPossibleMoves();
    }

    // Reset the current selection
    function resetSelection() {
        selectedPiece = null;
        possibleMoves = [];
        
        // Remove all highlights
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected');
            square.classList.remove('highlighted');
        });
    }

    // Highlight possible moves
    function highlightPossibleMoves() {
        possibleMoves.forEach(move => {
            const square = getSquareElement(move.row, move.col);
            square.classList.add('highlighted');
        });
    }

    // Get square element by row and col
    function getSquareElement(row, col) {
        return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    }

    // Move a piece
    function movePiece(fromRow, fromCol, toRow, toCol) {
        const movingPiece = board[fromRow][fromCol];
        const pieceType = movingPiece.charAt(1);
        
        // Handle pawn promotion
        if (pieceType === 'P' && ((movingPiece.charAt(0) === 'w' && toRow === 0) || 
                                 (movingPiece.charAt(0) === 'b' && toRow === 7))) {
            board[toRow][toCol] = movingPiece;  // Temporarily place pawn
            board[fromRow][fromCol] = '';
            waitingForPromotion = true;
            promotionSquare = { row: toRow, col: toCol };
            showPromotionDialog();
            return;
        }
        
        // Update king position if king is moved
        if (pieceType === 'K') {
            if (movingPiece.charAt(0) === 'w') {
                whiteKingPosition = { row: toRow, col: toCol };
            } else {
                blackKingPosition = { row: toRow, col: toCol };
            }
        }
        
        // Make the move
        board[toRow][toCol] = movingPiece;
        board[fromRow][fromCol] = '';
        
        // Save the last move
        lastMove = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol }
        };
        
        // Switch turns
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
        
        updateBoardState();
        checkForCheckmate();
    }

    // Get valid moves for a piece
    function getValidMoves(row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        
        const pieceColor = piece.charAt(0);
        const pieceType = piece.charAt(1);
        const moves = [];
        
        switch (pieceType) {
            case 'P': // Pawn
                getPawnMoves(row, col, pieceColor, moves);
                break;
            case 'R': // Rook
                getRookMoves(row, col, pieceColor, moves);
                break;
            case 'N': // Knight
                getKnightMoves(row, col, pieceColor, moves);
                break;
            case 'B': // Bishop
                getBishopMoves(row, col, pieceColor, moves);
                break;
            case 'Q': // Queen
                getRookMoves(row, col, pieceColor, moves);
                getBishopMoves(row, col, pieceColor, moves);
                break;
            case 'K': // King
                getKingMoves(row, col, pieceColor, moves);
                break;
        }
        
        // Filter out moves that would put or leave the king in check
        return moves.filter(move => {
            const tempBoard = JSON.parse(JSON.stringify(board));
            const movingPiece = tempBoard[row][col];
            
            // Temporarily make the move
            tempBoard[move.row][move.col] = movingPiece;
            tempBoard[row][col] = '';
            
            // Check if the king is in check after this move
            const kingPos = pieceColor === 'w' ? { ...whiteKingPosition } : { ...blackKingPosition };
            if (pieceType === 'K') {
                kingPos.row = move.row;
                kingPos.col = move.col;
            }
            
            return !isSquareUnderAttack(kingPos.row, kingPos.col, pieceColor, tempBoard);
        });
    }

    // Get pawn moves
    function getPawnMoves(row, col, color, moves) {
        const direction = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        
        // Move forward one square
        if (isInBounds(row + direction, col) && !board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            // Move forward two squares from the starting position
            if (row === startRow && !board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        // Capture diagonally
        const captureOffsets = [{ r: direction, c: -1 }, { r: direction, c: 1 }];
        captureOffsets.forEach(offset => {
            const newRow = row + offset.r;
            const newCol = col + offset.c;
            if (isInBounds(newRow, newCol) && board[newRow][newCol] && 
                board[newRow][newCol].charAt(0) !== color) {
                moves.push({ row: newRow, col: newCol });
            }
        });
    }

    // Get rook moves
    function getRookMoves(row, col, color, moves) {
        const directions = [
            { r: -1, c: 0 }, // Up
            { r: 1, c: 0 },  // Down
            { r: 0, c: -1 }, // Left
            { r: 0, c: 1 }   // Right
        ];
        
        getStraightLineMoves(row, col, color, moves, directions);
    }

    // Get bishop moves
    function getBishopMoves(row, col, color, moves) {
        const directions = [
            { r: -1, c: -1 }, // Up-Left
            { r: -1, c: 1 },  // Up-Right
            { r: 1, c: -1 },  // Down-Left
            { r: 1, c: 1 }    // Down-Right
        ];
        
        getStraightLineMoves(row, col, color, moves, directions);
    }

    // Helper for straight line moves (rook, bishop, queen)
    function getStraightLineMoves(row, col, color, moves, directions) {
        directions.forEach(dir => {
            let newRow = row + dir.r;
            let newCol = col + dir.c;
            
            while (isInBounds(newRow, newCol)) {
                const targetPiece = board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.charAt(0) !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                
                newRow += dir.r;
                newCol += dir.c;
            }
        });
    }

    // Get knight moves
    function getKnightMoves(row, col, color, moves) {
        const knightOffsets = [
            { r: -2, c: -1 }, { r: -2, c: 1 },
            { r: -1, c: -2 }, { r: -1, c: 2 },
            { r: 1, c: -2 }, { r: 1, c: 2 },
            { r: 2, c: -1 }, { r: 2, c: 1 }
        ];
        
        knightOffsets.forEach(offset => {
            const newRow = row + offset.r;
            const newCol = col + offset.c;
            
            if (isInBounds(newRow, newCol) && 
                (!board[newRow][newCol] || board[newRow][newCol].charAt(0) !== color)) {
                moves.push({ row: newRow, col: newCol });
            }
        });
    }

    // Get king moves
    function getKingMoves(row, col, color, moves) {
        const kingOffsets = [
            { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
            { r: 0, c: -1 }, { r: 0, c: 1 },
            { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 }
        ];
        
        kingOffsets.forEach(offset => {
            const newRow = row + offset.r;
            const newCol = col + offset.c;
            
            if (isInBounds(newRow, newCol) && 
                (!board[newRow][newCol] || board[newRow][newCol].charAt(0) !== color)) {
                moves.push({ row: newRow, col: newCol });
            }
        });
    }

    // Helper to check if coordinates are on the board
    function isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // Check if a square is under attack by an opponent
    function isSquareUnderAttack(row, col, pieceColor, boardState = board) {
        const opponentColor = pieceColor === 'w' ? 'b' : 'w';
        
        // Check for pawn attacks
        const pawnDirection = pieceColor === 'w' ? 1 : -1;
        const pawnOffsets = [{ r: pawnDirection, c: -1 }, { r: pawnDirection, c: 1 }];
        
        for (const offset of pawnOffsets) {
            const checkRow = row + offset.r;
            const checkCol = col + offset.c;
            
            if (isInBounds(checkRow, checkCol) && 
                boardState[checkRow][checkCol] === opponentColor + 'P') {
                return true;
            }
        }
        
        // Check for knight attacks
        const knightOffsets = [
            { r: -2, c: -1 }, { r: -2, c: 1 },
            { r: -1, c: -2 }, { r: -1, c: 2 },
            { r: 1, c: -2 }, { r: 1, c: 2 },
            { r: 2, c: -1 }, { r: 2, c: 1 }
        ];
        
        for (const offset of knightOffsets) {
            const checkRow = row + offset.r;
            const checkCol = col + offset.c;
            
            if (isInBounds(checkRow, checkCol) && 
                boardState[checkRow][checkCol] === opponentColor + 'N') {
                return true;
            }
        }
        
        // Check for king attacks
        const kingOffsets = [
            { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
            { r: 0, c: -1 }, { r: 0, c: 1 },
            { r: 1, c: -1 }, { r: 1, c: 0 }, { r: 1, c: 1 }
        ];
        
        for (const offset of kingOffsets) {
            const checkRow = row + offset.r;
            const checkCol = col + offset.c;
            
            if (isInBounds(checkRow, checkCol) && 
                boardState[checkRow][checkCol] === opponentColor + 'K') {
                return true;
            }
        }
        
        // Check for attacks along straight lines (rook, queen)
        const straightDirections = [
            { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }
        ];
        
        for (const dir of straightDirections) {
            if (checkLineAttack(row, col, dir.r, dir.c, pieceColor, ['R', 'Q'], boardState)) {
                return true;
            }
        }
        
        // Check for attacks along diagonals (bishop, queen)
        const diagonalDirections = [
            { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
        ];
        
        for (const dir of diagonalDirections) {
            if (checkLineAttack(row, col, dir.r, dir.c, pieceColor, ['B', 'Q'], boardState)) {
                return true;
            }
        }
        
        return false;
    }

    // Helper for checking attacks along a line
    function checkLineAttack(row, col, rowDir, colDir, pieceColor, pieceTypes, boardState) {
        const opponentColor = pieceColor === 'w' ? 'b' : 'w';
        let checkRow = row + rowDir;
        let checkCol = col + colDir;
        
        while (isInBounds(checkRow, checkCol)) {
            const piece = boardState[checkRow][checkCol];
            if (piece) {
                if (piece.charAt(0) === opponentColor && 
                    pieceTypes.includes(piece.charAt(1))) {
                    return true;
                }
                break;
            }
            checkRow += rowDir;
            checkCol += colDir;
        }
        
        return false;
    }

    // Show promotion dialog
    function showPromotionDialog() {
        promotionModal.style.display = 'flex';
        document.querySelectorAll('.promotion-piece').forEach(piece => {
            const color = currentPlayer === 'white' ? 'b' : 'w';
            switch (piece.dataset.piece) {
                case 'queen': piece.textContent = color === 'w' ? '♕' : '♛'; break;
                case 'rook': piece.textContent = color === 'w' ? '♖' : '♜'; break;
                case 'bishop': piece.textContent = color === 'w' ? '♗' : '♝'; break;
                case 'knight': piece.textContent = color === 'w' ? '♘' : '♞'; break;
            }
            
            piece.addEventListener('click', handlePromotionSelection);
        });
    }

    // Handle promotion selection
    function handlePromotionSelection(e) {
        const pieceType = e.target.dataset.piece;
        const color = currentPlayer === 'white' ? 'b' : 'w'; // Because turn was already switched
        let promotedPiece;
        
        switch (pieceType) {
            case 'queen': promotedPiece = color + 'Q'; break;
            case 'rook': promotedPiece = color + 'R'; break;
            case 'bishop': promotedPiece = color + 'B'; break;
            case 'knight': promotedPiece = color + 'N'; break;
        }
        
        board[promotionSquare.row][promotionSquare.col] = promotedPiece;
        
        promotionModal.style.display = 'none';
        waitingForPromotion = false;
        promotionSquare = null;
        
        document.querySelectorAll('.promotion-piece').forEach(piece => {
            piece.removeEventListener('click', handlePromotionSelection);
        });
        
        updateBoardState();
        checkForCheckmate();
    }

    // Check for check and checkmate
    function checkForCheckmate() {
        const kingPos = currentPlayer === 'white' ? whiteKingPosition : blackKingPosition;
        const pieceColor = currentPlayer === 'white' ? 'w' : 'b';
        
        const isInCheck = isSquareUnderAttack(kingPos.row, kingPos.col, pieceColor);
        
        // Check if any legal move exists
        let hasLegalMove = false;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.charAt(0) === pieceColor) {
                    const moves = getValidMoves(r, c);
                    if (moves.length > 0) {
                        hasLegalMove = true;
                        break;
                    }
                }
            }
            if (hasLegalMove) break;
        }
        
        if (isInCheck) {
            // Highlight the king square
            const kingSquare = getSquareElement(kingPos.row, kingPos.col);
            kingSquare.classList.add('check');
            
            if (!hasLegalMove) {
                // Checkmate
                statusDisplay.textContent = `Checkmate! ${currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
            } else {
                statusDisplay.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`;
            }
        } else if (!hasLegalMove) {
            // Stalemate
            statusDisplay.textContent = 'Stalemate! The game is a draw.';
        } else {
            statusDisplay.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} to move`;
        }
    }

    // Update the board state visually
    function updateBoardState() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = getSquareElement(row, col);
                square.textContent = board[row][col] ? getPieceSymbol(board[row][col]) : '';
                
                // Remove last move highlights
                square.classList.remove('last-move');
                
                // Add last move highlights
                if (lastMove.from && lastMove.to) {
                    if ((row === lastMove.from.row && col === lastMove.from.col) ||
                        (row === lastMove.to.row && col === lastMove.to.col)) {
                        square.classList.add('last-move');
                    }
                }
            }
        }
    }

    // Reset the game
    function resetGame() {
        board = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];
        
        currentPlayer = 'white';
        selectedPiece = null;
        possibleMoves = [];
        waitingForPromotion = false;
        promotionSquare = null;
        whiteKingPosition = { row: 7, col: 4 };
        blackKingPosition = { row: 0, col: 4 };
        lastMove = { from: null, to: null };
        
        statusDisplay.textContent = 'White to move';
        createBoard();
    }

    // Event listeners
    resetButton.addEventListener('click', resetGame);

    // Initialize the game
    createBoard();
});
