const express = require('express');
const http = require('http');
const {Server} = require('socket.io');

const app = express();  // Iniciando servidor express
const server = http.createServer(app); // Criando Server

const io = new Server(server);  // Web Socket


app.get('/', (req,res) => {
    res.sendFile(__dirname + '/index.html');
});


let esperandoUsuario = null;


// Fazendo a conexão
io.on('connection', (socket) => {
    console.log('Um usuario se conectou');

    socket.on('set username', (username) => {
        socket.username = username; // Capturando o nome do usuario

        // Quem conectou na sala
        console.log(`${username} entrou na sala`);
    
        if (esperandoUsuario){
            // Se ha um usuario esperando, emparelha os dois
            socket.partner = esperandoUsuario;
            esperandoUsuario.partner = socket;

            // Notificar os usuarios conectados
            esperandoUsuario.emit('chat start', `Falando com: ${socket.username}`);
            socket.emit('chat start', `Falando com: ${esperandoUsuario.username}`);
            // Zeramos o usuario que esta esperando
            esperandoUsuario = null;
        }else {
            // Se nao tem ninguem esperando, colocar ele na espera

            esperandoUsuario = socket;
            socket.emit('waiting', 'Aguardando por um usuario')
        }
    });


    // enviar mensagem
    
    socket.on('chat message', (msg) => {
        if(socket.partner) {
            socket.partner.emit('chat message', `${socket.username}: ${msg}`);
        }
    })
    // se desconectar

    socket.on('manual disconnect', () => {
        if (socket.partner) {
            socket.partner.emit('chat end', `${socket.username} desconectou.`);
            socket.partner.partner = null;
            socket.partner = null;
        }

        socket.emit('chat end', `Voce desconectou`);
        console.log("caiu aqui")
    })
    
    // lidar com a desconexão
    socket.on('disconnect', () => {
        console.log('Usuario se desconectou');
        if (socket.partner) {
            socket.partner.emit('chat end', `${socket.username} se desconectou.`);
            socket.partner.partner = null;
        }
        if (esperandoUsuario === socket){
            esperandoUsuario = null;
        }
    })
})

server.listen(3000, ()=> {
    console.log(`Servidor na porta 3000`);
})