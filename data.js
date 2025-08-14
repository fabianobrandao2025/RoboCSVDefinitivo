// data.js - VERSÃO DE DIAGNÓSTICO FINAL
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

// As outras bibliotecas não são necessárias para este teste.
let isDataReady = false;

function loadData() {
  console.log('[DADOS] Iniciando diagnóstico do arquivo caepi.zip...');
  const zipFilePath = path.resolve(__dirname, 'caepi.zip');
  
  fs.createReadStream(zipFilePath)
    .pipe(unzipper.Parse())
    .on('entry', function (entry) {
      const fileName = entry.path;
      if (fileName.toLowerCase().endsWith('.csv')) {
        console.log(`[DADOS] Arquivo CSV encontrado: ${fileName}. Lendo amostra...`);
        
        // Lê apenas o início do arquivo para diagnóstico
        entry.buffer().then(function(content) {
            const fileSample = content.toString('latin1').substring(0, 500); // Pega os primeiros 500 caracteres
            console.log('--- DIAGNÓSTICO DO ARQUIVO CSV ---');
            console.log('Amostra do conteúdo (como o robô está a ler):');
            console.log('====================================');
            console.log(fileSample);
            console.log('====================================');
            console.log('Por favor, copie e cole o texto acima para análise.');
            console.log('--- FIM DO DIAGNÓSTICO ---');
        });
      } else {
        entry.autodrain();
      }
    })
    .on('error', function(err) {
      console.error('[DADOS] ERRO AO ABRIR O ARQUIVO ZIP:', err.message);
    });
}

function getCAInfo(caNumber) {
  // Resposta padrão durante o diagnóstico
  return { error: 'Robô em modo de diagnóstico. Verifique os logs do Render.' };
}

module.exports = { getCAInfo, loadData };