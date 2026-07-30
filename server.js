const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Le dice a Express que sirva los HTML/CSS/JS de la carpeta "public" permitiendo archivos y carpetas ocultas (necesario para .well-known)[cite: 1]
app.use(express.static('public', { dotfiles: 'allow' }));

// Configuramos CORS
const io = new Server(server, {
    cors: { origin: "*" }
});

// Variable global para gestionar la cola de espera del matchmaking automático
let jugadorEnEspera = null;

io.on('connection', (socket) => {
    console.log('🟢 Un usuario se conectó. ID de conexión:', socket.id);

    // --- LÓGICA DE MATCHMAKING AUTOMÁTICO ---
    socket.on('buscar_partida', (datos) => {
        socket.faccionElegida = datos.faccion;

        if (!jugadorEnEspera) {
            jugadorEnEspera = socket;
            console.log(`⏳ Jugador ${socket.id} quedó en espera con la facción: ${datos.faccion}`);
            socket.emit('estado_espera', 'Buscando oponente...');
        } else {
            const oponente = jugadorEnEspera;
            jugadorEnEspera = null; 

            const salaId = 'sala_' + Date.now();

            oponente.join(salaId);
            socket.join(salaId);

            console.log(`⚔️ Partida creada automáticamente en la sala: ${salaId}`);
            console.log(`- Jugador 1 (Crear / ${oponente.id}): ${oponente.faccionElegida}`);
            console.log(`- Jugador 2 (Unirse / ${socket.id}): ${socket.faccionElegida}`);

            oponente.emit('iniciar_partida_multi', {
                salaId: salaId,
                rol: 'crear',
                j1Faccion: oponente.faccionElegida,
                j2Faccion: socket.faccionElegida
            });

            socket.emit('iniciar_partida_multi', {
                salaId: salaId,
                rol: 'unirse',
                j1Faccion: oponente.faccionElegida,
                j2Faccion: socket.faccionElegida
            });
        }
    });

    socket.on('jugada', (data) => {
        socket.to(data.sala).emit('jugada_recibida', data);
    });

    socket.on('unirse_sala', (datos) => {
        socket.join(datos.salaId);
        console.log(`🔌 Jugador reconectado desde el tablero a la sala: ${datos.salaId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Un usuario se desconectó:', socket.id);
        if (jugadorEnEspera === socket) {
            jugadorEnEspera = null;
            console.log('❌ El jugador en espera se desconectó. Cola limpiada.');
        }
    });
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log('Esperando conexiones...');
});