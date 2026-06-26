// ==========================
// CONFIGURAÇÕES
// ==========================

const HIT_TIME = 12.870; // Momento exato da entrada principal da bateria
const TOLERANCE = 0.120; // 120 ms para considerar acerto
const PRECISION_RANGE = 1.200; // Mostra até 1.2s antes ou depois na barra

// ==========================
// ELEMENTOS
// ==========================

const startScreen = document.getElementById("startScreen");
const countdownScreen = document.getElementById("countdownScreen");
const gameScreen = document.getElementById("gameScreen");

const startButton = document.getElementById("startButton");
const tapButton = document.getElementById("tapButton");
const countdownNumber = document.getElementById("countdownNumber");

const music = document.getElementById("music");

const resultModal = document.getElementById("resultModal");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const scoreText = document.getElementById("scoreText");
const precisionDot = document.getElementById("precisionDot");

const playAgain = document.getElementById("playAgain");
const challengeButton = document.getElementById("challengeButton");

const shareModal = document.getElementById("shareModal");
const closeShareModal = document.getElementById("closeShareModal");
const challengeText = document.getElementById("challengeText");
const copyChallengeLink = document.getElementById("copyChallengeLink");
const whatsappChallenge = document.getElementById("whatsappChallenge");
const shareFeedback = document.getElementById("shareFeedback");

// ==========================
// VARIÁVEIS
// ==========================

let clicked = false;
let lastDifference = 0;
let countdownInterval = null;
let energyTimer = null;
let audioUnlocked = false;

// ==========================
// TELAS
// ==========================

function showScreen(screen) {
    document.querySelectorAll(".screen").forEach((item) => {
        item.classList.remove("active");
    });

    screen.classList.add("active");
}

function openResultModal() {
    resultModal.classList.add("active");
    resultModal.setAttribute("aria-hidden", "false");
}

function closeResultModal() {
    resultModal.classList.remove("active");
    resultModal.setAttribute("aria-hidden", "true");
}

function openShareModal() {
    challengeText.value = buildChallengeMessage();
    shareFeedback.textContent = "";

    shareModal.classList.add("active");
    shareModal.setAttribute("aria-hidden", "false");
}

function hideShareModal() {
    shareModal.classList.remove("active");
    shareModal.setAttribute("aria-hidden", "true");
    shareFeedback.textContent = "";
}

// ==========================
// ÁUDIO
// ==========================

async function unlockAudio() {
    if (audioUnlocked) return;

    try {
        music.muted = true;
        await music.play();
        music.pause();
        music.currentTime = 0;
        music.muted = false;
        audioUnlocked = true;
    } catch (error) {
        music.muted = false;
    }
}

function resetAudio() {
    music.pause();
    music.currentTime = 0;
}

async function playMusic() {
    try {
        music.currentTime = 0;
        await music.play();
    } catch (error) {
        alert("Não foi possível iniciar o áudio. Toque em jogar novamente e tente de novo.");
        showScreen(startScreen);
    }
}

// ==========================
// INÍCIO DO JOGO
// ==========================

startButton.addEventListener("click", startGame);

async function startGame() {
    clicked = false;

    clearTimers();
    closeResultModal();
    hideShareModal();
    resetAudio();

    tapButton.classList.remove("energy", "tapped");

    await unlockAudio();

    showScreen(countdownScreen);

    let count = 3;
    countdownNumber.textContent = count;

    countdownInterval = setInterval(() => {
        count--;

        if (count > 0) {
            countdownNumber.textContent = count;
            return;
        }

        clearInterval(countdownInterval);
        countdownInterval = null;

        startChallenge();
    }, 1000);
}

async function startChallenge() {
    showScreen(gameScreen);

    await playMusic();

    energyTimer = setTimeout(() => {
        if (!clicked) {
            tapButton.classList.add("energy");
        }
    }, Math.max((HIT_TIME - 1) * 1000, 0));
}

// ==========================
// CLIQUE DO USUÁRIO
// ==========================

tapButton.addEventListener("click", handleTap);

function handleTap() {
    if (clicked) return;

    clicked = true;

    clearTimeout(energyTimer);
    energyTimer = null;

    tapButton.classList.remove("energy");
    tapButton.classList.add("tapped");

    if (navigator.vibrate) {
        navigator.vibrate(45);
    }

    const currentTime = music.currentTime;
    lastDifference = currentTime - HIT_TIME;

    showResult();

    setTimeout(() => {
        tapButton.classList.remove("tapped");
    }, 180);
}

// ==========================
// RESULTADO
// ==========================

function showResult() {
    const absDifference = Math.abs(lastDifference);
    const milliseconds = Math.round(absDifference * 1000);
    const timingText = getTimingText(lastDifference, milliseconds);

    scoreText.textContent = `${milliseconds} ms`;

    updatePrecisionBar(lastDifference);

    if (absDifference <= TOLERANCE) {
        resultIcon.textContent = "🏆";
        resultTitle.textContent = "VOCÊ TEM RITMO!";
        resultMessage.innerHTML = `Você acertou a entrada da bateria.<br>${timingText}`;
        saveBest(milliseconds);
        launchConfetti();
    } else if (absDifference <= 0.250) {
        resultIcon.textContent = "😮";
        resultTitle.textContent = "FOI POR MUITO POUCO!";
        resultMessage.innerHTML = `Você quase cravou o momento certo.<br>${timingText}`;
    } else if (lastDifference < 0) {
        resultIcon.textContent = "😂";
        resultTitle.textContent = "SEGURA A EMOÇÃO!";
        resultMessage.innerHTML = `Você entrou antes da bateria.<br>${timingText}`;
    } else {
        resultIcon.textContent = "😅";
        resultTitle.textContent = "ACORDA, TAVA DORMINDO?";
        resultMessage.innerHTML = `A bateria já tinha começado.<br>${timingText}`;
    }

    openResultModal();
}

function getTimingText(difference, milliseconds) {
    if (milliseconds === 0) {
        return "Precisão perfeita.";
    }

    if (difference < 0) {
        return `Você tocou <strong>${milliseconds} ms antes</strong>.`;
    }

    return `Você tocou <strong>${milliseconds} ms depois</strong>.`;
}

function updatePrecisionBar(difference) {
    const clampedDifference = Math.max(-PRECISION_RANGE, Math.min(PRECISION_RANGE, difference));
    const percent = 50 + (clampedDifference / PRECISION_RANGE) * 50;

    precisionDot.style.left = `${percent}%`;
}

// ==========================
// JOGAR NOVAMENTE
// ==========================

playAgain.addEventListener("click", () => {
    startGame();
});

// ==========================
// DESAFIAR UM AMIGO
// ==========================

challengeButton.addEventListener("click", openShareModal);
closeShareModal.addEventListener("click", hideShareModal);

shareModal.addEventListener("click", (event) => {
    if (event.target === shareModal) {
        hideShareModal();
    }
});

copyChallengeLink.addEventListener("click", copyChallengeMessage);

whatsappChallenge.addEventListener("click", () => {
    const message = buildChallengeMessage();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});

async function copyChallengeMessage() {
    const message = buildChallengeMessage();

    try {
        await navigator.clipboard.writeText(message);
        shareFeedback.textContent = "Convite copiado.";
    } catch (error) {
        challengeText.focus();
        challengeText.select();

        const copied = document.execCommand("copy");
        shareFeedback.textContent = copied ? "Convite copiado." : "Selecione o texto e copie manualmente.";
    }
}

function getShareTimingText(difference, milliseconds) {
// ==========================
// RECORDE LOCAL
// ==========================

function saveBest(milliseconds) {
    const bestScore = localStorage.getItem("bestScore");

    if (bestScore === null || milliseconds < Number(bestScore)) {
        localStorage.setItem("bestScore", String(milliseconds));
    }
}

// ==========================
// CONFETES SEM BIBLIOTECA
// ==========================

function launchConfetti() {
    const colors = ["#ff1744", "#ffffff", "#ffba0d", "#42b6e8"];
    const layer = document.createElement("div");

    layer.className = "confetti-layer";
    document.body.appendChild(layer);

    for (let index = 0; index < 90; index++) {
        const piece = document.createElement("span");
        const left = `${Math.random() * 100}%`;
        const shift = `${(Math.random() - 0.5) * 260}px`;
        const rotate = `${Math.random() * 720 - 360}deg`;
        const duration = `${1.4 + Math.random() * 1.4}s`;
        const size = `${6 + Math.random() * 7}px`;
        const color = colors[Math.floor(Math.random() * colors.length)];

        piece.className = "confetti-piece";
        piece.style.setProperty("--left", left);
        piece.style.setProperty("--shift", shift);
        piece.style.setProperty("--rotate", rotate);
        piece.style.setProperty("--duration", duration);
        piece.style.setProperty("--size", size);
        piece.style.setProperty("--color", color);
        piece.style.animationDelay = `${Math.random() * 0.24}s`;

        layer.appendChild(piece);
    }

    setTimeout(() => {
        layer.remove();
    }, 3200);
}

// ==========================
// SEGURANÇA
// ==========================

music.addEventListener("ended", () => {
    if (clicked) return;

    clicked = true;
    lastDifference = music.duration - HIT_TIME;
    tapButton.classList.remove("energy");

    showResult();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        hideShareModal();
    }
});

function clearTimers() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    if (energyTimer) {
        clearTimeout(energyTimer);
        energyTimer = null;
    }
}
