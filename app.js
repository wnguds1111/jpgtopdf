// app.js
// [수정] finally 블록의 'updateFileList()' 호출을 'fileList.innerHTML = '' 로 수정

document.addEventListener('DOMContentLoaded', () => {
    
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const fileList = document.getElementById('fileList');
    const convertButton = document.getElementById('convertButton');
    const loadingIndicator = document.getElementById('loadingIndicator');

    let selectedFiles = [];
    let processedFiles = [];

    // 파일 인풋이 변경될 때
    fileInput.addEventListener('change', () => {
        handleUserFiles(fileInput.files);
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
        handleUserFiles(e.dataTransfer.files);
    });

    // [수정] 사용자가 선택한 원본 파일을 처리하는 함수
    async function handleUserFiles(files) {
        selectedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        processedFiles = [];

        fileList.innerHTML = ''; // 파일 목록 UI 초기화
        
        if (selectedFiles.length === 0) {
            convertButton.disabled = true;
            return;
        }

        convertButton.disabled = true;
        fileList.innerHTML = `<div class="processing-message"><i class="fas fa-spinner fa-spin"></i> 이미지 압축 중...</div>`;

        for (const file of selectedFiles) {
            const listItem = document.createElement('div');
            listItem.classList.add('file-item');
            listItem.innerHTML = `
                <span>${file.name}</span>
                <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <span class="status-icon"><i class="fas fa-circle-notch fa-spin"></i> 압축 중...</span>
            `;
            fileList.appendChild(listItem);

            try {
                // [핵심] 이미지 압축 함수 호출
                const compressedFile = await compressImage(file, 1024, 0.8);
                
                processedFiles.push(compressedFile);

                listItem.querySelector('.file-size').textContent = `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB (압축됨)`;
                listItem.querySelector('.status-icon').innerHTML = '<i class="fas fa-check-circle success"></i> 완료';
                listItem.querySelector('.status-icon').classList.add('completed');
            } catch (error) {
                console.error(`Error compressing ${file.name}:`, error);
                listItem.querySelector('.status-icon').innerHTML = '<i class="fas fa-times-circle error"></i> 실패';
                listItem.querySelector('.status-icon').classList.add('failed');
            }
        }
        
        fileList.querySelector('.processing-message')?.remove();
        convertButton.disabled = processedFiles.length === 0;
        if (processedFiles.length > 0) {
            const totalSize = processedFiles.reduce((sum, f) => sum + f.size, 0);
            fileList.insertAdjacentHTML('afterbegin', `<div class="total-size-info">총 압축된 용량: <strong>${(totalSize / 1024 / 1024).toFixed(2)} MB</strong></div>`);
        }
    }

    // [새로 추가] 이미지 압축 및 리사이징 함수
    function compressImage(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height); 

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Canvas to Blob failed.'));
                                return;
                            }
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    }

    // "PDF로 변환하기" 버튼 클릭 (폼 제출)
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (processedFiles.length === 0) {
            alert('먼저 이미지를 선택하고 압축이 완료되기를 기다려주세요.');
            return;
        }

        loadingIndicator.style.display = 'block';
        convertButton.disabled = true;
        convertButton.innerHTML = '<i class="fas fa-cog fa-spin"></i> 변환 중...';

        const formData = new FormData();
        processedFiles.forEach(file => {
            formData.append('images', file);
        });

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`PDF 변환에 실패했습니다: ${response.status} - ${errorText}`);
            }

            const pdfBlob = await response.blob();
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted_images_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // [수정] 성공 후 파일 목록 초기화
            selectedFiles = [];
            processedFiles = [];
            
            // --- 여기가 수정되었습니다! ---
            // updateFileList(); // <-- 이 코드가 에러의 원인
            fileList.innerHTML = ''; // <-- 이렇게 UI를 직접 초기화합니다.
            // ---------------------------
            
            convertButton.disabled = true; // 버튼 비활성화

        } catch (error) {
            console.error('Conversion Error:', error);
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            loadingIndicator.style.display = 'none';
            convertButton.disabled = false;
            convertButton.innerHTML = '<i class="fas fa-file-pdf"></i> PDF로 변환하기';
        }
    });
});
