export default class GridView {
    constructor(containerId, model, modalView) {
        this.container = document.getElementById(containerId);
        this.model = model;
        this.modalView = modalView;
        this.isMainGrid = containerId === 'mainGrid';
    }

    render() {
        this.container.innerHTML = '';
        
        if (this.isMainGrid) {
            this.renderMainGrid();
        } else {
            this.renderSubGrid();
        }
    }

    renderMainGrid() {
        // 중앙(4번째) 셀에 메인 목표 배치 (3x3 그리드에서 인덱스는 0부터 시작하므로 4번째는 인덱스 4)
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            if (i === 4) { // 중앙 셀
                cell.classList.add('main-goal');
                cell.innerHTML = `<div class="cell-content">${this.model.getMainGoal() || "메인 목표를 입력하세요"}</div>`;
                cell.addEventListener('click', this.handleMainGoalClick.bind(this));
            } else {
                const subGoalIndex = i < 4 ? i : i - 1;
                cell.classList.add('sub-goal');
                cell.innerHTML = `<div class="cell-content">${this.model.getSubGoal(subGoalIndex) || "목표를 입력하세요"}</div>`;
                cell.dataset.index = subGoalIndex;
                cell.addEventListener('click', this.handleSubGoalClick.bind(this));
            }
            
            this.container.appendChild(cell);
        }
    }

    renderSubGrid() {
        const subGoalIndex = this.model.currentSubGoalIndex;
        if (subGoalIndex === -1) return;
        
        // 중앙(4번째) 셀에 2단계 목표 배치
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            if (i === 4) { // 중앙 셀
                cell.classList.add('main-goal');
                cell.innerHTML = `<div class="cell-content">${this.model.getSubGoal(subGoalIndex) || "목표를 입력하세요"}</div>`;
                cell.addEventListener('click', (e) => this.handleDetailMainClick(e, subGoalIndex));
            } else {
                const detailIndex = i < 4 ? i : i - 1;
                cell.classList.add('sub-goal');
                cell.innerHTML = `<div class="cell-content">${this.model.getDetail(subGoalIndex, detailIndex) || "세부 과제를 입력하세요"}</div>`;
                cell.dataset.index = detailIndex;
                cell.addEventListener('click', (e) => this.handleDetailClick(e, subGoalIndex, detailIndex));
            }
            
            this.container.appendChild(cell);
        }
    }

    handleMainGoalClick(e) {
        const cell = e.currentTarget;
        const content = cell.querySelector('.cell-content');
        const currentText = this.model.getMainGoal();
        
        this.makeEditable(content, currentText, (newText) => {
            this.model.updateMainGoal(newText);
            this.render();
        });
    }

    handleSubGoalClick(e) {
        const cell = e.currentTarget;
        const index = parseInt(cell.dataset.index);
        
        // 모달로 세부 목표 표시
        this.model.currentSubGoalIndex = index;
        this.modalView.show(this.model.getSubGoal(index) || "목표");
    }

    handleDetailMainClick(e, subGoalIndex) {
        const cell = e.currentTarget;
        const content = cell.querySelector('.cell-content');
        const currentText = this.model.getSubGoal(subGoalIndex);
        
        this.makeEditable(content, currentText, (newText) => {
            this.model.updateSubGoal(subGoalIndex, newText);
            this.modalView.updateTitle(newText || "목표");
            this.render();
        });
    }

    handleDetailClick(e, subGoalIndex, detailIndex) {
        const cell = e.currentTarget;
        const content = cell.querySelector('.cell-content');
        const currentText = this.model.getDetail(subGoalIndex, detailIndex);
        
        this.makeEditable(content, currentText, (newText) => {
            this.model.updateDetail(subGoalIndex, detailIndex, newText);
            this.render();
        });
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

    renderCell(cell, row, col) {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        cellElement.textContent = cell.content || '';
        
        // 마일스톤 셀 식별 및 스타일 적용
        if (this.isMilestoneCell(row, col)) {
            cellElement.classList.add('milestone');
            
            // 각 마일스톤에 고유한 색상 클래스 추가
            const milestoneIndex = this.getMilestoneIndex(row, col);
            if (milestoneIndex > 0) {
                cellElement.classList.add(`milestone-color-${milestoneIndex}`);
            }
        }
        
        cellElement.dataset.row = row;
        cellElement.dataset.col = col;
        
        return cellElement;
    }

    // 마일스톤 셀인지 확인하는 함수
    isMilestoneCell(row, col) {
        // 3x3 그리드에서 중앙 셀들(1,1), (1,4), (1,7), (4,1), (4,4), (4,7), (7,1), (7,4), (7,7)은 마일스톤
        return (row % 3 === 1 && col % 3 === 1);
    }

    // 마일스톤 인덱스 반환 (1~9)
    getMilestoneIndex(row, col) {
        if (!this.isMilestoneCell(row, col)) return 0;
        
        const blockRow = Math.floor(row / 3);
        const blockCol = Math.floor(col / 3);
        return blockRow * 3 + blockCol + 1;
    }
} 