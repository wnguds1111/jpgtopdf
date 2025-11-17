// [파일 이름: en/app.js]
// 썸네일 미리보기 기능을 제거한 버전입니다.

// jsPDF 라이브러리 할당 (index.html에서 로드됨)
const { jsPDF } = window.jspdf;

// --- [ 0. DOM 요소 캐싱 ] ---
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropZonePrompt = document.querySelector('.drop-zone-prompt'); 
const fileList = document.getElementById('fileList');
const convertButton = document.getElementById('convertButton');
const loadingIndicator = document.getElementById('loadingIndicator');

let uploadedImages = []; // 업로드된 이미지 파일들을 저장할 배열

// --- [ 1. 이벤트 리스너 설정 ] ---

// 'p' 태그 클릭 시 파일 입력창 열기
dropZonePrompt.addEventListener('click', () => {
    fileInput.click();
});

// 파일 입력(input) 변경 시
fileInput.addEventListener('change', handleFileSelect);

// 드래그 앤 드롭 이벤트
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    fileInput.files = e.dataTransfer.files; // 드롭된 파일을 input에 할당
    handleFileSelect(); // 파일 처리 함수 호출
});

// 'PDF로 변환하기' 버튼 클릭 시
uploadForm.addEventListener('submit', convertToPDF);


// --- [ 2. 핵심 함수 정의 ] ---

// (1) 파일 선택 처리 함수
function handleFileSelect() {
    const files = fileInput.files;
    if (!files) return;

    // fileList UI 초기화
    fileList.innerHTML = ''; // ✅ 썸네일이 있었다면 일단 지웁니다.
    uploadedImages = []; // 배열 초기화

    Array.from(files).forEach(file => {
        // 유효성 검사 (이미지 파일인지)
        if (!file.type.startsWith('image/')) {
            alert(`Skipping non-image file: ${file.name}`);
            return;
        }
        
        uploadedImages.push(file); // 유효한 파일만 배열에 추가

        // ✅ [수정] KO 버전과 동일하게, 썸네일 및 텍스트 목록 생성 로직을
        //    "전부" 제거합니다.
        //    fileList.appendChild(...) 코드를 사용하지 않습니다.
    });

    updateConvertButton(); // 버튼 상태 업데이트
}

// (2) 변환 버튼 활성화/비활성화
function updateConvertButton() {
    if (uploadedImages.length > 0) {
        convertButton.disabled = false;
        convertButton.innerHTML = `<i class="fas fa-file-pdf"></i> Convert ${uploadedImages.length} Image(s) to PDF`;
    } else {
        convertButton.disabled = true;
        convertButton.innerHTML = `<i class="fas fa-file-pdf"></i> Convert to PDF`;
    }
}

// (3) PDF 변환 실행 함수 (이하 코드는 이전과 동일)
async function convertToPDF(e) {
    e.preventDefault(); 

    if (uploadedImages.length === 0) {
        alert('Please upload at least one image.');
        return;
    }

    loadingIndicator.style.display = 'block'; 
    convertButton.disabled = true;

    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const a4Width = 210;
        const a4Height = 297;
        const margin = 10; 

        for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];

            if (i > 0) {
                doc.addPage(); 
            }

            const imgData = await readFileAsDataURL(file);
            const img = await loadImage(imgData);

            const imgRatio = img.width / img.height;
            const availableWidth = a4Width - margin * 2;
            const availableHeight = a4Height - margin * 2;

            let pdfImgWidth = img.width;
            let pdfImgHeight = img.height;

            if (pdfImgWidth > availableWidth || pdfImgHeight > availableHeight) {
                if (imgRatio > (availableWidth / availableHeight)) {
                    pdfImgWidth = availableWidth;
                    pdfImgHeight = availableWidth / imgRatio;
                } else {
                    pdfImgHeight = availableHeight;
                    pdfImgWidth = availableHeight * imgRatio;
                }
            }

            const x = (a4Width - pdfImgWidth) / 2;
            const y = (a4Height - pdfImgHeight) / 2;

            doc.addImage(imgData, file.type.split('/')[1].toUpperCase(), x, y, pdfImgWidth, pdfImgHeight);
        }

        doc.save('converted_images.pdf'); 

    } catch (error) {
        console.error('PDF Conversion Error:', error);
        alert('Failed to convert PDF. Please try again. Error: ' + error.message);
    } finally {
        loadingIndicator.style.display = 'none'; 
        fileInput.value = null; 
        fileList.innerHTML = '';
        uploadedImages = [];
        updateConvertButton(); 
    }
}


// --- [ 3. 헬퍼(Helper) 함수 ] ---

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
