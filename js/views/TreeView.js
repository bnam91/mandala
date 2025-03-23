export default class TreeView {
    constructor(model, modalView) {
        this.model = model;
        this.modalView = modalView;
        
        // 컨테이너 참조
        this.mainGoalNode = document.getElementById('mainGoalNode');
        this.milestonesNodes = document.getElementById('milestonesNodes');
        this.tasksNodes = document.getElementById('tasksNodes');
        this.subTasksNodes = document.getElementById('subTasksNodes');
        
        // 현재 선택된 노드 상태
        this.selectedMilestoneIndex = null;
        this.selectedTaskIndex = null;
    }
    
    render() {
        this.renderMainGoal();
        this.renderMilestones();
        
        // 선택된 마일스톤이 있으면 관련 태스크 렌더링
        if (this.selectedMilestoneIndex !== null) {
            this.renderTasks(this.selectedMilestoneIndex);
        } else {
            this.clearTasks();
        }
        
        // 선택된 태스크가 있으면 하위 태스크 렌더링
        if (this.selectedMilestoneIndex !== null && this.selectedTaskIndex !== null) {
            this.renderSubTasks(this.selectedMilestoneIndex, this.selectedTaskIndex);
        } else {
            this.clearSubTasks();
        }
    }
    
    renderMainGoal() {
        const mainGoal = this.model.getMainGoal() || "🎯 메인 목표를 입력하세요";
        
        this.mainGoalNode.innerHTML = `
            <div class="tree-node main-goal" id="main-goal-node">
                <div class="node-title">${mainGoal}</div>
                <div class="tree-connector"></div>
            </div>
        `;
        
        // 메인 목표 클릭 이벤트
        document.getElementById('main-goal-node').addEventListener('click', () => {
            const content = document.querySelector('#main-goal-node .node-title');
            const currentText = this.model.getMainGoal();
            
            this.makeEditable(content, currentText, (newText) => {
                this.model.updateMainGoal(newText);
                this.render();
            });
        });
    }
    
    renderMilestones() {
        let html = '';
        let hasAnyMilestone = false;
        
        for (let i = 0; i < 8; i++) {
            const milestoneChar = String.fromCharCode(65 + i); // A-H 매핑
            const milestoneContent = this.model.getSubGoal(i);
            
            // 마일스톤 내용이 있는 경우에만 표시
            if (milestoneContent && milestoneContent.trim() !== '') {
                hasAnyMilestone = true;
                const isSelected = this.selectedMilestoneIndex === i;
                
                html += `
                    <div class="tree-node milestone milestone-color-${i + 1} ${isSelected ? 'selected' : ''}" 
                         data-index="${i}" id="milestone-node-${i}">
                        <span class="milestone-label">마일스톤 ${milestoneChar}</span>
                        <div class="node-title">${milestoneContent}</div>
                        ${isSelected ? '<div class="tree-connector"></div>' : ''}
                    </div>
                `;
            }
        }
        
        // 표시할 마일스톤이 없는 경우 안내 메시지 표시
        if (!hasAnyMilestone) {
            html = '<div class="empty-state">입력된 마일스톤이 없습니다</div>';
        }
        
        this.milestonesNodes.innerHTML = html;
        
        // 마일스톤 클릭 이벤트 추가
        for (let i = 0; i < 8; i++) {
            const milestoneNode = document.getElementById(`milestone-node-${i}`);
            if (milestoneNode) {
                milestoneNode.addEventListener('click', (e) => {
                    // 선택 상태 토글
                    if (this.selectedMilestoneIndex === i) {
                        // 이미 선택된 마일스톤 클릭 시 편집 모드
                        this.modalView.showMilestoneSidebar(this.model.getSubGoal(i), i);
                    } else {
                        // 다른 마일스톤 선택 시 태스크 보기
                        this.selectedMilestoneIndex = i;
                        this.selectedTaskIndex = null; // 태스크 선택 초기화
                        this.render();
                    }
                });
            }
        }
    }
    
    renderTasks(milestoneIndex) {
        let html = '';
        let hasAnyTask = false;
        
        // 선택된 마일스톤의 8개 태스크 표시
        for (let i = 0; i < 8; i++) {
            const taskContent = this.model.getDetail(milestoneIndex, i);
            
            // 태스크 내용이 있는 경우만 표시
            if (taskContent && taskContent.trim() !== '') {
                hasAnyTask = true;
                const isSelected = this.selectedTaskIndex === i;
                const isCompleted = this.model.getTaskCompletion(milestoneIndex, i);
                const pd = this.model.getPD(milestoneIndex, i);
                
                html += `
                    <div class="tree-node task ${isCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}" 
                         data-index="${i}" id="task-node-${milestoneIndex}-${i}">
                        <div class="node-title">${taskContent}</div>
                        ${pd ? `<span class="pd-label">담당: ${pd}</span>` : ''}
                        <div class="completion-indicator ${isCompleted ? 'completed' : 'pending'}"></div>
                        ${isSelected ? '<div class="tree-connector"></div>' : ''}
                    </div>
                `;
            }
        }
        
        if (!hasAnyTask) {
            html = '<div class="empty-state">이 마일스톤에 입력된 태스크가 없습니다</div>';
        }
        
        this.tasksNodes.innerHTML = html;
        
        // 태스크 클릭 이벤트 추가
        for (let i = 0; i < 8; i++) {
            const taskNode = document.getElementById(`task-node-${milestoneIndex}-${i}`);
            if (taskNode) {
                taskNode.addEventListener('click', () => {
                    if (this.selectedTaskIndex === i) {
                        // 이미 선택된 태스크 클릭 시 편집 모드
                        const taskContent = this.model.getDetail(milestoneIndex, i);
                        this.modalView.show(taskContent, milestoneIndex, i);
                    } else {
                        // 다른 태스크 선택 시 하위 태스크 보기
                        this.selectedTaskIndex = i;
                        this.render();
                    }
                });
            }
        }
    }
    
    renderSubTasks(milestoneIndex, taskIndex) {
        const tasks = this.model.getTasks(milestoneIndex, taskIndex);
        let html = '';
        
        if (tasks && tasks.length > 0) {
            tasks.forEach((task, index) => {
                html += `
                    <div class="tree-node subtask ${task.completed ? 'completed' : ''}" 
                         data-index="${index}" id="subtask-node-${milestoneIndex}-${taskIndex}-${index}">
                        <div class="node-title">${task.content}</div>
                        <div class="completion-indicator ${task.completed ? 'completed' : 'pending'}"></div>
                    </div>
                `;
            });
        } else {
            html = '<div class="empty-state">이 태스크에 하위 태스크가 없습니다</div>';
        }
        
        this.subTasksNodes.innerHTML = html;
        
        // 하위 태스크 클릭 이벤트 - 편집 모달로 연결
        tasks.forEach((task, index) => {
            const subtaskNode = document.getElementById(`subtask-node-${milestoneIndex}-${taskIndex}-${index}`);
            if (subtaskNode) {
                subtaskNode.addEventListener('click', () => {
                    // 태스크 편집 모달 열기
                    const taskContent = this.model.getDetail(milestoneIndex, taskIndex);
                    this.modalView.show(taskContent, milestoneIndex, taskIndex);
                });
            }
        });
    }
    
    clearTasks() {
        this.tasksNodes.innerHTML = '<div class="empty-state">마일스톤을 선택하세요</div>';
    }
    
    clearSubTasks() {
        this.subTasksNodes.innerHTML = '<div class="empty-state">태스크를 선택하세요</div>';
    }
    
    makeEditable(element, currentText, callback) {
        const originalContent = element.innerHTML;
        element.innerHTML = `<textarea class="editable-area">${currentText || ''}</textarea>`;
        const textarea = element.querySelector('.editable-area');
        
        // 텍스트 영역에 스타일 적용
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.resize = 'none';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.background = 'transparent';
        textarea.style.fontFamily = 'inherit';
        textarea.style.fontSize = 'inherit';
        textarea.style.color = 'inherit';
        
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        const handleBlur = () => {
            const newText = textarea.value.trim();
            if (newText) {
                callback(newText);
            } else {
                // 빈 텍스트인 경우 원래 내용으로 복원
                element.innerHTML = originalContent;
            }
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
} 