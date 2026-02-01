document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const spinButton = document.getElementById('spinButton');
    const resultCard = document.getElementById('resultCard');
    const resultEmoji = document.getElementById('resultEmoji');
    const resultText = document.getElementById('resultText');
    const resultInstruction = document.getElementById('resultInstruction');
    const rulesToggle = document.getElementById('rulesToggle');
    const rulesContent = document.getElementById('rulesContent');
    const rulesArrow = document.getElementById('rulesArrow');
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    const confettiContainer = document.getElementById('confettiContainer');

    let isSpinning = false;
    let spinCount = 0;
    let currentRotation = 0;

    rulesToggle.addEventListener('click', () => {
        rulesContent.classList.toggle('show');
        rulesArrow.classList.toggle('rotated');
    });

    spinButton.addEventListener('click', () => {
        if (isSpinning) return;
        spin();
    });

    function spin() {
        isSpinning = true;
        spinButton.disabled = true;
        spinCount++;

        resultCard.classList.remove('truth', 'dare');
        resultEmoji.textContent = '🎰';
        resultText.textContent = 'Đang quay...';
        resultInstruction.textContent = 'Chờ kết quả nhé!';

        const extraSpins = 5 + Math.floor(Math.random() * 3);
        const randomAngle = Math.random() * 360;
        const totalRotation = extraSpins * 360 + randomAngle;
        currentRotation += totalRotation;

        spinner.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        spinner.style.transform = `rotate(${currentRotation}deg)`;

        setTimeout(() => {
            const normalizedAngle = currentRotation % 360;
            const isTruth = normalizedAngle >= 90 && normalizedAngle < 270;

            showResult(isTruth);
            addToHistory(isTruth);
            createConfetti();

            isSpinning = false;
            spinButton.disabled = false;
        }, 4000);
    }

    function showResult(isTruth) {
        if (isTruth) {
            resultCard.classList.add('truth');
            resultEmoji.textContent = '🤔';
            resultText.textContent = 'THẬT!';
            resultInstruction.textContent = 'Hãy hỏi một câu hỏi về sự thật!';
        } else {
            resultCard.classList.add('dare');
            resultEmoji.textContent = '😈';
            resultText.textContent = 'THÁCH!';
            resultInstruction.textContent = 'Hãy đưa ra một thử thách!';
        }

        resultCard.style.animation = 'none';
        resultCard.offsetHeight;
        resultCard.style.animation = 'popIn 0.5s ease';
    }

    function addToHistory(isTruth) {
        historySection.classList.add('show');

        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${isTruth ? 'truth' : 'dare'}`;
        historyItem.innerHTML = `
            <span class="history-item-number">${spinCount}</span>
            <span>${isTruth ? 'Thật' : 'Thách'}</span>
        `;

        historyList.insertBefore(historyItem, historyList.firstChild);

        if (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
    }

    function createConfetti() {
        const colors = ['#F5B800', '#4ECDC4', '#FF6B6B', '#FFD54F', '#7EDCD5', '#FF8E8E'];
        const shapes = ['●', '■', '▲', '★', '♦'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.fontSize = (Math.random() * 12 + 8) + 'px';
            confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
            confetti.style.animation = `confettiFall ${Math.random() * 2 + 2}s linear forwards`;
            confetti.style.animationDelay = Math.random() * 0.5 + 's';

            confettiContainer.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 4500);
        }
    }

    spinner.style.transform = `rotate(${Math.random() * 360}deg)`;
    currentRotation = parseFloat(spinner.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
});
