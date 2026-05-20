import fs from 'fs';

async function test() {
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    console.log("pdfParse function type:", typeof pdfParse);
    console.log("pdfParse function:", pdfParse);
    
    // Test with dummy buffer to see what it returns/throws
    await pdfParse(Buffer.from('hello'));
  } catch (e) {
    console.error("ERROR CAUGHT:", e.message);
  }
}
test();
