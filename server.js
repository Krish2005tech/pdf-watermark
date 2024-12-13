const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const path = require('path');
// const {compressPDF} = require('node-compress-pdf');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/upload', upload.single('pdf'), async (req, res) => {
  const { text } = req.body;
  const filePath = req.file.path;

  try {
    // Load the PDF
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const { width, height } = pages[0].getSize();

    // Load the font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add watermark to each page
    // Define watermark parameters
    const fontSize = 50;

    const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
    const diagonalSpacing = 100; // Adjust this value for spacing between diagonal text lines
    const offset = Math.sqrt(width ** 2 + height ** 2) ; // Diagonal offset for full coverage

    // Add watermark to each page
    pages.forEach(page => {
        
      for (let y = -offset; y < height + offset*3; y += textWidth+fontSize) {
        for (let x = -offset; x < width + offset*3; x += helveticaFont.widthOfTextAtSize("Krish", fontSize) ) {

          page.drawText(text, {
            x: 0.707*x+0.707*y,
            y: 0.707*y-0.707*x,
            // x:x,
            // y:y,
            size: fontSize,
            font: helveticaFont,
            // color: rgb(0, 1, 1), // Cyan color
            rotate: degrees(45),
            opacity: 0.5,
          });
        }
      }
    });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Save the watermarked PDF
    const outputPath = path.join('uploads', `${req.file.filename}_watermarked.pdf`);
    fs.writeFileSync(outputPath, pdfBytes);

    // Respond with the file URL
    res.json({ url: `/${outputPath}` });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing the PDF.');
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
