let chatHistory = [];
const CHAT_STORAGE_KEY = 'vestia_chat_history';
const CHAT_STATE_KEY = 'vestia_chat_state';

/* Arrancamos todo al cargar la página */
document.addEventListener('DOMContentLoaded', () => {
    ejecutarControlRemoto();
    inicializarChat();
    setupUIListeners();
});

/* Control remoto por URL  */
function ejecutarControlRemoto() {
    const params = new URLSearchParams(window.location.search);
    const generoObj = params.get('gender');

    if (generoObj) {
        setTimeout(() => {
            let radioAActivar = null;
            if (generoObj === 'hombre') {
                radioAActivar = document.getElementById('sexo-hombre');
            } else if (generoObj === 'mujer') {
                radioAActivar = document.getElementById('sexo-mujer');
            }

            if (radioAActivar) {
                radioAActivar.checked = true;
                if (window.aplicarFiltrosLocalesExterno) {
                    window.aplicarFiltrosLocalesExterno();
                } else {
                    const evento = new Event('change', { bubbles: true });
                    radioAActivar.dispatchEvent(evento);
                    const contenedorFiltros = document.getElementById('ordenar-productos');
                    if(contenedorFiltros) contenedorFiltros.dispatchEvent(evento);
                }
            }
        }, 500);
    }
}

/* Listeners de botones y teclas */
function setupUIListeners() {
    const inputChat = document.getElementById('input-chat');
    if(inputChat) {
        inputChat.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !inputChat.disabled) ejecutarChat();
        });
    }
    const btnFloat = document.querySelector('.btn-primary.position-fixed');
    if (btnFloat) {
        btnFloat.onclick = (e) => { e.preventDefault(); alternarVisibilidadChat(true); };
    }
    const chatContainer = document.getElementById('asistente-estilo');
    if (chatContainer) {
        const btnClose = chatContainer.querySelector('.btn-close');
        if (btnClose) { btnClose.onclick = (e) => { e.preventDefault(); alternarVisibilidadChat(false); }; }
        agregarBotonMinimizar(chatContainer);
    }
}

/* Crea una llave única para guardar el historial */
function obtenerClaveUsuario() {
    try {
        const datos = localStorage.getItem('vestia_preferencias');
        if (datos) {
            const perfil = JSON.parse(datos);
            if (perfil.nombre && perfil.nombre.trim()) {
                return `vestia_chat_history_${perfil.nombre.trim().replace(/[^a-zA-Z0-9]/g, '_')}`;
            }
        }
    } catch (e) {}
    return 'vestia_chat_history_guest';
}

/* Carga el historial guardado */
function inicializarChat() {
    const claveDinamica = obtenerClaveUsuario();
    const historialGuardado = localStorage.getItem(claveDinamica);
    const chatBody = document.getElementById('chat-body');
    chatHistory = []; 
    if (historialGuardado) {
        try {
            chatHistory = JSON.parse(historialGuardado);
            if(chatBody) {
                chatBody.innerHTML = ''; 
                chatHistory.forEach(turno => {
                    const esBot = turno.role === 'model';
                    let texto = turno.parts[0].text;
                    let accion = null;
                    let reaccion = null;
                    if (esBot) {
                        const procesado = limpiarYParsearJSON(texto);
                        texto = procesado.mensaje;
                        accion = procesado.accion;
                        reaccion = procesado.reaccion;
                    }
                    agregarMensajeVisual(texto, esBot ? 'bot' : 'user', null, accion, reaccion);
                });
            }
        } catch (e) { chatHistory = []; }
    }
    if (chatHistory.length === 0) {
        if(chatBody) chatBody.innerHTML = ''; 
        saludoInicialPersonalizado();
    }
    const estadoAbierto = localStorage.getItem(CHAT_STATE_KEY) === 'true';
    alternarVisibilidadChat(estadoAbierto);
}

/*  lo usa para saludar al usuario. */
function saludoInicialPersonalizado() {
    const datosUser = localStorage.getItem('vestia_preferencias');
    let nombreUsuario = '';
    if (datosUser) {
        try {
            const perfil = JSON.parse(datosUser);
            nombreUsuario = perfil.nombre ? ` ${perfil.nombre}` : '';
        } catch(e) {}
    }
    const mensajeBienvenida = `¡Hola${nombreUsuario}! Soy Vestie. ¿Qué buscas hoy?`;
    const turnoBot = {
        role: "model",
        parts: [{ text: JSON.stringify({ mensaje: mensajeBienvenida, reaccion: '👋', accion: null }) }]
    };
    chatHistory.push(turnoBot);
    guardarHistorial();
    agregarMensajeVisual(mensajeBienvenida, 'bot', null, null, '👋');
}

/* usa la API KEY directamente en la URL para que funcione en GitHub Pages */
async function ejecutarChat() {
    const input = document.getElementById('input-chat');
    const fileInput = document.getElementById('input-foto');
    const btnEnviar = document.querySelector('#asistente-estilo .card-footer .btn-primary');
    if (!input) return;

    const mensajeUsuario = input.value.trim();
    const imagen = fileInput ? fileInput.files[0] : null;

    if (!mensajeUsuario && !imagen) return;

    input.disabled = true;
    if(btnEnviar) btnEnviar.disabled = true;
    input.placeholder = "Consultando...";
    agregarMensajeVisual(mensajeUsuario, 'user', imagen);
    
    input.value = ''; 
    if(fileInput) fileInput.value = '';
    const loadingId = agregarLoading();

    try {
        const nuevoTurno = { role: "user", parts: [{ text: mensajeUsuario }] };
        
        // Si hay imagen, la convertimos a Base64 para Google
        if (imagen) {
            const base64Data = await convertirImagenABase64(imagen);
            nuevoTurno.parts.push({ inlineData: { mimeType: imagen.type, data: base64Data } });
        }
        
        chatHistory.push(nuevoTurno);
        guardarHistorial();

        const promptConContexto = construirPromptConPerfil();
        
        // Estructura oficial de Gemini
        const requestBody = {
            contents: chatHistory,
            system_instruction: { parts: [{ text: promptConContexto }] },
            generationConfig: { temperature: 0.5, maxOutputTokens: 600 }
        };

        //  Construimos la URL pegándole la KEY que pusimos en config.js
        const urlDirecta = `${window.CONFIG.GEMINI_URL}?key=${window.CONFIG.API_KEY}`;

        const respuesta = await fetch(urlDirecta, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            const errorMsg = data.error?.message || "Error desconocido";
            if (errorMsg.includes('429') || respuesta.status === 429) {
                throw new Error("GOOGLE_FULL"); 
            }
            throw new Error(errorMsg);
        }

        removerLoading(loadingId);
        if (data.candidates && data.candidates[0].content) {
            const textoRaw = data.candidates[0].content.parts[0].text;
            chatHistory.push({ role: "model", parts: [{ text: textoRaw }] });
            guardarHistorial();
            const procesado = limpiarYParsearJSON(textoRaw);
            agregarMensajeVisual(procesado.mensaje, 'bot', null, procesado.accion, procesado.reaccion);
        } else { throw new Error("Respuesta vacía"); }

    } catch (error) {
        console.error(error);
        removerLoading(loadingId);
        
        if (error.message === "GOOGLE_FULL" || error.message.includes("saturado")) {
            agregarMensajeVisual("🚦 **¡Google está a tope!** Espera un minutito, porfa.", 'bot', null, null, '⚠️');
        } else {
            // Mensaje genérico si falla la conexión
            agregarMensajeVisual("Tuve un error de conexión. ¿Revisaste el API KEY?", 'bot');
        }

    } finally {
        input.disabled = false;
        input.placeholder = "Escribe un mensaje...";
        if(btnEnviar) btnEnviar.disabled = false;
        input.focus();
    }
}

/* Le inyecta al "cerebro" los datos del usuario */
function construirPromptConPerfil() {
    let promptBase = window.CONFIG.SYSTEM_PROMPT;
    try {
        const datos = localStorage.getItem('vestia_preferencias');
        if (datos) {
            const perfil = JSON.parse(datos);
            promptBase += `\n[CONTEXTO USUARIO]: Nombre: ${perfil.nombre}, Género: ${perfil.genero}.`;
        }
    } catch(e) {}
    return promptBase;
}

/* Limpia la respuesta de la IA */
function limpiarYParsearJSON(texto) {
    try {
        let limpio = texto.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(limpio);
    } catch (e) {
        const mensajeMatch = texto.match(/"mensaje":\s*"([^"]*)"/);
        const urlMatch = texto.match(/"url":\s*"([^"]*)"/);
        const btnMatch = texto.match(/"textoBoton":\s*"([^"]*)"/);
        const reaccionMatch = texto.match(/"reaccion":\s*"([^"]*)"/);
        return {
            mensaje: mensajeMatch ? mensajeMatch[1] : texto.replace(/[{}]/g, ''),
            reaccion: reaccionMatch ? reaccionMatch[1] : "🤖",
            accion: urlMatch ? { textoBoton: btnMatch ? btnMatch[1] : "Ver", url: urlMatch[1] } : null
        };
    }
}

/* Funciones auxiliares */
function guardarHistorial() { localStorage.setItem(obtenerClaveUsuario(), JSON.stringify(chatHistory)); }
function alternarVisibilidadChat(mostrar) {
    const chatContainer = document.getElementById('asistente-estilo');
    if (chatContainer) {
        chatContainer.style.display = mostrar ? 'block' : 'none';
        localStorage.setItem(CHAT_STATE_KEY, mostrar);
    }
}
function agregarBotonMinimizar(headerElement) {
    const header = headerElement.querySelector('.card-header');
    if (!header || header.querySelector('.btn-minimize')) return;
    const btnClose = header.querySelector('.btn-close');
    const btnMin = document.createElement('button');
    btnMin.className = 'btn btn-sm btn-outline-light btn-minimize me-2 border-0';
    btnMin.innerHTML = '<i class="fa-solid fa-minus"></i>';
    btnMin.onclick = (e) => {
        e.stopPropagation();
        const body = document.getElementById('chat-body');
        const footer = headerElement.querySelector('.card-footer');
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'block' : 'none';
        footer.style.display = isHidden ? 'block' : 'none';
        btnMin.innerHTML = isHidden ? '<i class="fa-solid fa-minus"></i>' : '<i class="fa-regular fa-square"></i>';
    };
    header.insertBefore(btnMin, btnClose);
}

function agregarMensajeVisual(texto, tipo, imagenFile, accion, reaccion) {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;
    const div = document.createElement('div');
    div.className = `d-flex mb-3 ${tipo === 'user' ? 'justify-content-end' : 'justify-content-start'}`;
    let contenido = '';
    if (imagenFile) {
        const url = URL.createObjectURL(imagenFile);
        contenido += `<img src="${url}" class="img-fluid rounded mb-2 border shadow-sm" style="max-width: 150px; display:block; margin-left: auto;">`;
    }
    const claseBurbuja = tipo === 'user' ? 'bg-primary text-white' : 'bg-white text-dark border';
    const htmlReaccion = (reaccion && tipo === 'bot') ? `<div class="fs-4 mb-1">${reaccion}</div>` : '';
    let htmlBoton = '';
    if (accion && accion.url) {
        htmlBoton = `<div class="mt-2 pt-2 border-top"><a href="${accion.url}" class="btn btn-sm btn-outline-primary w-100 rounded-pill fw-bold text-decoration-none">${accion.textoBoton} <i class="fa-solid fa-arrow-right"></i></a></div>`;
    }
    const textoFinal = texto.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    contenido += `<div class="${claseBurbuja} rounded-3 p-3 shadow-sm" style="max-width: 100%; font-size: 0.9rem;">${htmlReaccion}<div>${textoFinal}</div>${htmlBoton}</div>`;
    div.innerHTML = `<div style="max-width: 85%;">${contenido}</div>`;
    chatBody.appendChild(div);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
}

function agregarLoading() {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return null;
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'd-flex justify-content-start mb-3';
    div.innerHTML = `<div class="bg-light text-muted rounded-3 p-2 small border shadow-sm"><i class="fa-solid fa-circle-notch fa-spin me-2 text-primary"></i> Procesando...</div>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return id;
}
function removerLoading(id) { const el = document.getElementById(id); if (el) el.remove(); }
function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}