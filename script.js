class Board {
    constructor(size) {
        this.size = size;
        this.tiles = Array(size).fill().map(() => Array(size).fill(0));
        this.history = [];
        this.score = 0;
        this.addRandomTile();
        this.addRandomTile();
        this.saveState();
    }

    saveState() {
        this.history.push(JSON.parse(JSON.stringify(this.tiles)));
        if (this.history.length > 2) this.history.shift();
    }

    undo() {
        if (this.history.length > 1) {
            this.history.pop();
            this.tiles = JSON.parse(JSON.stringify(this.history[0]));
            return true;
        }
        return false;
    }

    addRandomTile() {
        let empty = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.tiles[i][j] === 0) empty.push([i, j]);
            }
        }
        if (empty.length === 0) return;
        let [i, j] = empty[Math.floor(Math.random() * empty.length)];
        this.tiles[i][j] = Math.random() < 0.9 ? 2 : 4;
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            let row = this.tiles[i].filter(val => val !== 0);
            let newRow = [];
            let j = 0;
            while (j < row.length) {
                if (j + 1 < row.length && row[j] === row[j + 1]) {
                    newRow.push(row[j] * 2);
                    this.score += row[j] * 2;
                    j += 2;
                    moved = true;
                } else {
                    newRow.push(row[j]);
                    j++;
                }
            }
            while (newRow.length < this.size) newRow.push(0);
            if (!this.tiles[i].every((val, idx) => val === newRow[idx])) moved = true;
            this.tiles[i] = newRow;
        }
        return moved;
    }

    rotate(times) {
        for (let t = 0; t < times; t++) {
            let newTiles = Array(this.size).fill().map(() => Array(this.size).fill(0));
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    newTiles[j][this.size - 1 - i] = this.tiles[i][j];
                }
            }
            this.tiles = newTiles;
        }
    }

    isGameOver() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.tiles[i][j] === 0) return false;
                if (i < this.size - 1 && this.tiles[i][j] === this.tiles[i + 1][j]) return false;
                if (j < this.size - 1 && this.tiles[i][j] === this.tiles[i][j + 1]) return false;
            }
        }
        return true;
    }

    getMaxTile() {
        return Math.max(...this.tiles.flat());
    }
}

class Game {
    constructor() {
        this.board = new Board(4);
        this.gameOver = false;
        this.milestones = [2048, 4096, 8192, 16384, 32768, 65536, 131072];
        this.achievedMilestones = new Set();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard event listener
        document.addEventListener('keydown', this.handleKey.bind(this));

        // Touch event listeners
        const boardEl = document.getElementById('board');
        boardEl.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        boardEl.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    }

    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    handleTouchEnd(event) {
        event.preventDefault();
        const touch = event.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
        this.handleSwipe();
    }

    handleSwipe() {
        const dx = this.touchEndX - this.touchStartX;
        const dy = this.touchEndY - this.touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Only process the swipe if it's significant enough (threshold of 30px)
        if (Math.max(absDx, absDy) < 30) return;

        if (absDx > absDy) {
            // Horizontal swipe
            if (dx > 0) {
                this.move('RIGHT');
            } else {
                this.move('LEFT');
            }
        } else {
            // Vertical swipe (inverted to match intuitive direction)
            if (dy > 0) {
                this.move('UP'); // Swipe down moves tiles up
            } else {
                this.move('DOWN'); // Swipe up moves tiles down
            }
        }
    }

    render() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        this.board.tiles.forEach(row => {
            row.forEach(value => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.value = value;
                const span = document.createElement('span');
                span.textContent = value || '';
                tile.appendChild(span);
                boardEl.appendChild(tile);
            });
        });
        document.getElementById('score').textContent = this.board.score;
        const messageEl = document.getElementById('message');
        if (this.gameOver) {
            messageEl.textContent = 'Game Over! No more moves possible.';
        } else {
            messageEl.textContent = '';
        }
    }

    move(direction) {
        if (this.gameOver) return;
        this.board.saveState();
        let moved = false;
        switch (direction) {
            case 'LEFT': moved = this.board.moveLeft(); break;
            case 'RIGHT': this.board.rotate(2); moved = this.board.moveLeft(); this.board.rotate(2); break;
            case 'UP': this.board.rotate(1); moved = this.board.moveLeft(); this.board.rotate(3); break;
            case 'DOWN': this.board.rotate(3); moved = this.board.moveLeft(); this.board.rotate(1); break;
        }
        if (moved) {
            this.board.addRandomTile();
            this.checkGameStatus();
            this.render();
        }
    }

    undo() {
        if (this.board.undo()) this.render();
    }

    reset() {
        this.board = new Board(4);
        this.gameOver = false;
        this.achievedMilestones = new Set();
        this.hidePopup();
        this.render();
    }

    continueGame() {
        this.hidePopup();
    }

    showPopup(milestone) {
        document.getElementById('popup-message').textContent = `You reached ${milestone}! Continue or start a new game?`;
        document.getElementById('popup').classList.add('show');
        document.getElementById('overlay').classList.add('show');
    }

    hidePopup() {
        document.getElementById('popup').classList.remove('show');
        document.getElementById('overlay').classList.remove('show');
    }

    checkGameStatus() {
        if (this.board.isGameOver()) {
            this.gameOver = true;
        }
        const maxTile = this.board.getMaxTile();
        for (const milestone of this.milestones) {
            if (maxTile >= milestone && !this.achievedMilestones.has(milestone)) {
                this.achievedMilestones.add(milestone);
                this.showPopup(milestone);
                break;
            }
        }
    }

    handleKey(event) {
        switch (event.key.toLowerCase()) {
            case 'arrowup':
            case 'w': this.move('DOWN'); break;
            case 'arrowdown':
            case 's': this.move('UP'); break;
            case 'arrowleft':
            case 'a': this.move('LEFT'); break;
            case 'arrowright':
            case 'd': this.move('RIGHT'); break;
        }
    }
}

const game = new Game();