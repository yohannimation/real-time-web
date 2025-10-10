let socket;
let lastContent = '';

let username, room, token;

document.getElementById('connectBtn').onclick = () => {
    username = document.getElementById('username').value || 'Anonyme';
    room = document.getElementById('room').value || 'default';
    token = document.getElementById('token').value || '12345';

    socket = io(`http://localhost:3000`, {
        query: { username, room, token },
    });

    socket.on('connect', () => {
        document.getElementById('roomName').textContent = room;
        log(`✅ Connecté en tant que <strong>${username}</strong>`);

        document.getElementById('form-connexion').classList.add('d-none')
        document.getElementById('editor').classList.remove('d-none')
    });

    socket.on('notification', (msg) => log(`📢 ${msg.message}`));
    socket.on('update', ({ username, data }) => {
        if (data !== lastContent) {
        document.getElementById('text').value = data;
        lastContent = data;
        log(`✏️ ${username} a modifié le texte`);
        }
    });
};

document.getElementById('disconnectBtn').onclick = () => {
    socket.emit('leaveRoom');
    socket.disconnect();

    document.getElementById('text').value = '';
    document.getElementById('form-connexion').classList.remove('d-none')
    document.getElementById('editor').classList.add('d-none')

    log(`🚪 Déconnecté du salon <strong>${room}</strong>.`);
};

const textarea = document.getElementById('text');
textarea.addEventListener('input', () => {
    const newValue = textarea.value;
    lastContent = newValue;
    socket.emit('update', newValue);
});

function log(message) {
    const logDiv = document.getElementById('log');
    logDiv.innerHTML += `<li class="list-group-item">${message}</li>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}
