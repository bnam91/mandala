export default class FullGridView {
    constructor(containerId, model) {
        this.container = document.getElementById(containerId);
        this.model = model;
        
        // 2차 목표 매핑 테이블 - 좌표와 해당 2차 목표 인덱스 연결
        this.subGoalMappings = {
            // A
            '1,1': 0, '3,3': 0,
            // B
            '4,1': 1, '4,3': 1,
            // C
            '7,1': 2, '5,3': 2,
            // D
            '1,4': 3, '3,4': 3,
            // E
            '7,4': 4, '5,4': 4,
            // F
            '1,7': 5, '3,5': 5,
            // G - 수정: 메인 목표 주변에 배치
            '4,7': 6, '4,5': 6,
            // H
            '7,7': 7, '5,5': 7,
        };
        
        // 각 좌표가 어떤 세부 목표 매핑에 속하는지
        this.detailGoalMappings = this.createDetailGoalMappings();
    }
    
    createDetailGoalMappings() {
        const mappings = {};
        
        // 각 서브목표(마일스톤)에 해당하는 세부 목표 좌표 계산
        Object.entries(this.subGoalMappings).forEach(([coordStr, subGoalIndex]) => {
            const [col, row] = coordStr.split(',').map(Number);
            
            // 마일스톤 위치 로깅
            console.log(`마일스톤 ${String.fromCharCode(65 + subGoalIndex)} (${subGoalIndex}) 위치: [${col},${row}]`);
            
            // 주변 8개 셀의 좌표 계산 (해당 마일스톤 주위의 3x3 그리드 내)
            const baseCol = Math.floor(col / 3) * 3;
            const baseRow = Math.floor(row / 3) * 3;
            
            console.log(`마일스톤 ${String.fromCharCode(65 + subGoalIndex)} 블록 시작점: [${baseCol},${baseRow}]`);
            
            let detailIndex = 0;
            
            // 3x3 블록 내 셀들을 순회
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const detailCol = baseCol + c;
                    const detailRow = baseRow + r;
                    const detailCoord = `${detailCol},${detailRow}`;
                    
                    // 마일스톤 셀 자체는 건너뛰기
                    if (detailCol === col && detailRow === row) {
                        continue;
                    }
                    
                    // 매핑 추가 및 로깅
                    mappings[detailCoord] = {
                        subGoalIndex: subGoalIndex,
                        detailIndex: detailIndex
                    };
                    
                    console.log(`세부 과제 매핑: [${detailCoord}] -> 서브목표 ${subGoalIndex}, 상세 ${detailIndex}`);
                    
                    detailIndex++;
                }
            }
        });
        
        return mappings;
    }

    render() {
        this.container.innerHTML = '';
        
        // 9x9 그리드 생성
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell-full';
                
                // 그리드 구분선 강조
                if (row % 3 === 0 || row % 3 === 2) {
                    cell.classList.add('grid-highlight-h');
                }
                if (col % 3 === 0 || col % 3 === 2) {
                    cell.classList.add('grid-highlight-v');
                }
                
                // 마일스톤 셀인지 확인하고 스타일 적용
                const coordStr = `${col},${row}`;
                const isMilestone = this.isMilestoneCell(row, col, coordStr);
                
                if (isMilestone) {
                    cell.classList.add('milestone');
                    
                    // 마일스톤 인덱스 계산 및 색상 클래스 추가
                    const milestoneIndex = this.getMilestoneIndex(row, col, coordStr);
                    if (milestoneIndex > 0) {
                        cell.classList.add(`milestone-color-${milestoneIndex}`);
                    }
                }
                
                // 현재 위치에 따라 셀 내용 결정
                this.setCellContent(cell, row, col);
                
                this.container.appendChild(cell);
            }
        }
    }
    
    setCellContent(cell, row, col) {
        const coordStr = `${col},${row}`;
        
        // 현재 셀의 모든 클래스를 저장
        const currentClasses = Array.from(cell.classList)
            .filter(cls => cls.includes('grid-highlight'))
            .join(' ');
        
        // 일단 기본 클래스만 유지 (마일스톤 클래스 제거)
        cell.className = 'grid-cell-full ' + currentClasses;
        
        // 1차 목표 (중앙)
        if (row === 4 && col === 4) {
            // 메인 목표는 마일스톤 클래스를 일체 적용하지 않음
            cell.className = 'grid-cell-full ' + currentClasses;
            
            // 메인 목표 클래스만 추가
            cell.classList.add('main-goal');
            
            // 마일스톤 관련 클래스가 있으면 모두 제거
            cell.classList.remove('milestone');
            for (let i = 1; i <= 9; i++) {
                cell.classList.remove(`milestone-color-${i}`);
            }
            
            cell.innerHTML = `<div class="cell-content">${this.model.getMainGoal() || "🎯GOAL"}</div>`;
            cell.addEventListener('click', (e) => this.handleCellClick(e, 'main', 0, 0));
            return;
        }
        
        // 마일스톤 셀인지 확인하고 클래스 추가
        if (this.isMilestoneCell(row, col, coordStr)) {
            cell.classList.add('milestone');
            const milestoneIndex = this.getMilestoneIndex(row, col, coordStr);
            if (milestoneIndex > 0) {
                cell.classList.add(`milestone-color-${milestoneIndex}`);
            }
        }
        
        // 2차 목표
        if (this.subGoalMappings[coordStr] !== undefined) {
            cell.classList.add('sub-goal');
            const subGoalIndex = this.subGoalMappings[coordStr];
            const milestoneLabel = String.fromCharCode(65 + subGoalIndex); // A-H 매핑
            const milestoneContent = this.model.getSubGoal(subGoalIndex);
            const defaultText = `Milestone ${milestoneLabel}`;
            
            // 마일스톤 내용이 없거나 기본값인 경우 투명도 클래스 추가
            if (!milestoneContent || milestoneContent.includes('Milestone')) {
                cell.classList.add('empty-milestone');
            }
            
            cell.innerHTML = `<div class="cell-content">${milestoneContent || defaultText}</div>`;
            cell.addEventListener('click', (e) => this.handleCellClick(e, 'sub', subGoalIndex, 0));
            return;
        }
        
        // 세부 목표
        if (this.detailGoalMappings[coordStr] !== undefined) {
            cell.classList.add('detail-goal');
            const { subGoalIndex, detailIndex } = this.detailGoalMappings[coordStr];
            
            // 세부 과제 내용 가져오기
            const detailContent = this.model.getDetail(subGoalIndex, detailIndex);
            
            // 완료 상태 확인
            const isCompleted = this.model.getTaskCompletion(subGoalIndex, detailIndex);
            
            // 내용이 있으면 일반 텍스트, 없으면 플레이스홀더 스타일 적용 (TASK로 변경)
            if (detailContent) {
                cell.innerHTML = `<div class="cell-content">${detailContent}</div>`;
                // 태스크가 입력된 경우 empty-task 클래스 제거
                cell.classList.remove('empty-task');
                
                // 완료된 태스크인 경우 completed-task 클래스 추가 및 오퍼시티 설정
                if (isCompleted) {
                    cell.classList.add('completed-task');
                    cell.style.opacity = '0.1'; // 10% 불투명 (오퍼시티 10% 설정)
                } else {
                    cell.classList.remove('completed-task');
                    cell.style.opacity = ''; // 기본값으로 복원
                }
            } else {
                cell.innerHTML = `<div class="cell-content placeholder">TASK</div>`;
                // 태스크가 입력되지 않은 경우 empty-task 클래스 추가
                cell.classList.add('empty-task');
            }
            
            cell.addEventListener('click', (e) => {
                console.log(`세부 과제 클릭됨: [${col},${row}]`);
                this.handleCellClick(e, 'detail', subGoalIndex, detailIndex);
            });
            return;
        }
        
        // 빈 셀
        cell.classList.add('empty-cell');
        cell.innerHTML = `<div class="cell-content"></div>`;
    }
    
    handleCellClick(e, type, primaryIndex, secondaryIndex) {
        // 모든 클릭에서 이벤트 전파 중지
        e.stopPropagation();
        
        // 디버깅 정보 출력
        console.log(`클릭 이벤트 - 타입: ${type}, 인덱스: ${primaryIndex}, ${secondaryIndex}`);
        
        const cell = e.currentTarget;
        const content = cell.querySelector('.cell-content');
        let currentText = content ? content.textContent.trim() : '';
        
        if (type === 'main') {
            currentText = this.model.getMainGoal();
            this.makeEditable(content, currentText, (newText) => {
                this.model.updateMainGoal(newText);
                this.render();
            });
        } else if (type === 'sub') {
            // 마일스톤 클릭 시 사이드바 모달로 처리
            currentText = this.model.getSubGoal(primaryIndex);
            
            // 마일스톤(서브 목표) 편집을 위한 모달 사이드바 표시
            window.modalView.showMilestoneSidebar(currentText, primaryIndex);
        } else if (type === 'detail') {
            // 태스크 클릭 시 모달로 처리
            currentText = this.model.getDetail(primaryIndex, secondaryIndex) || '태스크 입력';
            // 모달 창 열기
            window.modalView.show(currentText, primaryIndex, secondaryIndex);
        }
    }
    
    makeEditable(element, currentText, callback) {
        element.innerHTML = `<textarea class="editable-area">${currentText || ''}</textarea>`;
        const textarea = element.querySelector('.editable-area');
        
        // 텍스트 영역에 스타일 적용
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.resize = 'none';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.background = 'transparent';
        textarea.style.textAlign = 'center';
        textarea.style.fontSize = 'inherit';
        
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        const handleBlur = () => {
            callback(textarea.value.trim());
            textarea.removeEventListener('blur', handleBlur);
            textarea.removeEventListener('keydown', handleKeydown);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                textarea.blur();
            }
        };
        
        textarea.addEventListener('blur', handleBlur);
        textarea.addEventListener('keydown', handleKeydown);
    }

    // 마일스톤 셀인지 확인하는 함수
    isMilestoneCell(row, col, coordStr) {
        // 메인 목표 셀(중앙)은 마일스톤에서 제외
        if (row === 4 && col === 4) {
            return false;
        }
        
        // 기본 3x3 그리드의 중앙 셀들
        if (row % 3 === 1 && col % 3 === 1) {
            return true;
        }
        
        // subGoalMappings에 정의된 2차 목표 셀들도 마일스톤으로 처리
        if (this.subGoalMappings[coordStr] !== undefined) {
            return true;
        }
        
        return false;
    }

    // 마일스톤 인덱스 반환 함수
    getMilestoneIndex(row, col, coordStr) {
        // subGoalMappings에 정의된 2차 목표일 경우
        if (this.subGoalMappings[coordStr] !== undefined) {
            return this.subGoalMappings[coordStr] + 1; // 1부터 시작하는 인덱스로 변환
        }
        
        // 기본 3x3 그리드의 중앙 셀들
        if (row % 3 === 1 && col % 3 === 1) {
            const blockRow = Math.floor(row / 3);
            const blockCol = Math.floor(col / 3);
            return blockRow * 3 + blockCol + 1;
        }
        
        return 0; // 마일스톤이 아닌 경우
    }
}