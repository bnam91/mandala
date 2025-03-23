export default class ModalView {
    constructor(modalId, model) {
        this.modal = document.getElementById(modalId);
        this.modalContent = this.modal.querySelector('.modal-content');
        this.modalTitle = document.getElementById('modalTitle');
        this.closeBtn = document.querySelector('.close-modal');
        this.model = model;
        this.currentSubGoalIndex = -1;
        this.currentDetailIndex = -1;
        this.subGridContainer = document.getElementById('subGrid');
        
        // 사이드바 모달 설정
        this.sidebar = document.getElementById('detailSidebar');
        this.sidebarTitle = document.getElementById('sidebarTitle');
        this.sidebarContent = document.getElementById('sidebarContent');
        this.closeSidebarBtn = document.querySelector('.close-sidebar');
        
        this.closeBtn.addEventListener('click', () => this.hide());
        this.closeSidebarBtn.addEventListener('click', () => this.hideSidebar());
        
        // 배경 클릭 시 모달과 사이드바 모두 닫기
        document.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
            
            // 사이드바가 활성화된 상태에서만 실행
            if (this.sidebar.classList.contains('active')) {
                // 클릭된 요소가 사이드바 내부 요소가 아닌지 확인
                if (!this.sidebar.contains(e.target) && e.target !== this.sidebar) {
                    // 사이드바 밖을 클릭했을 때만 닫기
                    this.hideSidebar();
                }
            }
        });
        
        // 모달 클릭 시 이벤트 버블링 중지
        this.sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    show(title, subGoalIndex = -1, detailIndex = -1) {
        // 세부 과제는 사이드바에 표시
        if (subGoalIndex !== -1 && detailIndex !== -1) {
            this.showSidebar(title, subGoalIndex, detailIndex);
            return;
        }
        
        // 기존 코드 (서브그리드 모달용)
        this.modalTitle.textContent = title;
        this.currentSubGoalIndex = subGoalIndex;
        this.currentDetailIndex = detailIndex;
        
        // 모달 내용 초기화
        this.modalContent.innerHTML = '';
        
        // 모달 제목과 닫기 버튼 다시 추가
        this.modalContent.innerHTML = `
            <span class="close-modal">&times;</span>
            <h2 id="modalTitle">${title}</h2>
            <div id="modalContentContainer"></div>
        `;
        
        this.modalTitle = document.getElementById('modalTitle');
        this.closeBtn = document.querySelector('.close-modal');
        const contentContainer = document.getElementById('modalContentContainer');
        
        // 서브그리드 모달인 경우
        contentContainer.innerHTML = '<div class="mandal-grid" id="subGrid"></div>';
        this.subGridContainer = document.getElementById('subGrid');
        
        if (window.subGridView) {
            window.subGridView.container = this.subGridContainer;
            window.subGridView.render();
        }
        
        // 닫기 버튼에 이벤트 리스너 추가
        this.closeBtn.addEventListener('click', () => this.hide());
        
        this.modal.style.display = 'flex';
    }
    
    // 사이드바로 세부 과제 표시
    showSidebar(title, subGoalIndex, detailIndex) {
        this.currentSubGoalIndex = subGoalIndex;
        this.currentDetailIndex = detailIndex;
        
        // 마일스톤 문자 계산 (0 -> A, 1 -> B, ...)
        const milestoneChar = String.fromCharCode(65 + subGoalIndex);
        
        // 마일스톤 제목 가져오기
        const milestoneTitle = this.model.getSubGoal(subGoalIndex) || `마일스톤 ${milestoneChar}`;
        
        // 사이드바 제목에 마일스톤 정보 추가
        this.sidebarTitle.textContent = `마일스톤 ${milestoneChar} > ${title}`;
        
        // 담당자 정보 가져오기
        const detailContent = this.model.getDetail(subGoalIndex, detailIndex) || '';
        const tasks = this.model.getTasks(subGoalIndex, detailIndex) || [];
        const pd = this.model.getPD(subGoalIndex, detailIndex) || '';
        
        // 태스크 완료 상태 가져오기
        const isCompleted = this.model.getTaskCompletion(subGoalIndex, detailIndex) || false;
        
        // 사이드바 내용 생성 - 담당자 필드와 완료 체크박스 추가
        let sidebarHTML = `
            <div class="detail-modal">
                <div class="milestone-info milestone-color-${subGoalIndex + 1}">
                    <h3>마일스톤 ${milestoneChar}: ${milestoneTitle}</h3>
                </div>
                <div class="detail-header">
                    <h3>태스크</h3>
                    <div class="task-header-row">
                        <input type="text" id="detailTitleInput" class="detail-title-input" 
                               value="${detailContent}" placeholder="태스크 입력">
                        <div class="task-completion-checkbox">
                            <input type="checkbox" id="taskCompletionCheckbox" ${isCompleted ? 'checked' : ''}>
                            <label for="taskCompletionCheckbox">완료</label>
                        </div>
                    </div>
                    <div class="pd-field">
                        <label for="pdInput">담당자(PD)</label>
                        <input type="text" id="pdInput" class="pd-input" 
                               value="${pd}" placeholder="담당자 이름">
                    </div>
                </div>
                <div class="tasks-container">
                    <h4>하위 태스크</h4>
                    <ul class="tasks-list" id="tasksList">
        `;
        
        // 태스크가 있으면 모두 렌더링, 없으면 기본 빈 입력란 하나 제공
        if (tasks.length > 0) {
            // 기존 코드: 태스크 목록 렌더링
            tasks.forEach((task, index) => {
                sidebarHTML += `
                    <li class="task-item">
                        <div class="task-content">
                            <input type="checkbox" id="task-${index}" class="task-checkbox" 
                                   ${task.completed ? 'checked' : ''}>
                            <input type="text" class="task-input" value="${task.content}" 
                                   placeholder="하위 태스크 입력">
                        </div>
                        <button class="delete-task-btn" data-index="${index}">삭제</button>
                    </li>
                `;
            });
        } else {
            // 태스크가 없을 경우 기본 빈 입력란 추가
            sidebarHTML += `
                <li class="task-item">
                    <div class="task-content">
                        <input type="checkbox" class="task-checkbox">
                        <input type="text" class="task-input" placeholder="하위 태스크 입력">
                    </div>
                    <button class="delete-task-btn">삭제</button>
                </li>
            `;
        }
        
        // 새 태스크 추가 및 저장 버튼
        sidebarHTML += `
                    </ul>
                    <button id="addTaskBtn" class="add-task-btn">+ 새 하위 태스크 추가</button>
                </div>
                <div class="modal-actions">
                    <button id="saveDetailBtn" class="save-btn">저장</button>
                    <button id="cancelDetailBtn" class="cancel-btn">취소</button>
                </div>
            </div>
        `;
        
        this.sidebarContent.innerHTML = sidebarHTML;
        
        // 그리드 이동 효과 추가 - 좀 더 명시적으로 설정
        const container = document.querySelector('.container');
        const grid = document.querySelector('.mandal-grid-full');
        container.classList.add('sidebar-active');
        grid.classList.add('sidebar-active');
        
        // 사이드바가 열린 직후 클릭 이벤트를 무시하도록 설정
        this.ignoreClickEvents = true;
        setTimeout(() => {
            this.ignoreClickEvents = false;
        }, 300);
        
        // 사이드바 표시
        this.sidebar.style.display = 'block';
        setTimeout(() => {
            this.sidebar.classList.add('active');
        }, 10);
        
        // 이벤트 리스너 추가
        this.addDetailSidebarEventListeners(subGoalIndex, detailIndex);
    }
    
    // 사이드바 이벤트 리스너 (기존 addDetailModalEventListeners와 유사)
    addDetailSidebarEventListeners(subGoalIndex, detailIndex) {
        const detailTitleInput = document.getElementById('detailTitleInput');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const tasksList = document.getElementById('tasksList');
        const saveDetailBtn = document.getElementById('saveDetailBtn');
        const cancelDetailBtn = document.getElementById('cancelDetailBtn');
        const taskCompletionCheckbox = document.getElementById('taskCompletionCheckbox');
        
        // 체크박스 스타일 업데이트 함수
        const updateTaskStyle = (checkbox) => {
            const inputField = checkbox.closest('.task-content').querySelector('.task-input');
            if (checkbox.checked) {
                inputField.classList.add('completed-task');
            } else {
                inputField.classList.remove('completed-task');
            }
        };
        
        // 기존 체크박스에 이벤트 리스너 추가 및 초기 스타일 설정
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            // 초기 상태 설정
            updateTaskStyle(checkbox);
            
            // 체크박스 상태 변경 이벤트
            checkbox.addEventListener('change', () => {
                updateTaskStyle(checkbox);
            });
        });
        
        // 태스크 추가 버튼 이벤트 리스너 수정
        addTaskBtn.addEventListener('click', () => {
            const newTaskItem = document.createElement('li');
            newTaskItem.className = 'task-item';
            newTaskItem.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox">
                    <input type="text" class="task-input" placeholder="하위 태스크 입력">
                </div>
                <button class="delete-task-btn">삭제</button>
            `;
            
            tasksList.appendChild(newTaskItem);
            
            // 새 체크박스에 이벤트 추가
            const newCheckbox = newTaskItem.querySelector('.task-checkbox');
            newCheckbox.addEventListener('change', () => {
                updateTaskStyle(newCheckbox);
            });
            
            // 삭제 버튼에 이벤트 추가
            const deleteBtn = newTaskItem.querySelector('.delete-task-btn');
            deleteBtn.addEventListener('click', () => {
                newTaskItem.remove();
            });
            
            // 새로 추가된 입력 필드에 포커스
            const newInput = newTaskItem.querySelector('.task-input');
            newInput.focus();
        });
        
        // 기존 삭제 버튼들에 이벤트 추가
        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                taskItem.remove();
            });
        });
        
        // 저장 버튼
        saveDetailBtn.addEventListener('click', () => {
            const detailTitle = document.getElementById('detailTitleInput').value.trim();
            const pdName = document.getElementById('pdInput').value.trim();
            const isCompleted = taskCompletionCheckbox.checked;
            const tasks = [];
            
            // 모든 태스크 수집
            document.querySelectorAll('.task-item').forEach(item => {
                const checkbox = item.querySelector('.task-checkbox');
                const input = item.querySelector('.task-input');
                const content = input.value.trim();
                
                if (content) {
                    tasks.push({
                        content: content,
                        completed: checkbox.checked
                    });
                }
            });
            
            // 모델 업데이트 - 완료 상태 추가
            this.model.updateDetail(subGoalIndex, detailIndex, detailTitle, tasks, pdName, isCompleted);
            
            // 모달 닫기
            this.hideSidebar();
            
            // 메인 뷰 업데이트
            if (window.fullGridView) {
                window.fullGridView.render();
            }
        });
        
        // 취소 버튼
        cancelDetailBtn.addEventListener('click', () => {
            this.hideSidebar();
        });
    }
    
    // 사이드바 숨기기
    hideSidebar() {
        this.sidebar.classList.remove('active');
        document.querySelector('.container').classList.remove('sidebar-active');
        document.querySelector('.mandal-grid-full').classList.remove('sidebar-active');
        
        setTimeout(() => {
            this.sidebar.style.display = 'none';
        }, 300);
    }
    
    hide() {
        this.modal.style.display = 'none';
    }
    
    updateTitle(title) {
        this.modalTitle.textContent = title;
    }
    
    // 마일스톤 사이드바로 표시 메서드 수정
    showMilestoneSidebar(title, subGoalIndex) {
        this.currentSubGoalIndex = subGoalIndex;
        this.currentDetailIndex = -1; // 세부 과제가 아님을 표시
        
        // 마일스톤 문자 계산 (0 -> A, 1 -> B, ...)
        const milestoneChar = String.fromCharCode(65 + subGoalIndex);
        
        // 사이드바 제목에 마일스톤 정보 추가
        this.sidebarTitle.textContent = `마일스톤 ${milestoneChar} 편집`;
        
        // 마일스톤 내용 가져오기
        const milestoneContent = this.model.getSubGoal(subGoalIndex) || '';
        
        // 사이드바 내용 생성
        let sidebarHTML = `
            <div class="detail-modal">
                <div class="milestone-info milestone-color-${subGoalIndex + 1}">
                    <h3>마일스톤 ${milestoneChar}</h3>
                </div>
                <div class="detail-header">
                    <h3>마일스톤 내용</h3>
                    <input type="text" id="milestoneInput" class="detail-title-input" 
                           value="${milestoneContent}" placeholder="마일스톤 내용 입력">
                </div>
                
                <div class="tasks-container">
                    <h4>관련 태스크 목록</h4>
                    <ul class="milestone-tasks-list" id="milestoneTasksList">
        `;
        
        // 관련된 8개 태스크 추가
        for (let detailIndex = 0; detailIndex < 8; detailIndex++) {
            const taskContent = this.model.getDetail(subGoalIndex, detailIndex) || '';
            const hasContent = taskContent.trim() !== '';
            
            sidebarHTML += `
                <li class="milestone-task-item ${hasContent ? '' : 'empty-task'}">
                    <div class="milestone-task-preview">
                        <span class="milestone-task-number">${detailIndex + 1}.</span>
                        <input type="text" class="milestone-task-input" data-index="${detailIndex}" 
                               value="${taskContent}" placeholder="태스크 ${detailIndex + 1} 입력">
                    </div>
                    <button class="edit-task-btn" data-index="${detailIndex}">편집</button>
                </li>
            `;
        }
        
        sidebarHTML += `
                    </ul>
                </div>
                
                <div class="modal-actions">
                    <button id="saveMilestoneBtn" class="save-btn">저장</button>
                    <button id="cancelMilestoneBtn" class="cancel-btn">취소</button>
                </div>
            </div>
        `;
        
        this.sidebarContent.innerHTML = sidebarHTML;
        
        // 그리드 이동 효과 추가
        const container = document.querySelector('.container');
        const grid = document.querySelector('.mandal-grid-full');
        container.classList.add('sidebar-active');
        grid.classList.add('sidebar-active');
        
        // 사이드바가 열린 직후 클릭 이벤트를 무시하도록 설정
        this.ignoreClickEvents = true;
        setTimeout(() => {
            this.ignoreClickEvents = false;
        }, 300);
        
        // 사이드바 표시
        this.sidebar.style.display = 'block';
        setTimeout(() => {
            this.sidebar.classList.add('active');
        }, 10);
        
        // 이벤트 리스너 추가
        this.addMilestoneSidebarEventListeners(subGoalIndex);
    }
    
    // 마일스톤 사이드바 이벤트 리스너 수정
    addMilestoneSidebarEventListeners(subGoalIndex) {
        const saveMilestoneBtn = document.getElementById('saveMilestoneBtn');
        const cancelMilestoneBtn = document.getElementById('cancelMilestoneBtn');
        const taskInputs = document.querySelectorAll('.milestone-task-input');
        const editButtons = document.querySelectorAll('.edit-task-btn');
        
        // 태스크 편집 버튼 이벤트 리스너
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const detailIndex = parseInt(e.target.dataset.index);
                
                // 현재 모달 닫기
                this.hideSidebar();
                
                // 선택한 태스크의 상세 모달 열기
                setTimeout(() => {
                    const taskContent = this.model.getDetail(subGoalIndex, detailIndex) || '태스크 입력';
                    this.show(taskContent, subGoalIndex, detailIndex);
                }, 300); // 사이드바 닫히는 애니메이션 후 실행
            });
        });
        
        // 저장 버튼
        saveMilestoneBtn.addEventListener('click', () => {
            const milestoneInput = document.getElementById('milestoneInput');
            const newContent = milestoneInput.value.trim();
            
            // 마일스톤 내용 업데이트
            this.model.updateSubGoal(subGoalIndex, newContent);
            
            // 모든 태스크 내용 업데이트
            taskInputs.forEach(input => {
                const detailIndex = parseInt(input.dataset.index);
                const taskContent = input.value.trim();
                
                // 내용이 변경된 경우에만 업데이트
                const currentContent = this.model.getDetail(subGoalIndex, detailIndex) || '';
                if (taskContent !== currentContent) {
                    this.model.updateDetail(subGoalIndex, detailIndex, taskContent);
                }
            });
            
            // 모달 닫기
            this.hideSidebar();
            
            // 메인 뷰 업데이트
            if (window.fullGridView) {
                window.fullGridView.render();
            }
        });
        
        // 취소 버튼
        cancelMilestoneBtn.addEventListener('click', () => {
            this.hideSidebar();
        });
    }
} 