// [파일 이름: en/app.js]
// (한국어 버전 app.js의 UI 텍스트만 영어로 번역한 버전입니다)

document.addEventListener('DOMContentLoaded', () => {
    // [✅ 확인] 이 변수들이 en/index.html에도 모두 있는지 확인해주세요.
    const dropZonePrompt = document.querySelector('.drop-zone-prompt');
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const fileList = document.getElementById('fileList');
    const convertButton = document.getElementById('convertButton');
    const loadingIndicator = document.getElementById('loadingIndicator');

    let selectedFiles = [];
    let processedFiles = [];

    // 'p' 태그 클릭 시 파일 입력창 열기 (ko 버전엔 없었지만, 에러 방지용으로 추가)
    if (dropZonePrompt) {
        dropZonePrompt.addEventListener('click', () => fileInput.click());
    }

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

    // 사용자가 선택한 원본 파일을 처리하는 함수
    async function handleUserFiles(files) {
        selectedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        processedFiles = [];

        fileList.innerHTML = ''; // 파일 목록 UI 초기화
        
        if (selectedFiles.length === 0) {
            convertButton.disabled = true;
            return;
        }

        convertButton.disabled = true;
        // ✅ [영어 번역]
        fileList.innerHTML = `<div class="processing-message"><i class="fas fa-spinner fa-spin"></i> Compressing images...</div>`;

        for (const file of selectedFiles) {
            const listItem = document.createElement('div');
            listItem.classList.add('file-item');
            listItem.innerHTML = `
                <span>${file.name}</span>
                <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <span class="status-icon"><i class="fas fa-circle-notch fa-spin"></i> Compressing...</span>
            `;
            fileList.appendChild(listItem);

            try {
                // 압축 설정 (ko 버전과 동일: 1920, 0.9)
                const compressedFile = await compressImage(file, 1920, 0.9);
                
                processedFiles.push(compressedFile);

                // ✅ [영어 번역]
                listItem.querySelector('.file-size').textContent = `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB (Compressed)`;
                listItem.querySelector('.status-icon').innerHTML = '<i class="fas fa-check-circle success"></i> Done';
                listItem.querySelector('.status-icon').classList.add('completed');
            } catch (error) {
                console.error(`Error compressing ${file.name}:`, error);
                // ✅ [영어 번역]
                listItem.querySelector('.status-icon').innerHTML = '<i class="fas fa-times-circle error"></i> Failed';
                listItem.querySelector('.status-icon').classList.add('failed');
            }
        }
        
        fileList.querySelector('.processing-message')?.remove();
        convertButton.disabled = processedFiles.length === 0;
        if (processedFiles.length > 0) {
            const totalSize = processedFiles.reduce((sum, f) => sum + f.size, 0);
            // ✅ [영어 번역]
            fileList.insertAdjacentHTML('afterbegin', `<div class="total-size-info">Total compressed size: <strong>${(totalSize / 1024 / 1024).toFixed(2)} MB</strong></div>`);
        }
    }

    // 이미지 압축 및 리사이징 함수 (ko 버전과 100% 동일)
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
            // ✅ [영어 번역]
            alert('Please select images and wait for compression to complete.');
            return;
        }

        loadingIndicator.style.display = 'block';
        convertButton.disabled = true;
        // ✅ [영어 번역]
        convertButton.innerHTML = '<i class="fas fa-cog fa-spin"></i> Converting...';

        const formData = new FormData();
        processedFiles.forEach(file => {
            formData.append('images', file);
        });

        try {
            // [중요] /en/ 폴더에 있지만, API 경로는 루트(/api/convert)를 바라봅니다.
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                // ✅ [영어 번역]
                throw new Error(`PDF conversion failed: ${response.status} - ${errorText}`);
            }

            const pdfBlob = await response.blob();
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            // ✅ [영어 번역]
            a.download = `converted_images_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            selectedFiles = [];
            processedFiles = [];
            fileList.innerHTML = '';
            convertButton.disabled = true;

        } catch (error) {
            console.error('Conversion Error:', error);
            // ✅ [영어 번역]
            alert(`An error occurred: ${error.message}`);
        } finally {
            loadingIndicator.style.display = 'none';
            convertButton.disabled = false;
            // ✅ [영어 번역]
            convertButton.innerHTML = '<i class="fas fa-file-pdf"></i> Convert to PDF';
        }
    });
});
