// [파일 이름: en/app.js]

// jsPDF 라이브러리 할당 (index.html에서 로드됨)
const { jsPDF } = window.jspdf;

// --- [ 0. DOM 요소 캐싱 ] ---
// (모든 ID를 정확하게 가져오도록 수정)
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropZonePrompt = document.querySelector('.drop-zone-prompt'); // ✅ [추가] (클래스)
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
    fileList.innerHTML = '';
    uploadedImages = []; // 배열 초기화

    Array.from(files).forEach(file => {
        // 유효성 검사 (이미지 파일인지)
        if (!file.type.startsWith('image/')) {
            alert(`Skipping non-image file: ${file.name}`);
            return;
        }
        
        uploadedImages.push(file); // 유효한 파일만 배열에 추가

        // 파일 목록 UI에 썸네일 표시
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <span>${file.name}</span>
            `;
            fileList.appendChild(fileItem);
        };
        reader.readAsDataURL(file);
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

// (3) PDF 변환 실행 함수
async function convertToPDF(e) {
    e.preventDefault(); // 폼 제출 방지

    if (uploadedImages.length === 0) {
        alert('Please upload at least one image.');
        return;
    }

    loadingIndicator.style.display = 'block'; // 로딩 시작
    convertButton.disabled = true;

    try {
        // A4 (세로) 기준: 210mm x 297mm
        const doc = new jsPDF('p', 'mm', 'a4');
        const a4Width = 210;
        const a4Height = 297;
        const margin = 10; // 10mm 여백

        for (let i = 0; i < uploadedImages.length; i++) {
            const file = uploadedImages[i];

            if (i > 0) {
                doc.addPage(); // 첫 번째 이미지가 아니면 새 페이지 추가
            }

            const imgData = await readFileAsDataURL(file);
            const img = await loadImage(imgData);

            // 이미지 비율 계산
            const imgRatio = img.width / img.height;
            const availableWidth = a4Width - margin * 2;
            const availableHeight = a4Height - margin * 2;

            let pdfImgWidth = img.width;
            let pdfImgHeight = img.height;

            // 이미지가 A4 (여백 포함)보다 큰 경우
            if (pdfImgWidth > availableWidth || pdfImgHeight > availableHeight) {
                if (imgRatio > (availableWidth / availableHeight)) {
                    // 이미지가 A4보다 가로로 더 넓은 경우
                    pdfImgWidth = availableWidth;
                    pdfImgHeight = availableWidth / imgRatio;
                } else {
                    // 이미지가 A4보다 세로로 더 긴 경우
                    pdfImgHeight = availableHeight;
                    pdfImgWidth = availableHeight * imgRatio;
                }
            }

            // 페이지 중앙에 이미지 배치
            const x = (a4Width - pdfImgWidth) / 2;
            const y = (a4Height - pdfImgHeight) / 2;

            doc.addImage(imgData, file.type.split('/')[1].toUpperCase(), x, y, pdfImgWidth, pdfImgHeight);
        }

        doc.save('converted_images.pdf'); // PDF 저장

    } catch (error) {
        console.error('PDF Conversion Error:', error);
        alert('Failed to convert PDF. Please try again. Error: ' + error.message);
    } finally {
        loadingIndicator.style.display = 'none'; // 로딩 끝
        // 파일 목록 초기화
        fileInput.value = null; 
        fileList.innerHTML = '';
        uploadedImages = [];
        updateConvertButton(); // 버튼 초기화
    }
}


// --- [ 3. 헬퍼(Helper) 함수 ] ---

// FileReader를 Promise로 감싸기 (async/await용)
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 이미지 로딩을 Promise로 감싸기 (가로/세로 크기 확인용)
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
