const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const caData = new Map();
let isDataReady = false;

function loadData() {
  console.log('[DADOS] Iniciando carregamento do arquivo caepi.csv...');
  const csvFilePath = path.resolve(__dirname, 'caepi.csv');
  
  const fileContent = fs.readFileSync(csvFilePath, 'latin1'); 

  const parser = parse(fileContent, {
    delimiter: ';',
    columns: true,
    trim: true,
    skip_empty_lines: true
  });

  parser.on('readable', function(){
    let record;
    while ((record = parser.read()) !== null) {
      // --- A CORREÇÃO ESTÁ AQUI ---
      // Usando a coluna correta que descobrimos no diagnóstico: 'NR Registro CA'
      const caKey = record['NR Registro CA'];
      if (caKey) {
        caData.set(String(caKey).trim(), record);
      }
    }
  });

  parser.on('end', function(){
    isDataReady = true;
    console.log(`[DADOS] Base de dados carregada com sucesso. Total de ${caData.size} registros.`);
  });

  parser.on('error', function(err){
    console.error('[DADOS] ERRO AO LER O ARQUIVO CSV:', err.message);
  });
}

function getCAInfo(caNumber) {
  if (!isDataReady) {
    return { error: 'A base de dados ainda está a ser carregada. Por favor, tente novamente em um minuto.' };
  }
  
  const caInfo = caData.get(String(caNumber).trim());
  if (caInfo) {
    return caInfo; // Retorna o registro completo
  } else {
    return { error: `O CA "${caNumber}" não foi encontrado na base de dados.` };
  }
}

module.exports = { getCAInfo, loadData };