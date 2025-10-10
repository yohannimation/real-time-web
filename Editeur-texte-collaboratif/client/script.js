let socket;
let lastContent = '';

document.getElementById('connectBtn').onclick = () => {
    const username = document.getElementById('username').value || 'Anonyme';
    const room = document.getElementById('room').value || 'default';
    const token = document.getElementById('token').value || '12345';

    socket = io(`http://localhost:3000`, {
        query: { username, room, token },
    });

    socket.on('connect', () => {
        document.getElementById('editor').style.display = 'block';
        document.getElementById('roomName').textContent = room;
        log(`✅ Connecté en tant que ${username}`);
    });

    socket.on('notification', (msg) => log(`📢 ${msg}`));
    socket.on('update', ({ username, data }) => {
        if (data !== lastContent) {
        document.getElementById('text').value = data;
        lastContent = data;
        log(`✏️ ${username} a modifié le texte`);
        }
    });
};

const textarea = document.getElementById('text');
textarea.addEventListener('input', () => {
    const newValue = textarea.value;
    lastContent = newValue;
    socket.emit('update', newValue);
});

function log(message) {
    const logDiv = document.getElementById('log');
    logDiv.innerHTML += `<div>${message}</div>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}
