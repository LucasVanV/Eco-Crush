// src/index.js
import Game from './game.js';
import Board from './board.js';

const game = new Game();
const board = new Board(8, 8); // Ajoute les dimensions du board

function init() {
    // Reset le score à 0
    const scoreDiv = document.getElementById('score');
    if (scoreDiv) scoreDiv.textContent = 'Score: 0';

    // Reset le timer à 60s (si tu as un div#timer)
    const timerDiv = document.getElementById('timer');
    if (timerDiv) timerDiv.textContent = 'Temps : 60s';

    // Réinitialise la grille et le timer via Board
    board.createBoard();
    board.startTimer && board.startTimer(); // au cas où la méthode existe

    // Si tu veux aussi reset d'autres états du jeu, fais-le ici

    game.startGame();
    gameLoop();
}

function gameLoop() {
    // Update game state and render the board
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
    // Optionnel : ne pas démarrer automatiquement
    // init();

    // Ajoute l'event listener sur le bouton
    const startBtn = document.getElementById('start-button');
    if (startBtn) {
        startBtn.addEventListener('click', init);
    }

});

window.saveScore = function(score) {
    let scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    scores.push({ score, date: new Date().toLocaleString() });
    scores = scores.sort((a, b) => b.score - a.score).slice(0, 3);
    localStorage.setItem('leaderboard', JSON.stringify(scores));

    // Met à jour les <li> existants
    const list = document.getElementById('leaderboard-list');
    const items = list.querySelectorAll('li');
    for (let i = 0; i < items.length; i++) {
        const medalSpan = items[i].querySelector('span');
        if (scores[i] && scores[i].score !== 0) {
            items[i].innerHTML = medalSpan.outerHTML + ` ${scores[i].score} pts `;
        } else {
            items[i].innerHTML = medalSpan.outerHTML;
        }
    }
};