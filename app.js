// app.js

document.addEventListener('DOMContentLoaded', () => {
    
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const fileList = document.getElementById('fileList');
    const convertButton = document.getElementById('convertButton');
    const loadingIndicator = document.getElementById('loadingIndicator');

    let selectedFiles = []; // 업로드할 파일 목록

    // 파일 인풋이 변경될 때
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });

    // 드래그 앤 드롭 이벤트
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('is-dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('is-dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('is-dragover');
        handleFiles(e.dataTransfer.files);
    });

    // 파일 처리 함수
    function handleFiles(files) {
        selectedFiles = Array.from(files); // 파일 목록을 배열로 변환
        updateFileList();
        convertButton.disabled = selectedFiles.length === 0;
    }

    // 파일 목록 UI 업데이트
    function updateFileList() {
        fileList.innerHTML = '';
        if (selectedFiles.length > 0) {
            fileList.innerHTML = `<strong>${selectedFiles.length}</strong>개의 파일이 선택되었습니다:`;
            selectedFiles.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.textContent = file.name;
                fileList.appendChild(fileItem);
            });
        }
    }

    // "PDF로 변환하기" 버튼 클릭 (폼 제출)
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // 폼 기본 제출 방지

        if (selectedFiles.length === 0) {
            alert('먼저 이미지를 선택해주세요.');
            return;
        }

        // 1. 로딩 시작
        loadingIndicator.style.display = 'block';
        convertButton.disabled = true;
        convertButton.innerHTML = '<i class="fas fa-cog fa-spin"></i> 변환 중...';

        // 2. FormData 객체 생성
        const formData = new FormData();
        selectedFiles.forEach(file => {
            // 'api/convert.js'에서 받을 key 이름('images')으로 파일 추가
            formData.append('images', file);
        });

        try {
            // 3. Vercel 서버 API로 파일 전송
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData,
                // 'Content-Type'은 FormData가 알아서 설정하므로 명시하지 않음
            });

            if (!response.ok) {
                throw new Error('PDF 변환에 실패했습니다.');
            }

            // 4. 응답을 Blob (파일 객체)으로 받기
            const pdfBlob = await response.blob();

            // 5. Blob을 사용해 임시 다운로드 링크 생성
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted_${Date.now()}.pdf`; // 파일 이름 설정
            document.body.appendChild(a);
            a.click(); // 가상 클릭으로 다운로드 실행
            
            // 6. 리소스 정리
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Conversion Error:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            // 7. 로딩 종료
            loadingIndicator.style.display = 'none';
            convertButton.disabled = false;
            convertButton.innerHTML = '<i class="fas fa-file-pdf"></i> PDF로 변환하기';
        }
    });
});
