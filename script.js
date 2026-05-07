(() => {
    'use strict';

    // ===== CONFIGURATION =====
    const GENDER = "girl"; // "boy" lub "girl"

    // ===== INGREDIENTS (CAULDRON GAME) =====
    const ingredients = [
        { id: "lemon", emoji: "🍋", label: "Cytryna", type: "sour" },
        { id: "strawberry", emoji: "🍓", label: "Truskawka", type: "sweet" },
        { id: "honey", emoji: "🍯", label: "Miód", type: "sweet" },
        { id: "mint", emoji: "🌿", label: "Mięta", type: "fresh" },
        { id: "water", emoji: "💧", label: "Woda", type: "neutral" },
        { id: "juice", emoji: "🧃", label: "Sok", type: "sweet" }
    ];

    // ===== SCRATCH GAME SYMBOLS =====
    // Winning symbol is gendered — revealed only after finding 3
    const WINNING_SYMBOL = GENDER === "girl" ? "🎀" : "⚽";
    const DECOY_SYMBOL = GENDER === "girl" ? "⚽" : "🎀";
    const FILLER_SYMBOLS = ["⭐", "🌙", "🦋", "🌸", "🍀", "💎", "🧸", "☁️"];

    // ===== STATE =====
    let selectedIngredients = [];
    const MAX_INGREDIENTS = 3;
    let gameActive = true;
    let revealedCards = 0;
    let matchedCount = 0;
    let scratchGameDone = false;

    // ===== DOM =====
    const screens = {
        results: document.getElementById('results-screen'),
        select: document.getElementById('select-screen'),
        game: document.getElementById('game-screen'),
        scratch: document.getElementById('scratch-screen'),
        reveal: document.getElementById('reveal-screen')
    };

    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const cauldron = document.getElementById('cauldron');
    const messageEl = document.getElementById('message');
    const ingredientsGrid = document.getElementById('ingredients-grid');
    const selectedDisplay = document.getElementById('selected-display');
    const revealText = document.getElementById('reveal-text');
    const revealIllustration = document.getElementById('reveal-illustration');
    const selectCauldron = document.getElementById('select-cauldron');
    const selectScratch = document.getElementById('select-scratch');
    const scratchGrid = document.getElementById('scratch-grid');
    const scratchMessage = document.getElementById('scratch-message');
    const scratchCountEl = document.getElementById('scratch-count');

    // ===== SCREEN MANAGEMENT =====
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    // ===== NAVIGATION =====
    startBtn.addEventListener('click', () => showScreen('select'));
    selectCauldron.addEventListener('click', () => { showScreen('game'); initCauldronGame(); });
    selectScratch.addEventListener('click', () => { showScreen('scratch'); initScratchGame(); });
    resetBtn.addEventListener('click', resetCauldronGame);

    document.getElementById('switch-to-scratch').addEventListener('click', () => { showScreen('scratch'); initScratchGame(); });
    document.getElementById('switch-to-cauldron').addEventListener('click', () => { showScreen('game'); initCauldronGame(); });

    // =============================================
    // CAULDRON GAME
    // =============================================
    function initCauldronGame() {
        ingredientsGrid.innerHTML = '';
        ingredients.forEach(ing => {
            const btn = document.createElement('button');
            btn.className = 'ingredient-btn';
            btn.dataset.id = ing.id;
            btn.innerHTML = `
                <span class="ingredient-emoji">${ing.emoji}</span>
                <span class="ingredient-label">${ing.label}</span>
            `;
            btn.addEventListener('click', () => handleIngredientClick(ing, btn));
            ingredientsGrid.appendChild(btn);
        });
        resetCauldronGame();
    }

    function resetCauldronGame() {
        selectedIngredients = [];
        gameActive = true;
        messageEl.textContent = '';
        messageEl.className = 'message';
        selectedDisplay.innerHTML = '';
        resetBtn.classList.add('hidden');
        cauldron.className = 'cauldron idle';
        document.querySelectorAll('.ingredient-btn').forEach(btn => {
            btn.classList.remove('selected', 'disabled');
        });
    }

    function handleIngredientClick(ingredient, btnEl) {
        if (!gameActive) return;
        if (selectedIngredients.find(i => i.id === ingredient.id)) return;
        if (selectedIngredients.length >= MAX_INGREDIENTS) return;

        selectedIngredients.push(ingredient);
        btnEl.classList.add('selected');

        const span = document.createElement('span');
        span.className = 'selected-item';
        span.textContent = ingredient.emoji;
        selectedDisplay.appendChild(span);

        cauldron.className = 'cauldron bubbling';

        if (selectedIngredients.length < MAX_INGREDIENTS) {
            showHint();
        } else {
            checkCauldronResult();
        }
    }

    function showHint() {
        const types = selectedIngredients.map(i => i.type);
        const hints = [];
        if (!types.includes('sour')) hints.push('Mikstura potrzebuje czegoś kwaśnego…');
        if (!types.includes('sweet')) hints.push('Brakuje odrobiny słodyczy…');
        if (!types.includes('fresh')) hints.push('Przydałoby się coś świeżego…');
        if (hints.length > 0) {
            messageEl.textContent = hints[0];
            messageEl.className = 'message';
        }
    }

    function checkCauldronResult() {
        gameActive = false;
        const types = selectedIngredients.map(i => i.type);
        const isCorrect = types.includes('sour') && types.includes('sweet') && types.includes('fresh');

        if (isCorrect) {
            messageEl.textContent = '✨ Mikstura zaczyna świecić… ✨';
            messageEl.className = 'message success';
            cauldron.className = 'cauldron success';
            document.querySelectorAll('.ingredient-btn').forEach(b => b.classList.add('disabled'));
            setTimeout(() => showReveal(), 2000);
        } else {
            messageEl.textContent = 'Hmm… coś nie zadziałało. Spróbuj ponownie!';
            messageEl.className = 'message fail';
            cauldron.className = 'cauldron fail';
            cauldron.classList.add('shake');
            document.querySelectorAll('.ingredient-btn').forEach(b => b.classList.add('disabled'));
            resetBtn.classList.remove('hidden');
        }
    }

    // =============================================
    // SCRATCH GAME — Canvas-based real scratching
    // =============================================
    function initScratchGame() {
        revealedCards = 0;
        matchedCount = 0;
        scratchGameDone = false;
        scratchCountEl.textContent = '0';
        scratchMessage.textContent = '';
        scratchMessage.className = 'message';
        scratchGrid.innerHTML = '';

        const board = generateScratchBoard();

        board.forEach((symbol, idx) => {
            const card = document.createElement('div');
            card.className = 'scratch-card';
            card.dataset.index = idx;
            card.dataset.symbol = symbol;

            const content = document.createElement('div');
            content.className = 'scratch-card-content';
            content.textContent = symbol;
            card.appendChild(content);

            // Create canvas overlay
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            card.appendChild(canvas);

            scratchGrid.appendChild(card);

            // Draw canvas immediately
            initScratchCanvas(card, canvas);
        });
    }

    function generateScratchBoard() {
        // Always include both gender symbols to keep the reveal uncertain until the end.
        const board = [];
        board.push(WINNING_SYMBOL, WINNING_SYMBOL, WINNING_SYMBOL);
        board.push(DECOY_SYMBOL, DECOY_SYMBOL);

        // Fill the rest with neutral symbols.
        const shuffledFiller = [...FILLER_SYMBOLS].sort(() => Math.random() - 0.5);
        board.push(shuffledFiller[0], shuffledFiller[1], shuffledFiller[2], shuffledFiller[3]);

        // Fisher-Yates shuffle
        for (let i = board.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [board[i], board[j]] = [board[j], board[i]];
        }
        return board;
    }

    function initScratchCanvas(card, canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const w = canvas.width;
        const h = canvas.height;

        // Draw golden scratch surface
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#ffd54f');
        gradient.addColorStop(0.3, '#ffca28');
        gradient.addColorStop(0.5, '#ffe082');
        gradient.addColorStop(0.7, '#ffc107');
        gradient.addColorStop(1, '#ffb300');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Subtle diagonal texture
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        for (let i = -h; i < w; i += 14) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + h, h);
            ctx.stroke();
        }

        // Dashed border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(6, 6, w - 12, h - 12);
        ctx.setLineDash([]);

        // "ZDRAP" text
        ctx.fillStyle = 'rgba(120, 80, 0, 0.35)';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ZDRAP', w / 2, h / 2);

        // Scratch interaction state
        let isScratching = false;
        let done = false;
        let lastX = 0, lastY = 0;

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const source = e.touches ? e.touches[0] : e;
            return {
                x: (source.clientX - rect.left) * (w / rect.width),
                y: (source.clientY - rect.top) * (h / rect.height)
            };
        }

        function doScratch(x, y) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 62;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            const midX = (lastX + x) / 2 + (Math.random() - 0.5) * 8;
            const midY = (lastY + y) / 2 + (Math.random() - 0.5) * 8;
            ctx.quadraticCurveTo(midX, midY, x, y);
            ctx.stroke();
            lastX = x;
            lastY = y;
        }

        function onStart(e) {
            if (done || scratchGameDone) return;
            e.preventDefault();
            isScratching = true;
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 34, 0, Math.PI * 2);
            ctx.fill();
            checkAndReveal();
        }

        let moveCount = 0;

        function onMove(e) {
            if (!isScratching || done || scratchGameDone) return;
            e.preventDefault();
            const pos = getPos(e);
            doScratch(pos.x, pos.y);
            // Check frequently so a medium scratch reveals reliably on touch devices.
            moveCount++;
            if (moveCount % 3 === 0) {
                checkAndReveal();
            }
        }

        function onEnd() {
            if (!isScratching) return;
            isScratching = false;
            moveCount = 0;
            if (done || scratchGameDone) return;
            checkAndReveal();
        }

        function checkAndReveal() {
            if (card.classList.contains('revealed')) return;
            const imgData = ctx.getImageData(0, 0, w, h).data;
            let cleared = 0;
            let total = 0;
            for (let i = 3; i < imgData.length; i += 16) {
                const alpha = imgData[i];
                total++;
                cleared += (255 - alpha) / 255;
            }
            // Card revealed after scratching 50% of the surface
            if (cleared / total >= 0.5) {
                done = true;
                revealCard(card, canvas);
            }
        }

        canvas.addEventListener('mousedown', onStart);
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseup', onEnd);
        canvas.addEventListener('mouseleave', onEnd);
        canvas.addEventListener('touchstart', onStart, { passive: false });
        canvas.addEventListener('touchmove', onMove, { passive: false });
        canvas.addEventListener('touchend', onEnd);
        canvas.addEventListener('touchcancel', onEnd);
    }

    function revealCard(card, canvas) {
        if (card.classList.contains('revealed')) return;
        card.classList.add('revealed');

        // Remove canvas completely
        canvas.remove();

        revealedCards++;
        scratchCountEl.textContent = String(revealedCards);

        const symbol = card.dataset.symbol;
        if (symbol === WINNING_SYMBOL) {
            matchedCount++;
        }

        // Check win condition
        if (matchedCount >= 3 && !scratchGameDone) {
            scratchGameDone = true;
            scratchMessage.textContent = '✨ Gotowe... czas na reveal! ✨';
            scratchMessage.className = 'message success';
            // Disable remaining cards
            document.querySelectorAll('.scratch-card:not(.revealed) canvas').forEach(c => {
                c.style.pointerEvents = 'none';
            });
            setTimeout(() => showReveal(), 1800);
        } else if (!scratchGameDone) {
            scratchMessage.textContent = revealedCards > 0 ? 'Zdrap kolejne pola, żeby odkryć wynik…' : '';
            scratchMessage.className = 'message';
        }
    }

    // =============================================
    // REVEAL
    // =============================================
    function showReveal() {
        showScreen('reveal');

        const isGirl = GENDER === 'girl';

        // Set illustration color
        if (!isGirl) {
            revealIllustration.classList.add('boy');
        }

        setTimeout(() => {
            if (isGirl) {
                revealText.textContent = 'To dziewczynka!';
                revealText.className = 'reveal-text girl';
            } else {
                revealText.textContent = 'To chłopiec!';
                revealText.className = 'reveal-text boy';
            }
            launchConfetti(isGirl);
        }, 600);
    }

    function launchConfetti(isGirl) {
        const colors = isGirl
            ? ['#f48fb1', '#f06292', '#ec407a', '#ff80ab', '#ffffff']
            : ['#4fc3f7', '#29b6f6', '#039be5', '#80d8ff', '#ffffff'];

        const end = Date.now() + 4000;

        function frame() {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
            if (Date.now() < end) requestAnimationFrame(frame);
        }

        confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, colors });
        frame();
    }
})();
