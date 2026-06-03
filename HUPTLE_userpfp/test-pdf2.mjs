import { PDFParse } from 'pdf-parse';

async function test() {
  try {
    console.log(typeof PDFParse);
    const doc = new PDFParse({ data: Buffer.from('%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj 2 0 obj <</Type/Pages/Count 0/Kids[]>> endobj xref 0 3 0000000000 65535 f 0000000009 00000 n 0000000052 00000 n trailer <</Size 3/Root 1 0 R>> startxref 100 %%EOF') });
    console.log("parsing...");
    const pdfData = await doc.getText();
    console.log("text:", pdfData.text);
  } catch(e) {
    console.error("err:", e.message);
  }
}
test();
