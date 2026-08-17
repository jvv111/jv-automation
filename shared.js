// ===========================
// Mobile nav toggle
// ===========================
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });
}

// ===========================
// Fade-in on scroll
// ===========================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===========================
// Smooth scroll for anchors
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const id = this.getAttribute('href');
        if (id === '#') { e.preventDefault(); return; }
        const t = document.querySelector(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});

// ===========================
// Chat popup widget
// ===========================
const popupHistory = [];

function toggleChat() {
    const popup = document.getElementById('chatPopup');
    const iconOpen = document.getElementById('iconOpen');
    const iconClose = document.getElementById('iconClose');
    const dot = document.getElementById('chatDot');
    if (!popup) return;
    popup.classList.toggle('open');
    const isOpen = popup.classList.contains('open');
    iconOpen.style.display = isOpen ? 'none' : 'block';
    iconClose.style.display = isOpen ? 'block' : 'none';
    dot.style.display = isOpen ? 'none' : 'block';
    if (isOpen) document.getElementById('popupInput').focus();
}

function popupRenderMarkdown(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>(\n|$))+/g, (m) => `<ul>${m}</ul>`)
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[uol]|<p)(.+)$/gm, '<p>$1</p>');
}

function popupAddMessage(text, role) {
    const el = document.getElementById('popupMessages');
    const div = document.createElement('div');
    div.className = `popup-message ${role}`;
    div.innerHTML = role === 'bot' ? popupRenderMarkdown(text) : '';
    if (role !== 'bot') div.textContent = text;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
}

function popupTypeMessage(div, text) {
    const el = document.getElementById('popupMessages');
    const tokens = text.split(/(\s+)/);
    let shown = '';
    let i = 0;
    return new Promise((resolve) => {
        function step() {
            if (i >= tokens.length) { resolve(); return; }
            shown += tokens[i];
            i++;
            div.innerHTML = popupRenderMarkdown(shown);
            el.scrollTop = el.scrollHeight;
            if (tokens[i - 1].trim() === '') { step(); return; }
            setTimeout(step, 35);
        }
        step();
    });
}

async function popupSend() {
    const input = document.getElementById('popupInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.disabled = true;

    popupAddMessage(text, 'user');
    popupHistory.push({ role: 'user', content: text });
    const loading = popupAddMessage('Bezig met typen...', 'loading');

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: popupHistory })
        });
        const data = await res.json();
        loading.remove();
        if (data.reply) {
            const botDiv = popupAddMessage('', 'bot');
            await popupTypeMessage(botDiv, data.reply);
            popupHistory.push({ role: 'assistant', content: data.reply });
        } else if (data.error === 'rate_limit') {
            popupAddMessage('Door hoog verbruik is de assistent tijdelijk niet beschikbaar. Probeer het later opnieuw.', 'bot');
        } else {
            popupAddMessage('Er ging iets mis. Probeer het opnieuw.', 'bot');
        }
    } catch (err) {
        loading.remove();
        popupAddMessage('Er ging iets mis. Controleer de verbinding.', 'bot');
    }
    input.disabled = false;
    input.focus();
}
