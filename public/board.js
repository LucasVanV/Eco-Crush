class Board {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.board = [];
        this.candyTypes = ['plastique', 'papier', 'verre', 'metal', 'compost', 'dechet'];
        this.selected = [];
        this.gameOver = false; // <-- AJOUTE CETTE LIGNE
        this.createBoard();
        this.startTimer(); // <-- AJOUTE CETTE LIGNE
    }

    createBoard() {
        const boardDiv = document.getElementById('game-board');
        boardDiv.innerHTML = '';
        this.board = [];
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                let candy;
                do {
                    candy = this.getRandomCandy();
                } while (
                    (col >= 2 && this.board[row][col - 1] === candy && this.board[row][col - 2] === candy) ||
                    (row >= 2 && this.board[row - 1][col] === candy && this.board[row - 2][col] === candy)
                );
                this.board[row][col] = candy;
                const cell = document.createElement('div');
                cell.className = 'candy ' + candy;
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.textContent = this.getEmoji(candy); // <-- AJOUTE CETTE LIGNE

                // Listener pour le swap
                cell.addEventListener('click', (e) => this.handleCandyClick(e, row, col));

                boardDiv.appendChild(cell);
            }
        }
    }

    getRandomCandy() {
        const randomIndex = Math.floor(Math.random() * this.candyTypes.length);
        return this.candyTypes[randomIndex];
    }

    checkMatches() {
        const matches = [];
        // Check for horizontal matches
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols - 2; col++) {
                if (this.board[row][col] === this.board[row][col + 1] && this.board[row][col] === this.board[row][col + 2]) {
                    matches.push({ row, col });
                    matches.push({ row, col: col + 1 });
                    matches.push({ row, col: col + 2 });
                }
            }
        }

        // Check for vertical matches
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows - 2; row++) {
                if (this.board[row][col] === this.board[row + 1][col] && this.board[row][col] === this.board[row + 2][col]) {
                    matches.push({ row, col });
                    matches.push({ row: row + 1, col });
                    matches.push({ row: row + 2, col });
                }
            }
        }

        return matches;
    }

    startSelect(e, row, col, color) {
        this.isSelecting = true;
        this.selected = [{row, col}];
        this.currentColor = color;
        e.target.classList.add('selected');
    }

    enterCandy(e, row, col, color) {
        if (!this.isSelecting) return;
        // Vérifie la couleur et que ce n'est pas déjà sélectionné
        if (color === this.currentColor && !this.selected.some(pos => pos.row === row && pos.col === col)) {
            this.selected.push({row, col});
            e.target.classList.add('selected');
        }
    }

    endSelect() {
        if (!this.isSelecting) return;
        if (this.selected.length >= 3) {
            // Retire les bonbons sélectionnés
            for (const pos of this.selected) {
                this.board[pos.row][pos.col] = null;
            }
            // Ajoute le score
            const scoreDiv = document.getElementById('score');
            let score = parseInt(scoreDiv.textContent.replace(/\D/g, '')) || 0;
            score += this.selected.length * 10;
            scoreDiv.textContent = 'Score: ' + score;

            // Recharge la grille (simple, sans gravité)
            this.createBoard();
            setTimeout(() => {
                this.checkAndRemoveMatches();
            }, 300);
        } else {
            // Juste retirer la sélection visuelle
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        }
        this.selected = [];
        this.isSelecting = false;
        this.currentColor = null;
    }

    handleCandyClick(e, row, col) {
        if (this.gameOver) return; // <-- AJOUTE CETTE LIGNE
        const alreadySelected = this.selected.length === 1 &&
            this.selected[0].row === row && this.selected[0].col === col;

        if (alreadySelected) {
            // Désélectionne si on reclique sur le même
            this.clearSelection();
            return;
        }

        if (this.selected.length === 0) {
            this.selected = [{row, col}];
            e.target.classList.add('selected');
        } else if (this.selected.length === 1) {
            const prev = this.selected[0];
            if (this.isAdjacent(prev, {row, col})) {
                this.swapCandies(prev, {row, col});
                this.clearSelection();
                // this.checkAndRemoveMatches(); // <-- retire cette ligne
            } else {
                // Si pas adjacent, on recommence la sélection
                this.clearSelection();
                this.selected = [{row, col}];
                e.target.classList.add('selected');
            }
        }
    }

    isAdjacent(a, b) {
        return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
    }

    swapCandies(a, b) {
        // Swap dans le tableau
        const temp = this.board[a.row][a.col];
        this.board[a.row][a.col] = this.board[b.row][b.col];
        this.board[b.row][b.col] = temp;

        // Met à jour l'affichage directement
        this.updateBoardDisplay();

        // Vérifie les matches après le swap
        this.checkAndRemoveMatches();
    }

    clearSelection() {
        this.selected = [];
        document.querySelectorAll('.candy.selected').forEach(el => el.classList.remove('selected'));
    }

    updateBoardDisplay() {
        const boardDiv = document.getElementById('game-board');
        const candies = boardDiv.querySelectorAll('.candy');
        let i = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                candies[i].removeAttribute('style');
                candies[i].className = 'candy ' + this.board[row][col];
                candies[i].dataset.row = row;
                candies[i].dataset.col = col;
                candies[i].textContent = this.getEmoji(this.board[row][col]);
                // Ne plus ajouter la classe 'falling'
                i++;
            }
        }
    }

    checkAndRemoveMatches() {
        const matches = [];
        // Cherche les lignes
        for (let row = 0; row < this.rows; row++) {
            let count = 1;
            for (let col = 1; col < this.cols; col++) {
                if (this.board[row][col] === this.board[row][col-1]) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let k = 0; k < count; k++) {
                            matches.push({row, col: col-1-k});
                        }
                    }
                    count = 1;
                }
            }
            if (count >= 3) {
                for (let k = 0; k < count; k++) {
                    matches.push({row, col: this.cols-1-k});
                }
            }
        }
        // Cherche les colonnes
        for (let col = 0; col < this.cols; col++) {
            let count = 1;
            for (let row = 1; row < this.rows; row++) {
                if (this.board[row][col] === this.board[row-1][col]) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let k = 0; k < count; k++) {
                            matches.push({row: row-1-k, col});
                        }
                    }
                    count = 1;
                }
            }
            if (count >= 3) {
                for (let k = 0; k < count; k++) {
                    matches.push({row: this.rows-1-k, col});
                }
            }
        }
        if (matches.length > 0) {
            // Supprime les doublons
            const unique = matches.filter((v,i,a)=>a.findIndex(t=>(t.row===v.row&&t.col===v.col))===i);

            // Ajoute la classe matching pour l'aura
            const boardDiv = document.getElementById('game-board');
            const candies = boardDiv.querySelectorAll('.candy');
            unique.forEach(pos => {
                const idx = pos.row * this.cols + pos.col;
                candies[idx].classList.add('matching');
            });

            // Laisse le temps à l'aura de s'afficher
            setTimeout(() => {
                // Retire les bonbons matchés
                for (const pos of unique) {
                    this.board[pos.row][pos.col] = null;
                }
                this.addScore(unique.length);

                // Mets à jour l'affichage pour montrer les bonbons supprimés
                this.updateBoardDisplay();

                // Lance la chute après la suppression
                this.collapseBoard();
                this.updateBoardDisplay();
                this.checkAndRemoveMatches();
            }, 400); // même durée que l'animation aura-pop
        }
    }

    addScore(n) {
        const scoreDiv = document.getElementById('score');
        let score = parseInt(scoreDiv.textContent.replace(/\D/g, '')) || 0;
        score += n * 10;
        scoreDiv.textContent = 'Score: ' + score;
    }

    collapseBoard() {
        // On va animer la chute des bonbons
        const boardDiv = document.getElementById('game-board');
        const candies = boardDiv.querySelectorAll('.candy');
        const cellSize = candies[0]?.offsetWidth || 40; // largeur d'une case

        let moves = [];
        for (let col = 0; col < this.cols; col++) {
            let empty = [];
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.board[row][col] === null) {
                    empty.push(row);
                } else if (empty.length > 0) {
                    const targetRow = empty.shift();
                    // Animation: trouve l'élément DOM correspondant
                    const idx = row * this.cols + col;
                    const candyEl = candies[idx];
                    if (candyEl) {
                        candyEl.classList.add('falling');
                        candyEl.style.transform = `translateY(${(targetRow - row) * cellSize}px)`;
                        moves.push({el: candyEl, from: row, to: targetRow, col});
                    }
                    // Déplace dans le tableau
                    this.board[targetRow][col] = this.board[row][col];
                    this.board[row][col] = null;
                    empty.push(row);
                }
            }
            // Remplit les trous en haut
            for (let i = 0; i < empty.length; i++) {
                this.board[empty[i]][col] = this.getRandomCandy();
            }
        }

        // Après l'animation, reset l'affichage
        setTimeout(() => {
            // Nettoie les styles
            moves.forEach(({el}) => {
                el.classList.remove('falling');
                el.style.transform = '';
            });
            this.updateBoardDisplay();
            this.checkAndRemoveMatches();
        }, 800); // même durée que la transition CSS
    }

    getEmoji(type) {
        switch(type) {
            case 'plastique': return '🛍️';   // sac plastique
            case 'papier':    return '📦';   // carton/papier
            case 'verre':     return '🍶';   // bouteille en verre
            case 'metal':     return '🥫';   // canette
            case 'compost':   return '🍂';   // feuille/compost
            case 'dechet':    return '🚮';   // déchet non recyclable
            default:          return ' ';
        }
    }

    startTimer() {
        this.timeLeft = 60;
        const timerDiv = document.getElementById('timer');
        timerDiv.textContent = 'Temps : 60s';
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.gameOver = false; // <-- reset au début
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            timerDiv.textContent = 'Temps : ' + this.timeLeft + 's';
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                timerDiv.textContent = 'Temps écoulé !';
                this.gameOver = true; // <-- AJOUTE CETTE LIGNE
            }
        }, 1000);
    }
}

export default Board;