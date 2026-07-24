const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// 1. 👇 ESTO ES NUEVO: Le dice a Express que sirva los HTML/CSS/JS de la carpeta "public"
app.use(express.static('public'));

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
        // Guardamos temporalmente la facción elegida en la instancia del socket
        socket.faccionElegida = datos.faccion;

        if (!jugadorEnEspera) {
            // Primer jugador: no hay nadie, queda en espera
            jugadorEnEspera = socket;
            console.log(`⏳ Jugador ${socket.id} quedó en espera con la facción: ${datos.faccion}`);
            socket.emit('estado_espera', 'Buscando oponente...');
        } else {
            // Segundo jugador: ya hay alguien esperando, armamos la sala automática
            const oponente = jugadorEnEspera;
            jugadorEnEspera = null; // Liberamos la cola para los siguientes

            // Generamos un ID de sala único basado en marca de tiempo
            const salaId = 'sala_' + Date.now();

            // Unimos a ambos sockets a la sala privada
            oponente.join(salaId);
            socket.join(salaId);

            console.log(`⚔️ Partida creada automáticamente en la sala: ${salaId}`);
            console.log(`- Jugador 1 (Crear / ${oponente.id}): ${oponente.faccionElegida}`);
            console.log(`- Jugador 2 (Unirse / ${socket.id}): ${socket.faccionElegida}`);

            // Le mandamos rol de 'crear' (Jugador 1) al que estaba esperando
            oponente.emit('iniciar_partida_multi', {
                salaId: salaId,
                rol: 'crear',
                j1Faccion: oponente.faccionElegida,
                j2Faccion: socket.faccionElegida
            });

            // Le mandamos rol de 'unirse' (Jugador 2) al que acaba de llegar
            socket.emit('iniciar_partida_multi', {
                salaId: salaId,
                rol: 'unirse',
                j1Faccion: oponente.faccionElegida,
                j2Faccion: socket.faccionElegida
            });
        }
    });

    // Recepción y reenvío de jugadas durante la partida
    socket.on('jugada', (data) => {
        socket.to(data.sala).emit('jugada_recibida', data);
    });

    // 👇 PARA QUE LOS TABLEROS PUEDAN ENTRAR A LA SALA 👇
    socket.on('unirse_sala', (datos) => {
        socket.join(datos.salaId);
        console.log(`🔌 Jugador reconectado desde el tablero a la sala: ${datos.salaId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Un usuario se desconectó:', socket.id);
        
        // Si el usuario que se desconectó estaba esperando oponente, liberamos la cola
        if (jugadorEnEspera === socket) {
            jugadorEnEspera = null;
            console.log('❌ El jugador en espera se desconectó. Cola limpiada.');
        }
    });
});

// 2. 👇 ESTO ES NUEVO: Render necesita un puerto dinámico (process.env.PORT)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log('Esperando conexiones...');
});