const SUPABASE_URL = 'https://mldxyiidrjkvnvqkfxus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZHh5aWlkcmprdm52cWtmeHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjE0MTgsImV4cCI6MjA4NTQ5NzQxOH0.sG-TGA1SHb4mrc_IgupbhRt9knGPloVWxzipIi7ruI8';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentPlayer = null;
let currentType = null;
let currentRotation = 0;
let isSpinning = false;

const joinScreen = document.getElementById('joinScreen');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerName');
const joinButton = document.getElementById('joinButton');
const playerCountJoin = document.getElementById('playerCountJoin');
const currentPlayerName = document.getElementById('currentPlayerName');
const playerCount = document.getElementById('playerCount');
const playersList = document.getElementById('playersList');
const spinner = document.getElementById('spinner');
const spinButton = document.getElementById('spinButton');
const resultCard = document.getElementById('resultCard');
const resultType = document.getElementById('resultType');
const resultChallenge = document.getElementById('resultChallenge');
const nextChallengeBtn = document.getElementById('nextChallengeBtn');
const truthList = document.getElementById('truthList');
const dareList = document.getElementById('dareList');
const truthCount = document.getElementById('truthCount');
const dareCount = document.getElementById('dareCount');
const tabs = document.querySelectorAll('.tab');

async function initApp() {
    renderChallenges();
    setupTabs();
    await loadPlayers();
    subscribeToPlayers();

    const savedPlayer = localStorage.getItem('ech_player');
    if (savedPlayer) {
        const player = JSON.parse(savedPlayer);
        const exists = await checkPlayerExists(player.id);
        if (exists) {
            currentPlayer = player;
            showGameScreen();
        } else {
            localStorage.removeItem('ech_player');
        }
    }
}

function renderChallenges() {
    truthList.innerHTML = TRUTH_CHALLENGES.map(c => 
        `<div class="challenge-item">${c}</div>`
    ).join('');
    
    dareList.innerHTML = DARE_CHALLENGES.map(c => 
        `<div class="challenge-item">${c}</div>`
    ).join('');

    truthCount.textContent = TRUTH_CHALLENGES.length;
    dareCount.textContent = DARE_CHALLENGES.length;
}

function setupTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}List`).classList.add('active');
        });
    });
}

async function checkPlayerExists(playerId) {
    const { data } = await supabase
        .from('players')
        .select('id')
        .eq('id', playerId)
        .single();
    return !!data;
}

async function loadPlayers() {
    const { data, error } = await supabase
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

    playersList.innerHTML = players.map(p => `
        <div class="player-item ${currentPlayer && p.id === currentPlayer.id ? 'current' : ''}">
            <div class="player-avatar">${p.name.charAt(0).toUpperCase()}</div>
            <div class="player-info">
                <div class="player-info-name">${escapeHtml(p.name)}</div>
                <div class="player-status">Online</div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function subscribeToPlayers() {
    supabase
        .channel('players')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
            loadPlayers();
        })
        .subscribe();
}

async function joinGame(name) {
    const { data, error } = await supabase
        .from('players')
        .insert([{ name: name.trim() }])
        .select()
        .single();

    if (error) {
        console.error('Error joining game:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại!');
        return null;
    }

    return data;
}

function showGameScreen() {
    joinScreen.classList.add('hidden');
    gameScreen.classList.add('active');
    currentPlayerName.textContent = currentPlayer.name;
    loadPlayers();
}

joinButton.addEventListener('click', async () => {
    const name = playerNameInput.value.trim();
    if (!name) {
        playerNameInput.focus();
        return;
    }

    joinButton.disabled = true;
    joinButton.textContent = 'Đang tham gia...';

    const player = await joinGame(name);
    if (player) {
        currentPlayer = player;
        localStorage.setItem('ech_player', JSON.stringify(player));
        showGameScreen();
    }

    joinButton.disabled = false;
    joinButton.textContent = 'Tham gia ngay';
});

playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinButton.click();
    }
});

spinButton.addEventListener('click', () => {
    if (isSpinning) return;
    spin();
});

function spin() {
    isSpinning = true;
    spinButton.disabled = true;

    resultCard.classList.remove('truth', 'dare');
    resultType.textContent = 'Đang quay...';
    resultChallenge.textContent = '🎰';

    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const randomAngle = Math.random() * 360;
    const totalRotation = extraSpins * 360 + randomAngle;
    currentRotation += totalRotation;

    spinner.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        const normalizedAngle = currentRotation % 360;
        const isTruth = normalizedAngle >= 90 && normalizedAngle < 270;
        
        currentType = isTruth ? 'truth' : 'dare';
        showRandomChallenge();

        isSpinning = false;
        spinButton.disabled = false;
    }, 4000);
}

function showRandomChallenge() {
    const challenges = currentType === 'truth' ? TRUTH_CHALLENGES : DARE_CHALLENGES;
    const randomIndex = Math.floor(Math.random() * challenges.length);
    const challenge = challenges[randomIndex];

    resultCard.classList.remove('truth', 'dare');
    resultCard.classList.add(currentType);
    resultType.textContent = currentType === 'truth' ? '🤔 Thật' : '😈 Thách';
    resultChallenge.textContent = challenge;
}

nextChallengeBtn.addEventListener('click', () => {
    if (currentType) {
        showRandomChallenge();
    }
});

window.addEventListener('beforeunload', async () => {
    if (currentPlayer) {
        await supabase
            .from('players')
            .delete()
            .eq('id', currentPlayer.id);
    }
});

initApp();
