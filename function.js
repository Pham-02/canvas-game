    let flapTimer = null;

    function startBird() {
        const bird = document.getElementById("bird");
        if (!bird) return;

        const frames = ["Images/bird1.png", "Images/bird2.png", "Images/bird3.png", "Images/bird4.png"];
        let i = 0;

        if (flapTimer) clearInterval(flapTimer);

        flapTimer = setInterval(() => {
            bird.src = frames[i]; // swap bird image
            i = (i + 1) % frames.length;
        }, 120); // speed of flapping
    }

    function createSymbol() {
        const symbolColors = {
            "+": "red",
            "−": "yellow",
            "×": "limegreen",
            "÷": "purple"
        };

        const symbols = Object.keys(symbolColors);
        const symbol = document.createElement("div");
        symbol.className = "symbol";

        // pick one symbol
        const chosen = symbols[Math.floor(Math.random() * symbols.length)];
        symbol.textContent = chosen;
        symbol.style.color = symbolColors[chosen];
        symbol.style.fontSize = (30 + Math.random() * 20) + "px";

        // decide TOP or BOTTOM march
        if (Math.random() < 0.5) {
            // BOTTOM
            symbol.classList.add("bottom");
            const lanes = [12, 15, 18]; // bottom %
            symbol.style.bottom = lanes[Math.floor(Math.random() * lanes.length)] + "%";
        } else {
            // TOP
            symbol.classList.add("top");
            const lanes = [10, 15, 20]; // top %
            symbol.style.top = lanes[Math.floor(Math.random() * lanes.length)] + "%";
        }

        // random speed (6–12s)
        const speed = 6 + Math.random() * 6;
        symbol.style.animationDuration = speed + "s";

        document.body.appendChild(symbol);

        setTimeout(() => symbol.remove(), speed * 1000);
    }


    function startMarching() {
        setInterval(createSymbol, 1000); // one new symbol every 1s
    }

    function login() {
        const username = document.getElementById('username').value;
        sessionStorage.setItem('username', username);
        let name = document.getElementById("username").value.trim();
        if (name !== "") {
            document.getElementById("login").style.display = "none";
            document.getElementById("Mainmenu").style.display = "block";
            sessionStorage.setItem("loggedIn", "true")
            startBird(); // start bird when menu shows
            startMarching();
        } else {
            alert("Please enter your name");
        }
    }
    window.onload = function() {
        if (sessionStorage.getItem("loggedIn") === "true") {
            document.getElementById("login").style.display = "none";
            document.getElementById("Mainmenu").style.display = "block";
            startBird();
            startConfetti();
            
        }
    }

    function saveScoreToLeaderboard(average) {
        const name = sessionStorage.getItem('username') || 'Anonymous';
        let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        const existing = leaderboard.find(entry => entry.name === name);
        if (!existing) {
            leaderboard.push({ name, average });
        } else if (average > existing.average) {
            existing.average = average;
        }
        leaderboard.sort((a, b) => b.average - a.average); // Highest average first
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }

    let coins = 0;

    function addCoins(amount) {
        coins = +amount;
        document.getElementById("coinDisplay").textContent = coins;


    }

    function updateCoinDisplay() {
        let coins = sessionStorage.getItem("bingoCoins") || 0;
        coins = parseInt(coins);

        let coinElement = document.getElementById("coinDisplay");
        if (coinElement) {
            coinElement.textContent = coins;
        }
    }

        window.addEventListener("load", async () => {
                // ensure questions are loaded before any code uses them
                await loadQuestions();

                // restore shop item counts into in-game HUDs
(function syncShopItemHUDs() {
    const hudIds = ["hintCountHud", "swapCountHud", "freezeCountHud", "doubleCountHud", "retryCountHud"];
    hudIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        // shop stores per-item counts with keys like "hintCount", "swapCount", ...
        const itemKey = id.replace('Hud', ''); // "hintCountHud" -> "hintCount"
        const count = parseInt(sessionStorage.getItem(itemKey), 10) || 0;
        el.textContent = count;
    });
})();
                const saved = sessionStorage.getItem("bingoCoins");
                if (saved) {
                        coins = parseInt(saved);
                        updateCoinDisplay();
                }
        });

    function goToPage(quarter) {
        document.getElementById("qrSelect").style.display = "none";

        // hide all quarters first
        document.getElementById("qtrOne").style.display = "none";
        // later, if you add qtrTwo, qtrThree, etc. hide them too

        if (quarter === "q1") {
            currentQuestionSet = [...questionsQ1];
            document.getElementById("qtrOne").style.display = "block";
        } else if (quarter === "q2") {
            currentQuestionSet = [...questionsQ2];
            document.getElementById("qtrOne").style.display = "block"; // reuse same board
        } else if (quarter === "q3") {
            currentQuestionSet = [...questionsQ3];
            document.getElementById("qtrOne").style.display = "block";
        } else if (quarter === "q4") {
            currentQuestionSet = [...questionsQ4];
            document.getElementById("qtrOne").style.display = "block";
        }


        remainingQuestions = [...currentQuestionSet];
        resetBoard();
    }

    const canvas = document.getElementById("oneCnv");
    const ctx = canvas.getContext("2d");

    canvas.width = 440;
    canvas.height = 520;

    const rows = 5;
    const cols = 5;
    const boxWidth = canvas.width / cols;
    const boxHeight = canvas.height / rows;


    let countdownId;
    let playerCoins = 0;
    let questionsStartTime;
    let timerId;
    let elapsedTime = 0;
    let timerStarted = false;

    function startTimer() {
        const timerDisplay = document.getElementById("timer");

        clearInterval(timerId);
        elapsedTime = 0;
        timerDisplay.textContent = "⏱ Time: 00:00";

        timerId = setInterval(() => {
            elapsedTime++;

            let minutes = Math.floor(elapsedTime / 60);
            let seconds = elapsedTime % 60;

            let formattedTime =
                String(minutes).padStart(2, "0") + ":" +
                String(seconds).padStart(2, "0");

            timerDisplay.textContent = `⏱ Time: ${formattedTime}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerId);
    }

    // ================= Questions =================
    
    // QUESTIONS: loaded from external JSON file
// existing arrays (ensure Q4 exists too)
let questionsQ1 = [];
let questionsQ2 = [];
let questionsQ3 = [];
let questionsQ4 = [];

// loader
async function loadQuestions() {
  try {
    const res = await fetch('questions.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch questions.json: ' + res.status);
    const data = await res.json();

    // assign with safe defaults
    questionsQ1 = Array.isArray(data.questionsQ1) ? data.questionsQ1 : [];
    questionsQ2 = Array.isArray(data.questionsQ2) ? data.questionsQ2 : [];
    questionsQ3 = Array.isArray(data.questionsQ3) ? data.questionsQ3 : [];
    questionsQ4 = Array.isArray(data.questionsQ4) ? data.questionsQ4 : [];

    console.info('Loaded questions:', questionsQ1.length, questionsQ2.length, questionsQ3.length, questionsQ4.length);
  } catch (err) {
    console.error('Error loading questions.json', err);
    // Optional: show user-facing message or fall back to minimal inline questions
  }
}


    let remainingQuestions = [];
    let currentQuestion = null;

    function hasPossibleBingo() {

        for (let row = 0; row < 5; row++) {
            let blocked = false;
            for (let col = 0; col < 5; col++) {
                if (board[row][col] === false) blocked = true;
            }
            if (!blocked) return true;
        }

        for (let col = 0; col < 5; col++) {
            let blocked = false;
            for (let row = 0; row < 5; row++) {
                if (board[row][col] === false) blocked = true;
            }
            if (!blocked) return true;
        }

        let blockedDiag1 = false;
        for (let i = 0; i < 5; i++) {
            if (board[i][i] === false) blockedDiag1 = true;
        }
        if (!blockedDiag1) return true;

        let blockedDiag2 = false;
        for (let i = 0; i < 5; i++) {
            if (board[i][4 - i] === false) blockedDiag2 = true;
        }
        if (!blockedDiag2) return true;


        return false;
    }

    // ================= Board =================
    let board = Array.from({ length: rows }, () => Array(cols).fill(null));
    let selectedCell = null;

    // ⭐ FREE middle cell
    board[2][2] = true;


    let hoveredCell = null;
    let hoverAlpha = 0;

    let flashCell = null;
    let flashAlpha = 0;


    function redrawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c] === true) {
                    ctx.fillStyle = "green";
                } else if (board[r][c] === false) {
                    ctx.fillStyle = "red";
                } else {
                    ctx.fillStyle = "rgba(173,126,24,0.7)";
                }

                ctx.fillRect(c * boxWidth, r * boxHeight, boxWidth, boxHeight);
                ctx.strokeStyle = "black";
                ctx.strokeRect(c * boxWidth, r * boxHeight, boxWidth, boxHeight);
            }
        }


        ctx.fillStyle = "gold";
        ctx.fillRect(2 * boxWidth, 2 * boxHeight, boxWidth, boxHeight);
        ctx.strokeStyle = "black";
        ctx.strokeRect(2 * boxWidth, 2 * boxHeight, boxWidth, boxHeight);
        ctx.fillStyle = "black";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", 2 * boxWidth + boxWidth / 2, 2 * boxHeight + boxHeight / 2);

        // Hover effect
        if (hoveredCell) {
            if (board[hoveredCell.r][hoveredCell.c] === false) {
                // Red tile hover: show a distinct color (e.g. orange border)
                ctx.strokeStyle = `rgba(255, 140, 0, ${hoverAlpha})`;
                ctx.lineWidth = 4;
                ctx.strokeRect(
                    hoveredCell.c * boxWidth,
                    hoveredCell.r * boxHeight,
                    boxWidth,
                    boxHeight
                );
                ctx.lineWidth = 1;
            } else if (board[hoveredCell.r][hoveredCell.c] === null) {
                // Normal hover (unanswered)
                ctx.strokeStyle = `rgba(255, 255, 0, ${hoverAlpha})`;
                ctx.lineWidth = 4;
                ctx.strokeRect(
                    hoveredCell.c * boxWidth,
                    hoveredCell.r * boxHeight,
                    boxWidth,
                    boxHeight
                );
                ctx.lineWidth = 1;
            }
        }

        // Flash effect
        if (flashCell && flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 0, ${flashAlpha})`;
            ctx.fillRect(
                flashCell.c * boxWidth,
                flashCell.r * boxHeight,
                boxWidth,
                boxHeight
            );
        }
    }

    // ================= Animations =================
    function animate() {
        // Hover fade
        if (hoveredCell) {
            hoverAlpha = Math.min(1, hoverAlpha + 0.1);
        } else {
            hoverAlpha = Math.max(0, hoverAlpha - 0.1);
        }

        // Flash fade
        if (flashAlpha > 0) {
            flashAlpha -= 0.1;
            if (flashAlpha <= 0) flashCell = null;
        }

        redrawBoard();
        requestAnimationFrame(animate);
    }
    animate();

    // ================= Events =================
    canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const c = Math.floor(x / boxWidth);
        const r = Math.floor(y / boxHeight);

        if (retryModeActive) {
            // Only allow hover on red tiles
            if (board[r][c] === false) {
                hoveredCell = { r, c };
            } else {
                hoveredCell = null;
            }
        } else {
            // Outside Retry, do NOT allow hover on red tiles
            if (board[r][c] === null || board[r][c] === true) {
                hoveredCell = { r, c };
            } else {
                hoveredCell = null;
            }
        }
    });

    canvas.addEventListener("mouseleave", () => {
        hoveredCell = null;
    });

    canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const c = Math.floor(x / boxWidth);
        const r = Math.floor(y / boxHeight);
        if (r === 2 && c === 2) return; // ignore ⭐

        // --- RETRY MODE ---
        if (retryModeActive) {
            // Only allow picking a red tile
            if (board[r][c] !== false) {
                showRetryMessage('Please select incorrect answer. (Red tiles)');
                return;
            }
            // Deduct item
            const countSpan = document.getElementById('retryCountHud');
            let count = parseInt(countSpan.textContent, 10) || 0;
            if (count > 0) {
                count--;
                countSpan.textContent = count;
                sessionStorage.setItem('retryCount', count);
                updateShopItemAvailability();
            }
            // Reset question for this tile
            board[r][c] = null;
            redrawBoard();
            retryModeActive = false;
            hideRetrySelectMessage();
            // Show Retry animation overlay for 3 seconds
            showRetryEffect();
            setTimeout(() => {
                selectedCell = { r, c };
                showQuestion();
            }, 3000);
            return;
        }
        // Show Retry effect overlay for 3 seconds
        function showRetryEffect() {
            const overlay = document.getElementById('retryEffectOverlay');
            if (overlay) {
                overlay.classList.add('show');
                setTimeout(() => {
                    overlay.classList.remove('show');
                }, 3000);
            }
        }


        if (board[r][c] === null) {
            selectedCell = { r, c };

            if (!timerStarted) {
                startTimer();
                timerStarted = true;
            }


            flashCell = { r, c };
            flashAlpha = 1;

            showQuestion();
        }
    });

    function showQuestion() {
        if (remainingQuestions.length === 0) {
            alert("No more questions left!");
            return;
        }

        const idx = Math.floor(Math.random() * remainingQuestions.length);
        currentQuestion = remainingQuestions[idx];
        remainingQuestions.splice(idx, 1);

        document.getElementById("questionText").innerText = currentQuestion.question;

        const choicesDiv = document.getElementById("choices");
        choicesDiv.innerHTML = "";
        currentQuestion.choices.forEach((choice) => {
            choicesDiv.innerHTML += `
        <label>
            <input type="radio" name="answer" value="${choice}">
            ${choice}
        </label><br>
        `;
        });
        questionsStartTime = Date.now();
        document.getElementById("popupOverlay").style.display = "flex";

        let timeLeft = 10;
        document.getElementById("countdown").textContent = `⏱ Time left: ${timeLeft}s`;

        clearInterval(countdownId);
        countdownId = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) {
                document.getElementById("countdown").textContent = `⏱ Time left: ${timeLeft}s`;
            } else {
                clearInterval(countdownId);
            }
        }, 1000);
    }

    // ================= Submit Answer =================
    let correctAnswers = 0;
    let totalAnswers = 0;

    function updateScore() {
        let percent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
        document.getElementById("percentage").textContent = percent + "%";

    }


    function submitAnswer() {
        const selected = document.querySelector('input[name="answer"]:checked');
        if (!selected) return;

        const answer = selected.value;
        const isCorrect = answer === currentQuestion.correct;

        if (!selectedCell || board[selectedCell.r][selectedCell.c] !== null) {
            document.getElementById("popupOverlay").style.display = "none";
            return;
        }

        totalAnswers++;
        if (isCorrect) {
            correctAnswers++;
            let elapsed = (Date.now() - questionsStartTime) / 1000;
            let speedBonus = elapsed <= 10 ? 5 : 0;
            let earned = 5 + speedBonus;
            // Double points logic
            if (doublePointsActive && doublePointsRemaining > 0) {
                earned *= 2;
            }
            let coins = parseInt(sessionStorage.getItem("bingoCoins") || 0);
            coins += earned;
            sessionStorage.setItem("bingoCoins", coins);
        }
        updateCoinDisplay();

        document.getElementById("popupOverlay").style.display = "none";
        document.querySelectorAll('input[name="answer"]').forEach(r => r.checked = false);

        const { r, c } = selectedCell;
        board[r][c] = isCorrect;

        selectedCell = null;
        updateScore();

        const log = document.getElementById("answerLog");
        const logEntry = document.createElement("p");

        if (isCorrect) {
            logEntry.textContent = `Question ${totalAnswers}:Correct ✅ ${correctAnswers}/${totalAnswers}`;
        } else {
            logEntry.textContent = `Question ${totalAnswers}:Wrong ❌ (Correct: ${currentQuestion.correct}) ${correctAnswers}/${totalAnswers}`;
        }

        log.appendChild(logEntry);

        let percent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
        let timeSeconds = Math.round(elapsedTime);
        if (checkWin()) {
            stopTimer();
            saveScoreToLeaderboard(percent);
            saveTimeToLeaderboard(timeSeconds);
            setTimeout(() => showResultPopup("🎉 You won! BINGO!"), 200);
            return;
        }

        let stillEmpty = board.some(row => row.includes(null));
        if (!stillEmpty || !hasPossibleBingo()) {
            stopTimer();
            setTimeout(() => showResultPopup("😢 Game Over! No Bingo pattern is possible."), 200);
        }
    }

    function checkWin() {
        // Check all rows
        for (let row = 0; row < 5; row++) {
            if (board[row].every(cell => cell === true)) {
                return true;
            }
        }

        // Check all columns
        for (let col = 0; col < 5; col++) {
            let colWin = true;
            for (let row = 0; row < 5; row++) {
                if (board[row][col] !== true) {
                    colWin = false;
                    break;
                }
            }
            if (colWin) return true;
        }

        // Check main diagonal
        let diag1 = true;
        for (let i = 0; i < 5; i++) {
            if (board[i][i] !== true) {
                diag1 = false;
                break;
            }
        }
        if (diag1) return true;

        // Check anti-diagonal
        let diag2 = true;
        for (let i = 0; i < 5; i++) {
            if (board[i][4 - i] !== true) {
                diag2 = false;
                break;
            }
        }
        if (diag2) return true;

        return false;
    }

    document.querySelector(".submitBtn").addEventListener("click", submitAnswer);

    // ================= Result Popup =================
    function showResultPopup(message) {
        document.getElementById("resultMessage").textContent = message;
        document.getElementById("resultPopup").style.display = "flex";
    }

    function returnToMenu() {
        window.location.href = "MainMenu.html";
    }



    //=================== SHOP ITEMS ===================




    function updateShopItemAvailability() {
        document.querySelectorAll('.shop-item-box').forEach(box => {
            const count = parseInt(box.querySelector('.shop-item-count').textContent, 10) || 0;
            if (count <= 0) {
                box.classList.add('shop-item-unavailable');
            } else {
                box.classList.remove('shop-item-unavailable');
            }
        });
    }

    // Call this function whenever you update item counts
    updateShopItemAvailability();

    window.addEventListener("load", () => {
        // Update HUD item counts from sessionStorage
        const items = ["hint", "swap", "freeze", "double", "retry"];
        items.forEach(item => {
            const count = sessionStorage.getItem(item + "Count") || 0;
            const hud = document.getElementById(item + "CountHud");
            if (hud) {
                hud.textContent = count;
                const hudBox = hud.closest('.shop-item-box');
                if (hudBox) {
                    if (parseInt(count) > 0) {
                        hudBox.classList.remove('shop-item-unavailable');
                    } else {
                        hudBox.classList.add('shop-item-unavailable');
                    }
                }
            }
        });
    });

    // Add click event for available items to show modal and background
    window.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll('.shop-item-box').forEach(box => {
            box.addEventListener('click', function() {
                if (!box.classList.contains('shop-item-unavailable')) {
                    const modal = document.getElementById('itemUseModal');
                    const modalBg = document.getElementById('itemUseModalBg');
                    if (modal && modalBg) {
                        modal.classList.add('show');
                        modalBg.classList.add('show');
                    }
                }
            });
        });

        // Modal button handlers
        const yesBtn = document.getElementById('itemUseYes');
        const noBtn = document.getElementById('itemUseNo');
        let lastUsedItemBox = null;
        document.querySelectorAll('.shop-item-box').forEach(box => {
            box.addEventListener('click', function() {
                if (!box.classList.contains('shop-item-unavailable')) {
                    lastUsedItemBox = box;
                }
            });
        });
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                if (lastUsedItemBox) {
                    const countSpan = lastUsedItemBox.querySelector('.shop-item-count');
                    let count = parseInt(countSpan.textContent, 10) || 0;
                    if (count > 0) {
                        count--;
                        countSpan.textContent = count;
                        // Update sessionStorage
                        const itemKey = countSpan.id.replace('Hud', '');
                        sessionStorage.setItem(itemKey, count);
                        updateShopItemAvailability();
                    }
                }
                const modal = document.getElementById('itemUseModal');
                const modalBg = document.getElementById('itemUseModalBg');
                if (modal && modalBg) {
                    modal.classList.remove('show');
                    modalBg.classList.remove('show');
                }
                lastUsedItemBox = null;
            });
        }
        if (noBtn) {
            noBtn.addEventListener('click', () => {
                const modal = document.getElementById('itemUseModal');
                const modalBg = document.getElementById('itemUseModalBg');
                if (modal && modalBg) {
                    modal.classList.remove('show');
                    modalBg.classList.remove('show');
                }
                lastUsedItemBox = null;
            });
        }
    });

    // --- HINT ITEM ABILITY ---
    let hintModeActive = false;
    let hintCursorStyle = '';

    function activateHintMode() {
        hintModeActive = true;
        document.body.style.cursor = 'pointer';
        document.getElementById('hintMessageBox').style.display = 'block';
        document.body.classList.add('hint-cursor-gold');
    }

    function deactivateHintMode() {
        hintModeActive = false;
        document.body.style.cursor = '';
        document.getElementById('hintMessageBox').style.display = 'none';
        document.body.classList.remove('hint-cursor-gold');
    }

    // Show hint message box
    function showHintMessage() {
        let box = document.getElementById('hintMessageBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'hintMessageBox';
            box.textContent = 'Click any tiles you want for free answer!';
            box.style.position = 'fixed';
            box.style.top = '50%';
            box.style.left = '50%';
            box.style.transform = 'translate(-50%, -50%)';
            box.style.background = '#5b2b15';
            box.style.color = '#ffd700';
            box.style.border = '4px solid #3a1d0f';
            box.style.borderRadius = '16px';
            box.style.padding = '32px 40px';
            box.style.fontFamily = "'Press Start 2P', monospace";
            box.style.fontSize = '18px';
            box.style.textAlign = 'center';
            box.style.boxShadow = '0 4px 32px #000a';
            box.style.zIndex = '99999';
            box.style.transition = 'opacity 0.35s cubic-bezier(.4,1.4,.6,1.1)';
            box.style.opacity = '0';
            document.body.appendChild(box);
            setTimeout(() => { box.style.opacity = '1'; }, 10);
        } else {
            box.style.display = 'block';
            setTimeout(() => { box.style.opacity = '1'; }, 10);
        }
    }

    // Show hint effect overlay
    function showHintEffect() {
        const overlay = document.getElementById('hintEffectOverlay');
        if (overlay) {
            overlay.classList.add('show');
            setTimeout(() => {
                overlay.classList.remove('show');
            }, 3000);
        }
    }

    // Listen for Hint item use
    let lastUsedItemType = null;
    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.shop-item-box').forEach(box => {
            box.addEventListener('click', function() {
                if (!box.classList.contains('shop-item-unavailable')) {
                    const label = box.querySelector('.shop-item-label');
                    if (label && label.textContent.trim().toUpperCase() === 'HINT') {
                        lastUsedItemType = 'hint';
                    } else {
                        lastUsedItemType = null;
                    }
                }
            });
        });
        const yesBtn = document.getElementById('itemUseYes');
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                if (lastUsedItemType === 'hint') {
                    showHintMessage();
                    activateHintMode();
                }
            });
        }
    });

    // Canvas click for hint mode
    canvas.addEventListener('click', (event) => {
        if (hintModeActive) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const c = Math.floor(x / boxWidth);
            const r = Math.floor(y / boxHeight);
            // Show the answer for the clicked tile
            if (board[r][c] === null) {
                // Find the answer for this tile
                let answer = '';
                if (remainingQuestions.length > 0) {
                    answer = currentQuestion ? currentQuestion.correct : 'Answer';
                }
                // Show answer overlay
                let ansBox = document.createElement('div');
                ansBox.textContent = 'Answer: ' + answer;
                ansBox.style.position = 'fixed';
                ansBox.style.top = (rect.top + r * boxHeight + boxHeight / 2) + 'px';
                ansBox.style.left = (rect.left + c * boxWidth + boxWidth / 2) + 'px';
                ansBox.style.transform = 'translate(-50%, -50%)';
                ansBox.style.background = '#5b2b15';
                ansBox.style.color = '#ffd700';
                ansBox.style.border = '2px solid #3a1d0f';
                ansBox.style.borderRadius = '10px';
                ansBox.style.padding = '16px 24px';
                ansBox.style.fontFamily = "'Press Start 2P', monospace";
                ansBox.style.fontSize = '16px';
                ansBox.style.textAlign = 'center';
                ansBox.style.zIndex = '99999';
                ansBox.style.boxShadow = '0 2px 12px #000a';
                document.body.appendChild(ansBox);
                setTimeout(() => { ansBox.style.opacity = '1'; }, 10);
                setTimeout(() => { ansBox.remove(); }, 2000);
                // Show effect overlay
                showHintEffect();
                // Deactivate hint mode after use
                deactivateHintMode();
            }
        }
    });
    // --- END HINT ITEM ABILITY ---





    // --- FREEZE ITEM ABILITY ---
    let freezeModeActive = false;
    let freezeTimeoutId = null;

    function activateFreezeMode() {
        freezeModeActive = true;
    }

    function deactivateFreezeMode() {
        freezeModeActive = false;
    }
    // Show freeze effect overlay and animation
    function showFreezeEffect() {
        const overlay = document.getElementById('freezeEffectOverlay');
        const canvas = document.getElementById('freezeEffectCanvas');
        if (overlay && canvas) {
            overlay.classList.add('show');
            // Snowflake animation
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            let snowflakes = Array.from({ length: 30 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 6 + 2,
                d: Math.random() * 1.5 + 0.5
            }));
            let frame = 0;

            function drawSnow() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#aef';
                snowflakes.forEach(flake => {
                    ctx.beginPath();
                    ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
                    ctx.fill();
                    flake.y += flake.d;
                    if (flake.y > canvas.height) flake.y = -flake.r;
                });
                frame++;
                if (frame < 180) { // 3 seconds at 60fps
                    requestAnimationFrame(drawSnow);
                }
            }
            drawSnow();
            setTimeout(() => {
                overlay.classList.remove('show');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 3000);
        }
    }

    function showFreezeMessage(msg) {
        let box = document.getElementById('freezeMessageBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'freezeMessageBox';
            box.style.position = 'fixed';
            box.style.top = '50%';
            box.style.left = '50%';
            box.style.transform = 'translate(-50%, -50%)';
            box.style.background = '#5b2b15';
            box.style.color = '#ffd700';
            box.style.border = '4px solid #3a1d0f';
            box.style.borderRadius = '16px';
            box.style.padding = '32px 40px';
            box.style.fontFamily = "'Press Start 2P', monospace";
            box.style.fontSize = '18px';
            box.style.textAlign = 'center';
            box.style.boxShadow = '0 4px 32px #000a';
            box.style.zIndex = '99999';
            box.style.transition = 'opacity 0.35s cubic-bezier(.4,1.4,.6,1.1)';
            box.style.opacity = '0';
            document.body.appendChild(box);
        }
        box.textContent = msg;
        box.style.display = 'block';
        setTimeout(() => { box.style.opacity = '1'; }, 10);
        setTimeout(() => {
            box.style.opacity = '0';
            setTimeout(() => { box.style.display = 'none'; }, 350);
        }, 3000);
    }
    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.shop-item-box').forEach(box => {
            box.addEventListener('click', function() {
                if (!box.classList.contains('shop-item-unavailable')) {
                    const label = box.querySelector('.shop-item-label');
                    if (label && label.textContent.trim().toUpperCase() === 'FREEZE') {
                        window.lastUsedItemType = 'freeze';
                    }
                }
            });
        });
        const yesBtn = document.getElementById('itemUseYes');
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                if (window.lastUsedItemType === 'freeze') {
                    if (!timerStarted) {
                        showFreezeMessage('Too early, dont you think?');
                    } else {
                        activateFreezeMode();
                        // Pause timer for 10 seconds, then resume
                        clearInterval(timerId);
                        showFreezeEffect();
                        freezeTimeoutId = setTimeout(() => {
                            timerId = setInterval(() => {
                                elapsedTime++;
                                let minutes = Math.floor(elapsedTime / 60);
                                let seconds = elapsedTime % 60;
                                let formattedTime = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
                                document.getElementById("timer").textContent = `⏱ Time: ${formattedTime}`;
                            }, 1000);
                            deactivateFreezeMode();
                        }, 10000);
                    }
                }
            });
        }
    });
    // --- END FREEZE ITEM ABILITY ---




    // --- DOUBLE POINTS ITEM ABILITY ---
    let doublePointsActive = false;
    let doublePointsRemaining = 0;
    let doublePointsInterval = null;

    function startDoublePoints() {
        // Animate coin display
        const coinDisplay = document.getElementById('coinDisplay');
        if (coinDisplay) {
            coinDisplay.classList.add('double-points-activated');
            setTimeout(() => {
                coinDisplay.classList.remove('double-points-activated');
            }, 1100);
        }
        doublePointsActive = true;
        doublePointsRemaining = 30;
        updateDoublePointsUI();
        runDoublePointsTimer();
        saveDoublePointsState();
    }

    function runDoublePointsTimer() {
        clearInterval(doublePointsInterval);
        doublePointsInterval = setInterval(() => {
            if (!doublePointsActive || doublePointsRemaining <= 0) {
                clearInterval(doublePointsInterval);
                doublePointsActive = false;
                doublePointsRemaining = 0;
                updateDoublePointsUI();
                saveDoublePointsState();
                return;
            }
            doublePointsRemaining--;
            updateDoublePointsUI();
            saveDoublePointsState();
            if (doublePointsRemaining <= 0) {
                doublePointsActive = false;
                clearInterval(doublePointsInterval);
                updateDoublePointsUI();
                saveDoublePointsState();
            }
        }, 1000);
    }

    function pauseDoublePoints() {
        clearInterval(doublePointsInterval);
        saveDoublePointsState();
    }

    function resumeDoublePoints() {
        if (doublePointsActive && doublePointsRemaining > 0) {
            updateDoublePointsUI();
            runDoublePointsTimer();
        }
    }

    function updateDoublePointsUI() {
        let timerBox = document.getElementById('doublePointsTimerBox');
        if (!timerBox) {
            timerBox = document.createElement('span');
            timerBox.id = 'doublePointsTimerBox';
            timerBox.style.color = '#53d13a';
            timerBox.style.fontFamily = "'Press Start 2P', monospace";
            timerBox.style.fontSize = '16px';
            timerBox.style.fontWeight = 'bold';
            timerBox.style.marginLeft = '18px';
            timerBox.style.verticalAlign = 'middle';
            const coinDisplay = document.getElementById('coinDisplay');
            if (coinDisplay && coinDisplay.parentNode) {
                coinDisplay.parentNode.insertBefore(timerBox, coinDisplay.nextSibling);
            }
        }
        if (doublePointsActive && doublePointsRemaining > 0) {
            let min = Math.floor(doublePointsRemaining / 60);
            let sec = doublePointsRemaining % 60;
            timerBox.textContent = `2x DOUBLE POINTS (${min}:${sec.toString().padStart(2, '0')})`;
            timerBox.style.display = 'inline';
        } else {
            timerBox.textContent = '';
            timerBox.style.display = 'none';
            // Hide the overlay if timer is done
            const overlay = document.getElementById('doubleEffectOverlay');
            if (overlay) overlay.classList.remove('show');
        }
    }

    function saveDoublePointsState() {
        sessionStorage.setItem('doublePointsActive', doublePointsActive ? 'true' : 'false');
        sessionStorage.setItem('doublePointsRemaining', doublePointsRemaining.toString());
    }

    function loadDoublePointsState() {
        doublePointsActive = sessionStorage.getItem('doublePointsActive') === 'true';
        doublePointsRemaining = parseInt(sessionStorage.getItem('doublePointsRemaining'), 10) || 0;
    }

    window.addEventListener('DOMContentLoaded', () => {
        loadDoublePointsState();
        if (doublePointsActive && doublePointsRemaining > 0) {
            resumeDoublePoints();
        } else {
            updateDoublePointsUI();
        }
        // Shop button logic for double points
        document.querySelectorAll('.shop-item-box').forEach(box => {
            box.addEventListener('click', function() {
                if (!box.classList.contains('shop-item-unavailable')) {
                    const label = box.querySelector('.shop-item-label');
                    if (label && label.textContent.trim().toUpperCase() === 'DOUBLE') {
                        window.lastUsedItemType = 'double';
                    }
                }
            });
        });
        const yesBtn = document.getElementById('itemUseYes');
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                if (window.lastUsedItemType === 'double') {
                    startDoublePoints();
                    // Animate coin display when 2x POINTS is used
                    const coinDisplay = document.getElementById('coinDisplay');
                    if (coinDisplay) {
                        coinDisplay.classList.add('double-points-activated');
                        setTimeout(() => {
                            coinDisplay.classList.remove('double-points-activated');
                        }, 1100);
                    }
                }
            });
        }
    });
    // --- END DOUBLE POINTS ITEM ABILITY ---


    // --- RETRY ITEM ABILITY ---
    function showRetrySelectMessage() {
        let box = document.getElementById('retrySelectMessageBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'retrySelectMessageBox';
            box.style.position = 'fixed';
            box.style.top = '20%';
            box.style.left = '50%';
            box.style.transform = 'translate(-50%, 0)';
            box.style.background = '#fff8e1';
            box.style.color = '#5b2b15';
            box.style.border = '2px solid #d32f2f';
            box.style.borderRadius = '12px';
            box.style.padding = '18px 32px';
            box.style.fontFamily = "'Press Start 2P', monospace";
            box.style.fontSize = '17px';
            box.style.textAlign = 'center';
            box.style.zIndex = '99999';
            box.innerHTML = 'Select a tile you want to answer again. <span style="color:#d32f2f;font-weight:bold;">(Red tile)</span>';
            document.body.appendChild(box);
        } else {
            box.style.display = 'block';
            box.innerHTML = 'Select a tile you want to answer again. <span style="color:#d32f2f;font-weight:bold;">(Red tile)</span>';
        }
    }

    function hideRetrySelectMessage() {
        let box = document.getElementById('retrySelectMessageBox');
        if (box) box.style.display = 'none';
    }
    var retryModeActive = false;

    function showRetryMessage(msg) {
        let box = document.getElementById('retryMessageBox');
        if (!box) {
            box = document.createElement('div');
            box.id = 'retryMessageBox';
            box.style.position = 'fixed';
            box.style.top = '50%';
            box.style.left = '50%';
            box.style.transform = 'translate(-50%, -50%)';
            box.style.background = '#5b2b15';
            box.style.color = '#ffd700';
            box.style.border = '4px solid #3a1d0f';
            box.style.borderRadius = '16px';
            box.style.padding = '32px 40px';
            box.style.fontFamily = "'Press Start 2P', monospace";
            box.style.fontSize = '18px';
            box.style.textAlign = 'center';
            box.style.boxShadow = '0 4px 32px #000a';
            box.style.zIndex = '99999';
            box.style.transition = 'opacity 0.35s cubic-bezier(.4,1.4,.6,1.1)';
            box.style.opacity = '0';
            document.body.appendChild(box);
        }
        box.textContent = msg;
        box.style.display = 'block';
        setTimeout(() => { box.style.opacity = '1'; }, 10);
        setTimeout(() => {
            box.style.opacity = '0';
            setTimeout(() => { box.style.display = 'none'; }, 350);
        }, 2000);
    }

    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.shop-item-box').forEach(box => {
            box.addEventListener('click', function() {
                if (!box.classList.contains('shop-item-unavailable')) {
                    const label = box.querySelector('.shop-item-label');
                    if (label && label.textContent.trim().toUpperCase() === 'RETRY') {
                        lastUsedItemType = 'retry';
                    }
                }
            });
        });
        const yesBtn = document.getElementById('itemUseYes');
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                if (lastUsedItemType === 'retry') {
                    // Check for red tiles
                    let hasRed = false;
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            if (board[r][c] === false) hasRed = true;
                        }
                    }
                    if (!hasRed) {
                        showRetryMessage('Red tiles not found');
                        return;
                    }
                    retryModeActive = true;
                    showRetrySelectMessage();
                }
            });
        }
    });

    canvas.addEventListener('click', (event) => {
        if (retryModeActive) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const c = Math.floor(x / boxWidth);
            const r = Math.floor(y / boxHeight);
            // Only allow clicking a red tile (incorrect answer)
            if (board[r][c] !== false) {
                showRetryMessage('Please select incorrect answer. (Red tiles)');
                return;
            }
            // Only allow one retry per activation
            if (retryModeActive) {
                // Deduct item
                const countSpan = document.getElementById('retryCountHud');
                let count = parseInt(countSpan.textContent, 10) || 0;
                if (count > 0) {
                    count--;
                    countSpan.textContent = count;
                    sessionStorage.setItem('retryCount', count);
                    updateShopItemAvailability();
                }
                // Reset question for this tile
                board[r][c] = null;
                redrawBoard();
                retryModeActive = false;
                hideRetrySelectMessage();
                showQuestion();
            }
        }
    });
    // --- END RETRY ITEM ABILITY ---


    // --- SWAP ITEM ABILITY ---
    let swapModeActive = false;
    let swapGlowBox = null;
    let swapStickyIcon = null;
    let swapSelectedTile = null;

    function activateSwapMode() {
        swapModeActive = true;
        document.querySelectorAll('.shop-item-box').forEach(box => {
            const label = box.querySelector('.shop-item-label');
            if (label && label.textContent.trim().toUpperCase() === 'SWAP') {
                box.classList.add('swap-glow');
                swapGlowBox = box;
            }
        });
        // Show icon if not already present
        if (!swapStickyIcon) {
            // Create sticky icon on first tile click
            // Will be handled in canvas click event
        }
    }

    function deactivateSwapMode() {
        swapModeActive = false;
        if (swapGlowBox) swapGlowBox.classList.remove('swap-glow');
        swapGlowBox = null;
        if (swapStickyIcon && swapStickyIcon.parentNode) {
            swapStickyIcon.parentNode.removeChild(swapStickyIcon);
        }
        swapStickyIcon = null;
        swapSelectedTile = null;
    }

    window.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.shop-item-box').forEach(box => {
            box.addEventListener('click', function() {
                if (!box.classList.contains('shop-item-unavailable')) {
                    const label = box.querySelector('.shop-item-label');
                    if (label && label.textContent.trim().toUpperCase() === 'SWAP') {
                        lastUsedItemType = 'swap';
                    }
                }
            });
        });
        const yesBtn = document.getElementById('itemUseYes');
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                if (lastUsedItemType === 'swap') {
                    activateSwapMode();
                }
            });
        }
    });

    canvas.addEventListener('click', (event) => {
        if (swapModeActive && !swapStickyIcon) {
            // Create sticky Swap icon and position it near the popupBox
            swapStickyIcon = document.createElement('div');
            swapStickyIcon.className = 'swap-sticky';
            swapStickyIcon.innerHTML = '🔄';
            swapStickyIcon.style.width = '60px';
            swapStickyIcon.style.height = '60px';
            swapStickyIcon.style.fontSize = '40px';
            swapStickyIcon.style.borderRadius = '16px';
            swapStickyIcon.style.background = '#5b2b15';
            swapStickyIcon.style.border = '2px solid #ffd700';
            swapStickyIcon.style.color = '#ffd700';
            swapStickyIcon.style.boxShadow = '0 0 12px 4px #ffd700';
            swapStickyIcon.style.display = 'flex';
            swapStickyIcon.style.alignItems = 'center';
            swapStickyIcon.style.justifyContent = 'center';
            const popupBox = document.getElementById('popupBox');
            if (popupBox) {
                const parent = popupBox.parentNode;
                parent.appendChild(swapStickyIcon);
                swapStickyIcon.style.position = 'absolute';
                swapStickyIcon.style.left = (popupBox.offsetLeft - 70) + 'px';
                swapStickyIcon.style.top = (popupBox.offsetTop + popupBox.offsetHeight / 2 - 30) + 'px';
                swapStickyIcon.style.zIndex = '10003';
                swapStickyIcon.style.cursor = 'pointer';
                swapStickyIcon.onclick = function() {
                    // Only allow one use per activation
                    if (!swapModeActive) return;
                    showSwapEffect();
                    if (remainingQuestions.length > 0) {
                        const idx = Math.floor(Math.random() * remainingQuestions.length);
                        currentQuestion = remainingQuestions[idx];
                        document.getElementById("questionText").innerText = currentQuestion.question;
                        const choicesDiv = document.getElementById("choices");
                        choicesDiv.innerHTML = "";
                        currentQuestion.choices.forEach((choice) => {
                            choicesDiv.innerHTML += `
                <label>
                    <input type="radio" name="answer" value="${choice}">
                    ${choice}
                </label><br>
                `;
                        });
                    }
                    // Remove icon and deactivate swap after use
                    if (swapStickyIcon && swapStickyIcon.parentNode) {
                        swapStickyIcon.parentNode.removeChild(swapStickyIcon);
                    }
                    swapStickyIcon = null;
                    deactivateSwapMode();
                };

                // Show Swap effect overlay for 1 second
                function showSwapEffect() {
                    const overlay = document.getElementById('swapEffectOverlay');
                    if (overlay) {
                        overlay.classList.add('show');
                        setTimeout(() => {
                            overlay.classList.remove('show');
                        }, 3000);
                    }
                }
            }
            swapSelectedTile = null;
        }
    });

    function saveTimeToLeaderboard(timeSeconds) {
        const name = sessionStorage.getItem('username') || 'Anonymous';
        let timeLeaderboard = JSON.parse(localStorage.getItem('timeLeaderboard') || '[]');

        const existing = timeLeaderboard.find(entry => entry.name === name);
        if (!existing) {
            timeLeaderboard.push({ name, time: timeSeconds });
        } else if (timeSeconds < existing.time) {
            existing.time = timeSeconds;
        }
        timeLeaderboard.sort((a, b) => a.time - b.time); // Fastest time first
        localStorage.setItem('timeLeaderboard', JSON.stringify(timeLeaderboard));
    }

    