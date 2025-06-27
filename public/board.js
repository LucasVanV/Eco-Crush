class Board {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.board = [];
        this.candyTypes = ['plastique', 'papier', 'verre', 'metal', 'compost'];
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
                cell.innerHTML = this.getImage(candy); // <-- AJOUTE CETTE LIGNE

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
                candies[i].innerHTML = this.getImage(this.board[row][col]);
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

            setTimeout(() => {
                for (const pos of unique) {
                    this.board[pos.row][pos.col] = null;
                }
                this.addScore(unique.length);

                this.updateBoardDisplay();
                this.collapseBoard();
                this.updateBoardDisplay();
                this.checkAndRemoveMatches();
            }, 400);
        }
        // Supposons que tu as un tableau de groupes de matches :
        // ex: let matchGroups = [ [ {row, col}, ... ], [ {row, col}, ... ] ]
        // (à adapter selon ta logique)

        // À SUPPRIMER OU COMMENTER dans checkAndRemoveMatches :
        /*
        let matchGroups = this.findMatchGroups(); // À adapter selon ton code
        if (matchGroups.length > 0) {
            let combo = matchGroups.length;
            let totalMatched = matchGroups.flat().length;
            let points = totalMatched * 10 * combo; // 10 pts par case, multiplié par le combo

            this.addScore(points);

            // Affiche le combo si > 1
            if (combo > 1) this.showCombo(combo);

            // ...le reste de ta logique de suppression...
        }
        */
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

    getImage(type) {
        switch(type) {
            case 'plastique': return '<img src="imgs/sac plastique.png" alt="plastique" class="candy-img">';
            case 'papier':    return '<img src="imgs/papier.png" alt="papier" class="candy-img">';
            case 'verre':     return '<img src="imgs/gobelet.png" alt="verre" class="candy-img">';
            case 'metal':     return '<img src="imgs/concerve.png" alt="metal" class="candy-img">';
            case 'compost':   return '<img src="imgs/banane.png" alt="compost" class="candy-img">';
            default:          return '';
        }
    }

    startTimer() {
        this.timeLeft = 60;
        const timerDiv = document.getElementById('timer');
        timerDiv.textContent = 'Temps : 60s';
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.gameOver = false;
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            timerDiv.textContent = 'Temps : ' + this.timeLeft + 's';
            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                timerDiv.textContent = 'Temps écoulé !';
                this.gameOver = true;
                const scoreDiv = document.getElementById('score');
                const score = parseInt(scoreDiv.textContent.replace(/\D/g, '')) || 0;
                if (window.saveScore) window.saveScore(score);
                console.log('Score validé :', score);

            }
        }, 1000);
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

            setTimeout(() => {
                for (const pos of unique) {
                    this.board[pos.row][pos.col] = null;
                }
                this.addScore(unique.length);

                this.updateBoardDisplay();
                this.collapseBoard();
                this.updateBoardDisplay();
                this.checkAndRemoveMatches();
            }, 400);
        }
        // Supposons que tu as un tableau de groupes de matches :
        // ex: let matchGroups = [ [ {row, col}, ... ], [ {row, col}, ... ] ]
        // (à adapter selon ta logique)

        // À SUPPRIMER OU COMMENTER dans checkAndRemoveMatches :
        /*
        let matchGroups = this.findMatchGroups(); // À adapter selon ton code
        if (matchGroups.length > 0) {
            let combo = matchGroups.length;
            let totalMatched = matchGroups.flat().length;
            let points = totalMatched * 10 * combo; // 10 pts par case, multiplié par le combo

            this.addScore(points);

            // Affiche le combo si > 1
            if (combo > 1) this.showCombo(combo);

            // ...le reste de ta logique de suppression...
        }
        */
    }

    findMatchGroups() {
        const visited = new Set();
        const matches = [];

        const addMatch = (row, col) => {
            if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
            const key = `${row},${col}`;
            if (visited.has(key)) return;
            visited.add(key);
            matches[matches.length - 1].push({ row, col });
        };

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (visited.has(`${row},${col}`)) continue;
                const candyType = this.board[row][col];
                if (!candyType) continue;

                matches.push([{ row, col }]);
                // Check right
                for (let c = col + 1; c < this.cols; c++) {
                    if (this.board[row][c] === candyType) {
                        addMatch(row, c);
                    } else {
                        break;
                    }
                }
                // Check down
                for (let r = row + 1; r < this.rows; r++) {
                    if (this.board[r][col] === candyType) {
                        addMatch(r, col);
                    } else {
                        break;
                    }
                }
            }
        }

        return matches.filter(group => group.length >= 3);
    }

    showCombo(combo) {
        const comboDiv = document.createElement('div');
        comboDiv.className = 'combo-banner';
        comboDiv.textContent = `Combo x${combo} !`;
        document.body.appendChild(comboDiv);
        setTimeout(() => comboDiv.remove(), 1200);
    }
}

export default Board;