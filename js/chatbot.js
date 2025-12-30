/**
 * LÓGICA DEL CHATBOT - VESTIE AI 
 */

async function ejecutarChat() {
    const input = document.getElementById('input-chat');
    const fileInput = document.getElementById('input-foto');

    if (!input) {
        console.error("Error: No encuentro la caja de texto (input-chat)");
        return;
    }

    const mensajeUsuario = input.value.trim();
    const imagen = fileInput ? fileInput.files[0] : null;

    if (!mensajeUsuario && !imagen) return;

    agregarMensajeVisual(mensajeUsuario, 'user', imagen);
    
    input.value = ''; 
    if(fileInput) fileInput.value = '';

    const loadingId = agregarLoading();

    try {
        if (!window.CONFIG || !window.CONFIG.GEMINI_API_KEY) {
            throw new Error("Falta la API KEY en config.js");
        }

        const partes = [];
        
        let promptCompleto = window.CONFIG.SYSTEM_PROMPT + "\n\nCliente dice: " + mensajeUsuario;
        partes.push({ text: promptCompleto });

        if (imagen) {
            const base64Data = await convertirImagenABase64(imagen);
            partes.push({
                inlineData: {
                    mimeType: imagen.type,
                    data: base64Data
                }
            });
        }

        const url = `${window.CONFIG.GEMINI_URL}?key=${window.CONFIG.GEMINI_API_KEY}`;
        
        const respuesta = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: partes }]
            })
        });

        const data = await respuesta.json();
        removerLoading(loadingId);

        if (data.error) {
            throw new Error(data.error.message || "Error en la API de Google");
        }

        if (data.candidates && data.candidates[0].content) {
            const textoIA = data.candidates[0].content.parts[0].text;
            agregarMensajeVisual(textoIA, 'bot');
        } else {
            agregarMensajeVisual("No supe qué decir... ¿Intentamos de nuevo?", 'bot');
        }

    } catch (error) {
        console.error("Error Chatbot:", error);
        removerLoading(loadingId);
        agregarMensajeVisual("⚠️ Error: " + error.message, 'bot');
    }
}

// --- FUNCIONES VISUALES 
function agregarMensajeVisual(texto, tipo, imagenFile = null) {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;

    const div = document.createElement('div');
    div.className = `d-flex mb-3 ${tipo === 'user' ? 'justify-content-end' : 'justify-content-start'}`;

    let contenidoHTML = '';
    
    if (imagenFile) {
        const url = URL.createObjectURL(imagenFile);
        contenidoHTML += `<img src="${url}" class="img-fluid rounded mb-2 border" style="max-width: 150px; display:block; margin-left: auto;">`;
    }

    const estiloBurbuja = tipo === 'user' 
        ? 'bg-primary text-white rounded-3 p-3 shadow-sm' 
        : 'bg-white text-dark rounded-3 p-3 shadow-sm border';

    if (texto) {
        const textoFormateado = texto.replace(/\n/g, '<br>');
        const textoFinal = textoFormateado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        contenidoHTML += `<div class="${estiloBurbuja}" style="max-width: 100%; font-size: 0.9rem;">${textoFinal}</div>`;
    }

    div.innerHTML = `<div style="max-width: 85%;">${contenidoHTML}</div>`;
    
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight; 
}

function agregarLoading() {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return null;

    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'd-flex justify-content-start mb-3';
    div.innerHTML = `
        <div class="bg-light text-muted rounded-3 p-2 small border">
            <i class="fa-solid fa-circle-notch fa-spin me-2 text-primary"></i>Analizando estilo...
        </div>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
}

function removerLoading(id) {
    if(!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
}

function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
}

const inputChat = document.getElementById('input-chat');
if(inputChat) {
    inputChat.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') ejecutarChat();
    });
}