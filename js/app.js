import MandalArtModel from './models/MandalArtModel.js';
import GridView from './views/GridView.js';
import ModalView from './views/ModalView.js';
import FullGridView from './views/FullGridView.js';
import TreeView from './views/TreeView.js';
import StorageUtil from './utils/StorageUtil.js';

class App {
    constructor() {
        this.model = new MandalArtModel('user123');
        
        // 모달 및 그리드 뷰 초기화 (전역 변수로 설정)
        window.modalView = new ModalView('subGridModal', this.model);
        window.fullGridView = new FullGridView('fullGrid', this.model);
        window.subGridView = new GridView('subGrid', this.model, window.modalView);
        window.treeView = new TreeView(this.model, window.modalView);
        
        // 초기화 및 내보내기 버튼 참조 제거
        this.importFile = document.getElementById('importFile');
        this.saveBtn = document.getElementById('saveBtn');
        this.saveCurrentBtn = document.getElementById('saveCurrentBtn');
        
        // 컬렉션 선택 UI 요소
        this.collectionSelect = document.getElementById('collectionSelect');
        
        // 뷰 토글 버튼
        this.viewToggleBtn = document.getElementById('viewToggleBtn');
        
        // 뷰 컨테이너
        this.gridViewContainer = document.getElementById('gridViewContainer');
        this.treeViewContainer = document.getElementById('treeViewContainer');
        
        // 현재 뷰 상태 (기본: 그리드 뷰)
        this.isTreeView = false;
        
        this.init();
    }
    
    async init() {
        try {
            // 모델을 빈 상태로 초기화 (기본 컬렉션 이름을 null로 설정하여 자동 저장을 비활성화)
            this.model.resetData();
            this.model.currentCollection = null;
            
            // 9x9 전체 그리드 렌더링
            window.fullGridView.render();
            
            // 현재 컬렉션 이름 표시 초기화
            document.getElementById('currentCollectionName').textContent = '선택되지 않음';
            
            // 초기에는 컬렉션 목록을 로드하지 않음
            
            // 이벤트 리스너 등록
            this.importFile.addEventListener('change', this.handleImportFile.bind(this));
            this.saveBtn.addEventListener('click', this.handleSave.bind(this));
            this.saveCurrentBtn.addEventListener('click', this.handleSaveCurrent.bind(this));
            
            // 컬렉션 선택 이벤트 리스너
            this.collectionSelect.addEventListener('change', this.handleLoadCollection.bind(this));
            
            // 승인번호 입력란에 이벤트 리스너 추가
            const authCodeInput = document.getElementById('authCodeInput');
            authCodeInput.addEventListener('input', this.handleAuthCodeInput.bind(this));
            
            // 뷰 토글 이벤트 리스너 추가
            this.viewToggleBtn.addEventListener('click', this.toggleView.bind(this));
        } catch (error) {
            console.error('앱 초기화 오류:', error);
        }
    }
    
    // 뷰 토글 함수
    toggleView() {
        this.isTreeView = !this.isTreeView;
        
        if (this.isTreeView) {
            // 트리 뷰로 전환
            this.viewToggleBtn.textContent = 'TreeView';
            this.viewToggleBtn.classList.add('tree-active');
            this.viewToggleBtn.classList.remove('grid-active');
            
            this.gridViewContainer.style.display = 'none';
            this.treeViewContainer.style.display = 'block';
            
            // 트리 뷰 렌더링
            window.treeView.render();
        } else {
            // 그리드 뷰로 전환
            this.viewToggleBtn.textContent = 'GridView';
            this.viewToggleBtn.classList.add('grid-active');
            this.viewToggleBtn.classList.remove('tree-active');
            
            this.gridViewContainer.style.display = 'block';
            this.treeViewContainer.style.display = 'none';
        }
    }
    
    handleReset() {
        if (confirm('정말 모든 데이터를 초기화하시겠습니까?')) {
            this.model.resetData();
            window.fullGridView.render();
            // 트리 뷰도 함께 초기화
            if (window.treeView) {
                window.treeView.render();
            }
            alert('모든 데이터가 초기화되었습니다.');
        }
    }
    
    handleExport() {
        const data = this.model.exportData();
        const date = new Date().toISOString().slice(0, 10);
        // 파일 다운로드 기능 구현
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mandal-art-${date}.json`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
    
    async handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            // 파일 읽기 구현
            const reader = new FileReader();
            const content = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
            
            const success = this.model.importData(content);
            
            if (success) {
                window.fullGridView.render();
                // 트리 뷰도 함께 업데이트
                if (window.treeView) {
                    window.treeView.render();
                }
                alert('데이터를 성공적으로 가져왔습니다.');
            } else {
                alert('유효하지 않은 데이터 형식입니다.');
            }
        } catch (error) {
            console.error('파일 읽기 오류:', error);
            alert('파일을 읽는 중 오류가 발생했습니다.');
        }
        
        // 파일 입력 초기화 (같은 파일 다시 선택 가능하도록)
        this.importFile.value = '';
    }

    // 신규생성 기능 - 승인번호 검증 추가
    async handleSave() {
        // 승인번호 확인
        const authCode = document.getElementById('authCodeInput').value;
        if (authCode !== '0000' && authCode !== '0001') {
            alert('승인번호가 올바르지 않습니다.');
            return;
        }
        
        // 승인번호에 따라 다른 기본값 설정
        let defaultName = 'mandala_';
        if (authCode === '0000') {
            defaultName = 'mandala_goya_';
        } else if (authCode === '0001') {
            defaultName = 'mandala_lucy_';
        }
        
        // 사용자에게 컬렉션 이름 입력 요청
        let collectionName = prompt('신규 생성할 컬렉션 이름을 입력하세요:', defaultName);
        
        // 취소하거나 빈 값 입력 시 저장하지 않음
        if (!collectionName) {
            alert('생성이 취소되었습니다.');
            return;
        }
        
        console.log(`${collectionName} 컬렉션에 기본 데이터로 신규 생성을 시도합니다...`);
        
        try {
            // 컬렉션 존재 여부 확인
            const exists = await this.model.storage.checkCollectionExists(collectionName);
            if (exists) {
                alert('이미 존재하는 컬렉션입니다. 다른 이름으로 시도해주세요.');
                return;
            }
            
            // 데이터를 기본 상태로 초기화
            this.model.resetData();
            
            // 그리드 뷰 업데이트
            window.fullGridView.render();
            
            // 초기화된 데이터를 지정한 컬렉션에 저장 (중복 검사 활성화)
            const result = await this.model.saveData(collectionName, true);
            console.log('저장 결과:', result);
            
            // 생성 완료 메시지 표시
            const saveToast = document.getElementById('saveToast');
            saveToast.textContent = `${collectionName} 컬렉션이 기본 데이터로 생성되었습니다`;
            saveToast.classList.add('active');
            
            // 3초 후 메시지 숨기기
            setTimeout(() => {
                saveToast.classList.remove('active');
            }, 3000);
            
            // 컬렉션 목록 새로고침
            await this.loadCollectionsList();
            
            // 새 컬렉션을 선택 상태로 만들기
            this.collectionSelect.value = collectionName;
            
            // 현재 컬렉션 이름 표시 업데이트
            document.getElementById('currentCollectionName').textContent = collectionName;
        } catch (error) {
            console.error('생성 중 오류 발생:', error);
            alert('컬렉션 생성 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 저장하기 기능 - 승인번호 검증 추가
    async handleSaveCurrent() {
        // 승인번호 확인
        const authCode = document.getElementById('authCodeInput').value;
        if (authCode !== '0000' && authCode !== '0001') {
            alert('승인번호가 올바르지 않습니다.');
            return;
        }
        
        // 승인번호에 따라 다른 기본값 설정
        let defaultName = 'mandala_';
        if (authCode === '0000') {
            defaultName = 'mandala_goya_';
        } else if (authCode === '0001') {
            defaultName = 'mandala_lucy_';
        }
        
        // 사용자에게 컬렉션 이름 입력 요청
        let collectionName = prompt('현재 데이터를 저장할 컬렉션 이름을 입력하세요:', defaultName);
        
        // 취소하거나 빈 값 입력 시 저장하지 않음
        if (!collectionName) {
            alert('저장이 취소되었습니다.');
            return;
        }
        
        console.log(`${collectionName} 컬렉션에 현재 데이터 저장을 시도합니다...`);
        
        try {
            // 컬렉션 존재 여부 확인
            const exists = await this.model.storage.checkCollectionExists(collectionName);
            if (exists) {
                const overwrite = confirm('이미 존재하는 컬렉션입니다. 덮어쓰시겠습니까?');
                if (!overwrite) {
                    return; // 덮어쓰기 취소
                }
                // 덮어쓰기면 중복 검사 건너뜀
            }
            
            // 현재 데이터를 지정한 컬렉션에 저장
            const result = await this.model.saveData(collectionName, false);
            console.log('저장 결과:', result);
            
            // 저장 완료 메시지 표시
            const saveToast = document.getElementById('saveToast');
            saveToast.textContent = `${collectionName} 컬렉션에 현재 데이터가 저장되었습니다`;
            saveToast.classList.add('active');
            
            // 3초 후 메시지 숨기기
            setTimeout(() => {
                saveToast.classList.remove('active');
            }, 3000);
            
            // 컬렉션 목록 새로고침
            await this.loadCollectionsList();
            
            // 새 컬렉션이면 선택 상태로 만들기
            this.collectionSelect.value = collectionName;
            
            // 현재 컬렉션 이름 표시 업데이트
            document.getElementById('currentCollectionName').textContent = collectionName;
        } catch (error) {
            console.error('저장 중 오류 발생:', error);
            alert('데이터 저장 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 컬렉션 목록 불러오기
    async loadCollectionsList() {
        try {
            const collections = await this.model.storage.getCollections();
            
            // 콤보박스 초기화
            this.collectionSelect.innerHTML = '<option value="">컬렉션 선택</option>';
            
            // 'mandala_'가 포함된 컬렉션만 필터링
            const filteredCollections = collections.filter(collection => 
                collection.includes('mandala_')
            );
            
            // 컬렉션 목록 추가
            filteredCollections.forEach(collection => {
                const option = document.createElement('option');
                option.value = collection;
                option.textContent = collection;
                this.collectionSelect.appendChild(option);
            });
            
            console.log('필터링된 mandala_ 컬렉션 목록:', filteredCollections);
        } catch (error) {
            console.error('컬렉션 목록 로드 오류:', error);
            alert('컬렉션 목록을 가져오는 중 오류가 발생했습니다.');
        }
    }

    // 선택된 컬렉션 불러오기
    async handleLoadCollection() {
        const selectedCollection = this.collectionSelect.value;
        const authCode = document.getElementById('authCodeInput').value;
        
        if (!selectedCollection) {
            alert('불러올 컬렉션을 선택해주세요.');
            return;
        }
        
        // 승인번호 확인 - 0000과 0001 모두 허용
        if (authCode !== '0000' && authCode !== '0001') {
            alert('승인번호가 올바르지 않습니다.');
            return;
        }
        
        try {
            // 먼저 컬렉션 이름을 확실하게 설정
            console.log(`컬렉션 로드 시작: 현재 선택된 컬렉션은 ${selectedCollection}입니다`);
            this.model.currentCollection = selectedCollection;
            
            // 그 다음 데이터 로드
            await this.model.initialize(selectedCollection);
            window.fullGridView.render();
            
            // 트리 뷰도 함께 업데이트
            if (window.treeView) {
                window.treeView.render();
            }
            
            // 현재 컬렉션 이름 표시 업데이트
            document.getElementById('currentCollectionName').textContent = selectedCollection;
            
            // 저장 완료 메시지 표시
            const saveToast = document.getElementById('saveToast');
            saveToast.textContent = `${selectedCollection} 컬렉션을 불러왔습니다`;
            saveToast.classList.add('active');
            
            // 3초 후 메시지 숨기기
            setTimeout(() => {
                saveToast.classList.remove('active');
            }, 3000);
            
            // 컬렉션이 로드된 후 자동 저장 활성화 상태 확인
            console.log(`${selectedCollection} 컬렉션 로드 완료, 자동 저장 설정: ${this.model.autoSaveEnabled}, 현재 컬렉션: ${this.model.currentCollection}`);
        } catch (error) {
            console.error('컬렉션 데이터 로드 오류:', error);
            alert('컬렉션 데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    // 승인번호 입력 처리
    handleAuthCodeInput(event) {
        const authCode = event.target.value;
        
        // 승인번호가 0000이나 0001이면 컬렉션 목록 표시, 아니면 목록 초기화
        if (authCode === '0000' || authCode === '0001') {
            this.loadCollectionsList(authCode);
        } else {
            // 콤보박스 초기화 (목록 제거)
            this.collectionSelect.innerHTML = '<option value="">컬렉션 선택</option>';
        }
    }

    // 컬렉션 목록 불러오기 - authCode 매개변수 추가
    async loadCollectionsList(authCode) {
        try {
            const collections = await this.model.storage.getCollections(authCode);
            
            // 콤보박스 초기화
            this.collectionSelect.innerHTML = '<option value="">컬렉션 선택</option>';
            
            // 승인번호에 해당하는 접두사로 클라이언트에서 다시 한번 필터링
            let filterPrefix = 'mandala_';
            if (authCode === '0000') {
                filterPrefix = 'mandala_goya_';
            } else if (authCode === '0001') {
                filterPrefix = 'mandala_lucy_';
            }
            
            // 접두사로 추가 필터링
            const filteredCollections = collections.filter(collection => 
                collection.startsWith(filterPrefix)
            );
            
            console.log('승인번호에 해당하는 필터링된 컬렉션 목록:', filteredCollections);
            
            // 컬렉션 목록 추가
            filteredCollections.forEach(collection => {
                const option = document.createElement('option');
                option.value = collection;
                option.textContent = collection;
                this.collectionSelect.appendChild(option);
            });
        } catch (error) {
            console.error('컬렉션 목록 로드 오류:', error);
            alert('컬렉션 목록을 가져오는 중 오류가 발생했습니다.');
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 