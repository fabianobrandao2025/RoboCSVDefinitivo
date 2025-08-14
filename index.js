const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const { getCAInfo, loadData } = require('./data.js');

async function connectToWhatsApp() {
  console.log('[BOT] Preparando a base de dados em segundo plano...');
  loadData();

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("--- NOVO QR CODE, POR FAVOR ESCANEIE ---");
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexão fechada, a reconectar...', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('[BOT] Conectado com sucesso ao WhatsApp!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    const textoMensagem = (msg.message.conversation || msg.message.extendedTextMessage?.text)?.trim().toLowerCase();
    if (!textoMensagem) return;

    let resposta = null;
    const matchCA = textoMensagem.match(/^(ca)\s*(\d+)$/);

    if (matchCA) {
      const numeroCA = matchCA[2];
      const dados = getCAInfo(numeroCA); 
      if (dados.error) {
        resposta = dados.error;
      } else {
        // Usando os nomes de coluna corretos que descobrimos no diagnóstico
        resposta = `*✅ Resultado da Consulta do CA: ${dados['NR Registro CA']}*\n\n` +
                   `*Data de Validade:* ${dados['DATA DE VALIDADE']}\n` +
                   `*Situação:* ${dados['SITUACAO']}\n` +
                   `*Equipamento:* ${dados['DESCRICAO EQUIPAMENTO']}\n\n` +
                   `*Fabricante:* ${dados['RAZAO SOCIAL']}`;
      }
    } else if (textoMensagem === 'oi' || textoMensagem === 'olá' || textoMensagem === 'ola') {
      resposta = 'Olá! Para consultar um Certificado de Aprovação, envie uma mensagem no formato: *CA 12345*';
    }

    if (resposta) {
      await sock.sendMessage(msg.key.remoteJid, { text: resposta });
    }
  });
}

connectToWhatsApp();