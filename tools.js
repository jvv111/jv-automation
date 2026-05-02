// ===========================
// Tools - Chatbot inline
// ===========================
const toolsHistory = [];

function renderMarkdown(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>(\n|$))+/g, (m) => `<ul>${m}</ul>`)
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[uol]|<p)(.+)$/gm, '<p>$1</p>');
}

function toolsAddMessage(text, role) {
    const el = document.getElementById('toolsMessages');
    const div = document.createElement('div');
    div.className = `tools-message ${role}`;
    if (role === 'bot') {
        div.innerHTML = renderMarkdown(text);
    } else {
        div.textContent = text;
    }
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
}

async function toolsSend() {
    const input = document.getElementById('toolsInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.disabled = true;

    toolsAddMessage(text, 'user');
    toolsHistory.push({ role: 'user', content: text });

    const loading = toolsAddMessage('Bezig met typen...', 'loading');

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: toolsHistory })
        });
        const data = await res.json();
        loading.remove();

        if (data.reply) {
            toolsAddMessage(data.reply, 'bot');
            toolsHistory.push({ role: 'assistant', content: data.reply });
        } else if (data.error === 'rate_limit') {
            toolsAddMessage('Door hoog verbruik is de assistent tijdelijk niet beschikbaar. Probeer het later opnieuw.', 'bot');
        } else {
            toolsAddMessage('Er ging iets mis. Probeer het opnieuw.', 'bot');
        }
    } catch (err) {
        loading.remove();
        toolsAddMessage('Er ging iets mis. Controleer de verbinding.', 'bot');
    }

    input.disabled = false;
    input.focus();
}
