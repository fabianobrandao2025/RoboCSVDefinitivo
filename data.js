const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const unzipper = require('unzipper');

const caData = new Map();
let isDataReady = false;

function loadData() {
  console.log('[DADOS] Iniciando carregamento do arquivo caepi.zip...');
  const zipFilePath = path.resolve(__dirname, 'caepi.zip');
  
  fs.createReadStream(zipFilePath)
    .pipe(unzipper.Parse())
    .on('entry', function (entry) {
      const fileName = entry.path;
      // Procura pelo arquivo .csv dentro do .zip
      if (fileName.toLowerCase().endsWith('.csv')) {
        console.log(`[DADOS] Arquivo CSV encontrado dentro do zip: ${fileName}`);
        
        // Lê o conteúdo do arquivo CSV
        entry.buffer().then(function(content) {
          const parser = parse(content, {
            delimiter: ';',
            columns: true,
            trim: true,
            encoding: 'latin1', // Especifica a codificação aqui
            skip_empty_lines: true
          });

          parser.on('readable', function(){
            let record;
            while ((record = parser.read()) !== null) {
              const caKey = record['CA'];
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
  if (!isDataReady) {
    return { error: 'A base de dados ainda está a ser carregada. Por favor, tente novamente em um minuto.' };
  }
  
  const caInfo = caData.get(String(caNumber).trim());
  if (caInfo) {
    return {
      'Nº do CA': caInfo['CA'],
      'Data de Validade': caInfo['Validade'],
      'Situação': caInfo['Situacao'],
      'Equipamento': caInfo['Equipamento'],
      'Fabricante': caInfo['Fabricante']
    };
  } else {
    return { error: `O CA "${caNumber}" não foi encontrado na base de dados.` };
  }
}

module.exports = { getCAInfo, loadData };