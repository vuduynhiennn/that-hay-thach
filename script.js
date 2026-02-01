const SUPABASE_URL = 'https://mldxyiidrjkvnvqkfxus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZHh5aWlkcmprdm52cWtmeHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjE0MTgsImV4cCI6MjA4NTQ5NzQxOH0.sG-TGA1SHb4mrc_IgupbhRt9knGPloVWxzipIi7ruI8';

const ADMIN_NAME = 'VuDuyNhien';
const MAX_HISTORY = 20;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentPlayer = null;
let currentType = null;
let currentRotation = 0;
let isSpinning = false;
let isAdmin = false;

let truthChallenges = [...TRUTH_CHALLENGES];
let dareChallenges = [...DARE_CHALLENGES];
let usedChallenges = new Set();

const joinScreen = document.getElementById('joinScreen');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerName');
const joinButton = document.getElementById('joinButton');
const leaveButton = document.getElementById('leaveButton');
const playerCountJoin = document.getElementById('playerCountJoin');
const currentPlayerName = document.getElementById('currentPlayerName');
const playerCount = document.getElementById('playerCount');
const playersList = document.getElementById('playersList');
const spinnerCanvas = document.getElementById('spinnerCanvas');
const spinButton = document.getElementById('spinButton');
const resultCard = document.getElementById('resultCard');
const resultType = document.getElementById('resultType');
const resultChallenge = document.getElementById('resultChallenge');
const nextChallengeBtn = document.getElementById('nextChallengeBtn');
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const adminBadge = document.getElementById('adminBadge');

let spinnerCtx = null;
let spinnerAnimationId = null;

function loadUsedChallenges() {
    const saved = localStorage.getItem('ech_used_challenges');
    if (saved) {
        usedChallenges = new Set(JSON.parse(saved));
    }
}

function saveUsedChallenges() {
    localStorage.setItem('ech_used_challenges', JSON.stringify([...usedChallenges]));
}

async function initApp() {
    loadUsedChallenges();
    initSpinner();
    await loadPlayers();
    await loadSpinHistory();
    subscribeToPlayers();
    subscribeToSpinHistory();

    const savedPlayer = localStorage.getItem('ech_player');
    if (savedPlayer) {
        const player = JSON.parse(savedPlayer);
        const exists = await checkPlayerExists(player.id);
        if (exists) {
            currentPlayer = player;
            checkAdmin();
            showGameScreen();
        } else {
            const rejoined = await rejoinGame(player.name);
            if (rejoined) {
                currentPlayer = rejoined;
                localStorage.setItem('ech_player', JSON.stringify(rejoined));
                checkAdmin();
                showGameScreen();
            } else {
                localStorage.removeItem('ech_player');
            }
        }
    }
}

function initSpinner() {
    if (!spinnerCanvas) return;
    spinnerCtx = spinnerCanvas.getContext('2d');
    drawSpinner(0);
}

function drawSpinner(rotation) {
    if (!spinnerCtx) return;
    const size = 180;
    const center = size / 2;
    const radius = center - 4;

    spinnerCtx.clearRect(0, 0, size, size);
    spinnerCtx.save();
    spinnerCtx.translate(center, center);
    spinnerCtx.rotate((rotation * Math.PI) / 180);

    spinnerCtx.beginPath();
    spinnerCtx.moveTo(0, 0);
    spinnerCtx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2, false);
    spinnerCtx.closePath();
    spinnerCtx.fillStyle = '#0ea5e9';
    spinnerCtx.fill();

    spinnerCtx.beginPath();
    spinnerCtx.moveTo(0, 0);
    spinnerCtx.arc(0, 0, radius, Math.PI / 2, -Math.PI / 2, false);
    spinnerCtx.closePath();
    spinnerCtx.fillStyle = '#ef4444';
    spinnerCtx.fill();

    spinnerCtx.fillStyle = '#ffffff';
    spinnerCtx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
    spinnerCtx.textAlign = 'center';
    spinnerCtx.textBaseline = 'middle';
    
    spinnerCtx.fillText('THẬT', radius / 2, 0);
    spinnerCtx.fillText('THÁCH', -radius / 2, 0);

    spinnerCtx.beginPath();
    spinnerCtx.arc(0, 0, 24, 0, Math.PI * 2);
    spinnerCtx.fillStyle = '#ffffff';
    spinnerCtx.fill();
    spinnerCtx.fillStyle = '#1a1a1a';
    spinnerCtx.font = 'bold 18px "Be Vietnam Pro", sans-serif';
    spinnerCtx.fillText('?', 0, 1);

    spinnerCtx.restore();
}


function checkAdmin() {
    isAdmin = currentPlayer && currentPlayer.name.toLowerCase() === ADMIN_NAME.toLowerCase();
    if (isAdmin) {
        adminBadge.style.display = 'inline-flex';
    } else {
        adminBadge.style.display = 'none';
    }
}

function getAllTruthChallenges() {
    return [...truthChallenges];
}

function getAllDareChallenges() {
    return [...dareChallenges];
}

async function checkPlayerExists(playerId) {
    const { data } = await supabaseClient
        .from('players')
        .select('id')
        .eq('id', playerId)
        .single();
    return !!data;
}

async function loadPlayers() {
    const { data, error } = await supabaseClient
        .from('players')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error loading players:', error);
        return;
    }

    updatePlayersList(data || []);
}

function updatePlayersList(players) {
    playerCountJoin.textContent = players.length;
    playerCount.textContent = players.length;

    if (players.length === 0) {
        playersList.innerHTML = `
            <div class="history-empty" style="padding: 12px;">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                </svg>
                <span>Chưa có ai</span>
            </div>
        `;
        return;
    }

    playersList.innerHTML = players.map(p => {
        const isCurrent = currentPlayer && p.id === currentPlayer.id;
        const isPlayerAdmin = p.name.toLowerCase() === ADMIN_NAME.toLowerCase();
        return `
            <div class="player-chip ${isCurrent ? 'current' : ''} ${isPlayerAdmin ? 'admin' : ''}">
                <div class="player-avatar">${p.name.charAt(0).toUpperCase()}</div>
                <span class="player-chip-name">${escapeHtml(p.name)}</span>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function subscribeToPlayers() {
    supabaseClient
        .channel('players-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
            loadPlayers();
        })
        .subscribe();
}

function subscribeToSpinHistory() {
    supabaseClient
        .channel('spin-history-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'spin_history' }, () => {
            loadSpinHistory();
        })
        .subscribe();
}

async function loadSpinHistory() {
    const { data, error } = await supabaseClient
        .from('spin_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY);

    if (error) {
        console.error('Error loading spin history:', error);
        return;
    }

    renderHistory(data || []);
}

function renderHistory(history) {
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Chưa có lượt quay nào</span>
            </div>
        `;
        historyCount.textContent = '0';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <span class="history-type ${item.type}">${item.type === 'truth' ? 'Thật' : 'Thách'}</span>
            <div class="history-content">
                <span class="history-player">${escapeHtml(item.player_name)}</span>
                <span class="history-text">${escapeHtml(item.challenge)}</span>
            </div>
        </div>
    `).join('');
    historyCount.textContent = history.length;
}

async function addToHistory(type, challenge) {
    if (!currentPlayer) return;

    const { error } = await supabaseClient
        .from('spin_history')
        .insert([{
            player_name: currentPlayer.name,
            type: type,
            challenge: challenge
        }]);

    if (error) {
        console.error('Error adding to history:', error);
    }
}

async function joinGame(name) {
    const { data, error } = await supabaseClient
        .from('players')
        .insert([{ name: name.trim() }])
        .select()
        .single();

    if (error) {
        console.error('Error joining game:', error);
        showToast('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        return null;
    }

    return data;
}

async function rejoinGame(name) {
    return await joinGame(name);
}

async function leaveGame() {
    if (!currentPlayer) return;

    const playerName = currentPlayer.name;
    const { error } = await supabaseClient
        .from('players')
        .delete()
        .eq('id', currentPlayer.id);

    if (error) {
        console.error('Error leaving game:', error);
        showToast('Có lỗi khi rời phòng!', 'error');
        return;
    }

    currentPlayer = null;
    localStorage.removeItem('ech_player');
    showToast(`Tạm biệt ${playerName}!`);
    showJoinScreen();
}

function showGameScreen() {
    joinScreen.classList.add('hidden');
    gameScreen.classList.add('active');
    currentPlayerName.textContent = currentPlayer.name;
    loadPlayers();
}

function showJoinScreen() {
    gameScreen.classList.remove('active');
    joinScreen.classList.remove('hidden');
    playerNameInput.value = '';
}

function showToast(message, type = '') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

joinButton.addEventListener('click', async () => {
    const name = playerNameInput.value.trim();
    if (!name) {
        playerNameInput.focus();
        return;
    }

    joinButton.disabled = true;
    joinButton.textContent = 'Đang vào...';

    const player = await joinGame(name);
    if (player) {
        currentPlayer = player;
        localStorage.setItem('ech_player', JSON.stringify(player));
        checkAdmin();
        showGameScreen();
        showToast(`Chào ${player.name}!`, 'success');
    }

    joinButton.disabled = false;
    joinButton.textContent = 'Tham gia ngay';
});

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinButton.click();
    }
});

if (leaveButton) {
    leaveButton.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn rời phòng?')) {
            leaveGame();
        }
    });
}

spinButton.addEventListener('click', () => {
    if (isSpinning) return;
    spin();
});

function getUnusedChallenge(type) {
    const challenges = type === 'truth' ? getAllTruthChallenges() : getAllDareChallenges();
    const key = type;
    
    const unused = challenges.filter(c => !usedChallenges.has(`${key}_${c}`));
    
    if (unused.length === 0) {
        challenges.forEach(c => usedChallenges.delete(`${key}_${c}`));
        saveUsedChallenges();
        return challenges[Math.floor(Math.random() * challenges.length)];
    }
    
    return unused[Math.floor(Math.random() * unused.length)];
}

function spin() {
    isSpinning = true;
    spinButton.disabled = true;

    resultCard.classList.remove('truth', 'dare');
    resultType.textContent = 'Đang quay...';
    resultChallenge.textContent = '🎰';

    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const randomAngle = Math.random() * 360;
    const totalRotation = extraSpins * 360 + randomAngle;
    const targetRotation = currentRotation + totalRotation;

    const startRotation = currentRotation;
    const duration = 4000;
    const startTime = Date.now();

    function animateSpin() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const current = startRotation + (totalRotation * easeProgress);
        drawSpinner(current);

        if (progress < 1) {
            spinnerAnimationId = requestAnimationFrame(animateSpin);
        } else {
            currentRotation = targetRotation;
            const normalizedAngle = currentRotation % 360;
            const isTruth = normalizedAngle >= 180;
            
            currentType = isTruth ? 'truth' : 'dare';
            showRandomChallenge();

            isSpinning = false;
            spinButton.disabled = false;
        }
    }

    animateSpin();
}

async function showRandomChallenge() {
    const challenge = getUnusedChallenge(currentType);
    
    usedChallenges.add(`${currentType}_${challenge}`);
    saveUsedChallenges();

    resultCard.classList.remove('truth', 'dare');
    resultCard.classList.add(currentType);
    resultType.textContent = currentType === 'truth' ? 'THẬT' : 'THÁCH';
    resultChallenge.textContent = challenge;

    await addToHistory(currentType, challenge);
}

nextChallengeBtn.addEventListener('click', () => {
    if (currentType) {
        showRandomChallenge();
    }
});

initApp();
