const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { processPDFAndSaveChunks } = require('../src/utils/pdf-chunker'); // Adjust path if needed

async function processPDF() {
  const pdfPath = path.join(__dirname, '../public/test.pdf'); // Path to PDF in public
  const chunksDir = path.join(__dirname, '../chunks'); // Directory for chunks
  const outputPath = path.join(chunksDir, 'my-document.json'); // Output JSON path
  const maxChunkSize = 800;

  try {
    await processPDFAndSaveChunks(pdfPath, outputPath, maxChunkSize);
    console.log('PDF processing complete!');
  } catch (error) {
    console.error('Error processing PDF:', error);
    process.exit(1); // Exit with an error code
  }
}

processPDF();