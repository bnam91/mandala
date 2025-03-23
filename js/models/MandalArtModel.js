import StorageUtil from '../utils/StorageUtil.js';

export default class MandalArtModel {
    constructor(userId = 'default_user') {
        this.data = {
            mainGoal: "",
            subGoals: Array(8).fill(""),
            details: Array(8).fill(null).map(() => Array(8).fill(""))
        };
        this.currentSubGoalIndex = -1;
        this.storage = new StorageUtil(userId);
        this.currentCollection = null;
        this.autoSaveEnabled = true;
    }

    async initialize(collectionName = null) {
        try {
            if (collectionName) {
                this.currentCollection = collectionName;
                console.log(`현재 컬렉션을 ${collectionName}으로 설정합니다`);
            }
            const savedData = await this.storage.loadData(this.currentCollection);
            if (savedData) {
                this.data = savedData;
                this.migrateDataIfNeeded();
            }
        } catch (e) {
            console.error('저장된 데이터를 불러오는 중 오류가 발생했습니다:', e);
            this.resetData();
        }
    }

    async saveData(collectionName = null, checkExisting = false) {
        // 컬렉션 이름이 지정되지 않은 경우 현재 설정된 컬렉션 사용
        const targetCollection = collectionName || this.currentCollection;
        console.log(`saveData 호출: 대상 컬렉션은 ${targetCollection}`);
        
        if (!targetCollection) {
            console.warn('저장을 건너뜁니다: 컬렉션 이름이 설정되지 않았습니다.');
            return;
        }
        
        await this.storage.saveData(this.data, targetCollection, checkExisting);
    }

    resetData() {
        this.data = {
            mainGoal: "",
            subGoals: Array(8).fill(""),
            details: Array(8).fill(null).map(() => Array(8).fill(""))
        };
        
        // 컬렉션이 설정된 경우에만 저장 시도
        if (this.currentCollection) {
            this.autoSave(); // saveData 대신 autoSave 사용
        } else {
            console.log('resetData: 현재 컬렉션이 설정되지 않아 저장을 건너뜁니다.');
        }
    }

    async updateMainGoal(text) {
        this.data.mainGoal = text;
        await this.autoSave(); // 자동 저장 호출
    }

    async updateSubGoal(index, text) {
        this.data.subGoals[index] = text;
        await this.autoSave(); // 자동 저장 호출
    }

    async updateDetail(subGoalIndex, detailIndex, content, tasks = null, pd = null, isCompleted = null) {
        if (typeof this.data.subGoals[subGoalIndex] === 'string') {
            const oldContent = this.data.subGoals[subGoalIndex];
            this.data.subGoals[subGoalIndex] = {
                content: oldContent,
                details: []
            };
        } else if (!this.data.subGoals[subGoalIndex]) {
            this.data.subGoals[subGoalIndex] = {
                content: '',
                details: []
            };
        }
        
        if (!this.data.subGoals[subGoalIndex].details) {
            this.data.subGoals[subGoalIndex].details = [];
        }
        
        if (!this.data.subGoals[subGoalIndex].details[detailIndex]) {
            this.data.subGoals[subGoalIndex].details[detailIndex] = { 
                content: content,
                tasks: tasks || [],
                pd: pd || '',
                completed: isCompleted || false
            };
        } else {
            this.data.subGoals[subGoalIndex].details[detailIndex].content = content;
            if (tasks !== null) {
                this.data.subGoals[subGoalIndex].details[detailIndex].tasks = tasks;
            }
            if (pd !== null) {
                this.data.subGoals[subGoalIndex].details[detailIndex].pd = pd;
            }
            if (isCompleted !== null) {
                this.data.subGoals[subGoalIndex].details[detailIndex].completed = isCompleted;
            }
        }
        
        await this.autoSave();
    }

    getMainGoal() {
        return this.data.mainGoal;
    }

    getSubGoal(index) {
        if (!this.data.subGoals[index]) {
            return '';
        }
        
        // 문자열인 경우 그대로 반환
        if (typeof this.data.subGoals[index] === 'string') {
            return this.data.subGoals[index];
        }
        
        // 객체인 경우 content 필드 반환
        if (typeof this.data.subGoals[index] === 'object') {
            return this.data.subGoals[index].content || '';
        }
        
        return '';
    }

    getDetail(subGoalIndex, detailIndex) {
        if (typeof this.data.subGoals[subGoalIndex] === 'object' && 
            this.data.subGoals[subGoalIndex] !== null &&
            this.data.subGoals[subGoalIndex].details) {
            if (!this.data.subGoals[subGoalIndex].details[detailIndex]) {
                return '';
            }
            return this.data.subGoals[subGoalIndex].details[detailIndex].content;
        } else {
            if (!this.data.details || !this.data.details[subGoalIndex] || 
                !this.data.details[subGoalIndex][detailIndex]) {
                return '';
            }
            return this.data.details[subGoalIndex][detailIndex];
        }
    }

    getTasks(subGoalIndex, detailIndex) {
        if (typeof this.data.subGoals[subGoalIndex] === 'string' || 
            !this.data.subGoals[subGoalIndex]) {
            return [];
        }
        
        if (this.data.subGoals[subGoalIndex].details && 
            this.data.subGoals[subGoalIndex].details[detailIndex]) {
            const detail = this.data.subGoals[subGoalIndex].details[detailIndex];
            if (detail.tasks) {
                return detail.tasks;
            }
        }
        
        return [];
    }

    async updateTask(subGoalIndex, detailIndex, taskIndex, content, completed = false) {
        if (!this.data.subGoals[subGoalIndex] || 
            !this.data.subGoals[subGoalIndex].details[detailIndex]) {
            return;
        }
        
        if (!this.data.subGoals[subGoalIndex].details[detailIndex].tasks) {
            this.data.subGoals[subGoalIndex].details[detailIndex].tasks = [];
        }
        
        if (taskIndex >= this.data.subGoals[subGoalIndex].details[detailIndex].tasks.length) {
            // 새 태스크 추가
            this.data.subGoals[subGoalIndex].details[detailIndex].tasks.push({
                content: content,
                completed: completed
            });
        } else {
            // 기존 태스크 업데이트
            this.data.subGoals[subGoalIndex].details[detailIndex].tasks[taskIndex].content = content;
            this.data.subGoals[subGoalIndex].details[detailIndex].tasks[taskIndex].completed = completed;
        }
        
        await this.autoSave();
    }

    async deleteTask(subGoalIndex, detailIndex, taskIndex) {
        if (!this.data.subGoals[subGoalIndex] || 
            !this.data.subGoals[subGoalIndex].details[detailIndex] ||
            !this.data.subGoals[subGoalIndex].details[detailIndex].tasks) {
            return;
        }
        
        this.data.subGoals[subGoalIndex].details[detailIndex].tasks.splice(taskIndex, 1);
        await this.autoSave();
    }

    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonData) {
        try {
            const parsedData = JSON.parse(jsonData);
            if (
                parsedData.mainGoal !== undefined &&
                Array.isArray(parsedData.subGoals) &&
                Array.isArray(parsedData.details)
            ) {
                this.data = parsedData;
                this.saveData();
                return true;
            } else {
                throw new Error('유효하지 않은 데이터 형식입니다.');
            }
        } catch (e) {
            console.error('데이터 가져오기 오류:', e);
            return false;
        }
    }

    migrateDataIfNeeded() {
        if (Array.isArray(this.data.subGoals) && Array.isArray(this.data.details)) {
            console.log("기존 데이터 구조 감지, 마이그레이션 실행...");
            // 데이터 마이그레이션 작업
        }
    }

    getPD(subGoalIndex, detailIndex) {
        if (typeof this.data.subGoals[subGoalIndex] === 'object' && 
            this.data.subGoals[subGoalIndex] !== null &&
            this.data.subGoals[subGoalIndex].details) {
            if (!this.data.subGoals[subGoalIndex].details[detailIndex]) {
                return '';
            }
            return this.data.subGoals[subGoalIndex].details[detailIndex].pd || '';
        }
        return '';
    }

    getTaskCompletion(subGoalIndex, detailIndex) {
        if (typeof this.data.subGoals[subGoalIndex] === 'object' && 
            this.data.subGoals[subGoalIndex] !== null &&
            this.data.subGoals[subGoalIndex].details &&
            this.data.subGoals[subGoalIndex].details[detailIndex]) {
            return this.data.subGoals[subGoalIndex].details[detailIndex].completed || false;
        }
        return false;
    }

    async autoSave() {
        if (this.autoSaveEnabled && this.currentCollection) {
            try {
                console.log(`자동 저장 시작: ${this.currentCollection} 컬렉션`);
                const result = await this.storage.saveData(this.data, this.currentCollection, false, true);
                console.log(`자동 저장 완료: ${this.currentCollection}`, result);
            } catch (error) {
                console.error('자동 저장 오류:', error);
            }
        } else {
            console.log('자동 저장 건너뜀: 현재 컬렉션이 설정되지 않았거나 자동 저장이 비활성화됨');
        }
    }
} 