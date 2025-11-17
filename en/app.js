// [파일 이름: en/app.js] - (영어 번역본 예시)

// ... (기존 PDF 생성 로직은 동일) ...

// [p]를 클릭하면 파일 선택창이 뜨도록 함
dropZonePrompt.addEventListener('click', () => fileInput.click()); 

// ...

// 파일 유효성 검사 (예시)
function validateFile(file) {
    if (file.size > 10 * 1024 * 1024) { // 예: 10MB
        // ✅ [영어 번역]
        alert('File size exceeds 10MB: ' + file.name);
        return false;
    }
    return true;
}

// ...

// PDF 변환 버튼 텍스트 (예시)
function updateConvertButton() {
    if (images.length > 0) {
        // ✅ [영어 번역]
        convertButton.textContent = `Convert ${images.length} image(s) to PDF`;
        convertButton.disabled = false;
    } else {
        // ✅ [영어 번역]
        convertButton.textContent = 'Convert to PDF';
        convertButton.disabled = true;
    }
}

// ...

// 로딩 인디케이터 텍스트 (HTML에 이미 번역됨)
// loadingText.textContent = 'Creating PDF file...';

// ...

// PDF 생성 완료 시 (예시)
function downloadPDF(pdfBlob) {
    // ...
    // ✅ [영어 번역]
    a.download = 'converted_images.pdf';
    a.click();
    // ...
}

// ...

// 에러 발생 시 (예시)
async function handleFormSubmit(e) {
    e.preventDefault();
    // ...
    try {
        // ... (PDF 생성 로직) ...
    } catch (error) {
        console.error('PDF Conversion Error:', error);
        // ✅ [영어 번역]
        alert('Failed to convert PDF. Please try again. Error: ' + error.message);
    } finally {
        // ...
    }
}
