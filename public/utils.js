export function getRandomCandy() {
    const candyTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const randomIndex = Math.floor(Math.random() * candyTypes.length);
    return candyTypes[randomIndex];
}

export function isValidMove(candy1, candy2) {
    const validCandyTypes = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    return validCandyTypes.includes(candy1) && validCandyTypes.includes(candy2);
}