export default class StorageUtil {
    constructor(userId = 'default_user') {
        this.userId = userId;
        this.apiUrl = '/api/mandalart'; // 현재 하드코딩된 localhost를 상대 경로로 변경
        
        // 현재 URL 로깅하여 확인
        console.log('API URL:', this.apiUrl);
    }
    
    // MongoDB에서 데이터 로드
    async loadData(collectionName = null) {
        try {
            let url = `${this.apiUrl}/${this.userId}`;
            if (collectionName) {
                url += `?collection=${collectionName}`;
            } else {
                // 기본 컬렉션 이름 지정
                url += `?collection=mandala_default`;
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                // 데이터가 없는 경우 빈 데이터 반환
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`서버 에러: ${response.status}`);
            }
            
            const data = await response.json();
            return data.mandalartData;
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            // 에러 발생 시 로컬 스토리지 데이터 반환 (폴백)
            return JSON.parse(localStorage.getItem('mandalArtData') || 'null');
        }
    }
    
    // MongoDB에 데이터 저장
    async saveData(data, collectionName = null, checkExisting = false, bypassAuth = false) {
        try {
            let url = `${this.apiUrl}/${this.userId}`;
            
            // URL 파라미터 구성
            const params = new URLSearchParams();
            
            // 컬렉션 이름 강제 검사 및 로깅
            if (collectionName) {
                console.log(`저장 요청: 컬렉션 이름 "${collectionName}" 사용 (명시적 지정)`);
                params.append('collection', collectionName);
            } else {
                console.error('오류: 컬렉션 이름이 null/undefined 입니다.');
                // 기본값 사용 중단 - 자동저장 시 문제가 발생하는 원인
                // params.append('collection', 'mandala_default');
                return { success: false, message: '컬렉션 이름이 지정되지 않았습니다.' };
            }
            
            // 기존 컬렉션 확인 옵션 추가
            if (checkExisting) {
                params.append('checkExisting', 'true');
            }
            
            // 자동 저장 시 승인 우회 파라미터 추가
            if (bypassAuth) {
                params.append('bypassAuth', 'true');
            }
            
            url += `?${params.toString()}`;
            console.log('저장 요청 URL:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    mandalartData: data,
                    userId: this.userId
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `서버 에러: ${response.status}`);
            }
            
            // 로컬 스토리지에도 백업
            localStorage.setItem('mandalArtData', JSON.stringify(data));
            
            // 서버 응답 반환
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('데이터 저장 오류:', error);
            // 서버 저장 실패 시 로컬에만 저장
            localStorage.setItem('mandalArtData', JSON.stringify(data));
            throw error; // 에러를 상위로 전파
        }
    }

    // 컬렉션 목록 가져오기
    async getCollections(authCode = null) {
        try {
            // 승인번호에 따라 다른 접두사 설정
            let prefix = '';
            if (authCode === '0000') {
                prefix = 'goya';
            } else if (authCode === '0001') {
                prefix = 'lucy';
            }
            
            // API URL 생성 - 여기가 문제일 수 있습니다
            const collectionsUrl = `${this.apiUrl.replace('/mandalart', '')}/collections${prefix ? `?prefix=${prefix}` : ''}`;
            
            console.log(`컬렉션 요청 URL: ${collectionsUrl} (승인번호: ${authCode}, 접두사: ${prefix})`);
            
            const response = await fetch(collectionsUrl);
            
            if (!response.ok) {
                throw new Error(`서버 에러: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('서버 응답:', data);
            
            return data.collections || [];
        } catch (error) {
            console.error('컬렉션 목록 가져오기 오류:', error);
            alert('컬렉션 목록을 가져오는 중 오류가 발생했습니다: ' + error.message);
            return [];
        }
    }

    // 컬렉션 존재 여부 확인
    async checkCollectionExists(collectionName) {
        try {
            const collections = await this.getCollections();
            return collections.includes(collectionName);
        } catch (error) {
            console.error('컬렉션 확인 오류:', error);
            throw error;
        }
    }
} 