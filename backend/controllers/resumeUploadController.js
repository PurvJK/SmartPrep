import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

const extractTextFromPdfBuffer = async (buffer) => {
  const pdfExtract = new PDFExtract();
  const data = await pdfExtract.extractBuffer(buffer);
  return data.pages.map(page => page.content.map(i => i.str).join(' ')).join(' ');
};

const extractTextFromDocxBuffer = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
};

export const uploadResumeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const mime = req.file.mimetype;
    const buffer = req.file.buffer;

    let text = '';
    if (mime === 'application/pdf') {
      text = await extractTextFromPdfBuffer(buffer);
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword'
    ) {
      text = await extractTextFromDocxBuffer(buffer);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }

    text = (text || '').trim();
    if (!text) {
      return res.status(422).json({ success: false, message: 'Unable to extract text from file' });
    }

    return res.status(200).json({ success: true, data: { text } });
  } catch (error) {
    console.error('Resume upload parse error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process file' });
  }
};






