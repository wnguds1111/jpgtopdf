// api/convert.js

const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { formidable } = require('formidable'); // v3+ 문법

// [중요] Vercel이 파일 스트림을 처리하도록 bodyParser 비활성화
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (request, response) => {
  // 1. POST 요청이 아니면 거부
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }

  try {
    // 2. formidable로 파일 파싱
    const form = formidable({});
    const [fields, files] = await form.parse(request);

    // 'images'는 app.js에서 보낸 FormData의 'key' 이름입니다.
    const imageFiles = files.images;
    if (!imageFiles || imageFiles.length === 0) {
      return response.status(400).json({ error: 'No images uploaded' });
    }

    // 3. 새 PDF 문서 생성
    const pdfDoc = await PDFDocument.create();

    // 4. 업로드된 이미지를 하나씩 PDF 페이지로 추가
    for (const file of imageFiles) {
      // Vercel 임시 폴더에 저장된 파일 읽기
      const imageBytes = fs.readFileSync(file.filepath);
      let image;

      // 파일 타입에 따라 JPG/PNG 이미지 임베딩
      if (file.mimetype === 'image/jpeg') {
        image = await pdfDoc.embedJpg(imageBytes);
      } else if (file.mimetype === 'image/png') {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        continue; // JPG/PNG가 아니면 건너뜀
      }

      // 이미지 크기대로 새 페이지를 추가하고 이미지 그리기
      const { width, height } = image.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
    }

    // 5. PDF 파일을 바이트 배열로 저장
    const pdfBytes = await pdfDoc.save();

    // 6. 프론트엔드로 PDF 파일 전송
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
    response.send(Buffer.from(pdfBytes)); // Buffer로 변환하여 전송

  } catch (error) {
    console.error('PDF conversion error:', error);
    response.status(500).json({ error: 'Error processing files' });
  }
};
