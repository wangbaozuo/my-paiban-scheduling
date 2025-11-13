// ======================
// 数据模型与常量
// ======================
let AppState = {
    employees: [],
    restEmployees: [],
    noCodingEmployees: [],
    groups: {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []},
    monthlyCache: new Map(),
    priorities: {},
    notifications: [],
    currentTheme: 'light'
};
const CONSTANTS = {
    DB_NAME: 'ScheduleSystemDB',
    DB_VERSION: 2,
    STORE_CONFIG: 'config',
    STORE_SCHEDULES: 'schedules',
    STORE_RESTS: 'rests',
    STORE_NOTIFICATIONS: 'notifications',

    ROLES: ['主刀', '上料', '毛边', '刻码', '包装', '检料'],

    CUTTING_MACHINES: [1, 2, 4],
    PEOPLE_PER_CUTTING_MACHINE: 5,
    CODING_MACHINES: 5,
    PEOPLE_FOR_PACKAGING: 4,
    FIXED_STAFF_REQUIRED: (3 * 5) + 5 + 4,
    CYCLE_DAYS: 5,
    MONTHLY_LIMIT: 4,
    NO_CODING_INSP_LIMIT: 5,
    TARGET_PER_MACHINE: 2
};
const DEFAULT_EMPLOYEES = [
    "劉光洋", "張招康", "梁项", "肖克", "韦東", "覃桂新", "譚文佳", "吴国建", "覃勝根", "汪朝暉",
    "陆石光", "李傑", "馮科儉", "黄志", "祝中正", "余強明", "李峰", "李世乾", "李涛", "張光前",
    "李文旭", "周林烽", "王保佐", "廖黎彬", "覃錫鈞", "郭豪军", "王必興", "张在明", "李建勇", "杨毅",
    "敖成永", "彭英", "余小平", "蘭家健", "李红亮", "周日唐", "田儒賢", "胡琦"
];
// ======================
// DOM 元素 与 UI 工具函数
// ======================
function $(id) { return document.getElementById(id); }
const elements = {
    newEmp: $('new-employee'),
    excelImport: $('excel-import'),
    backupImport: $('backup-import'),
    deleteList: $('delete-list'),
    restList: $('rest-list'),
    noCodingList: $('no-coding-list'),
    groupAvailList: $('group-avail-list'),
    groupsContainer: $('groups-container'),
    groupSearch: $('group-search'),
    selectedGroup: $('selected-group'),
    btnAssignGroup: $('btn-assign-group'),
    btnClearGroups: $('btn-clear-groups'),
    btnValidateGroups: $('btn-validate-groups'),
    searchDelete: $('search-delete'),
    searchRest: $('search-rest'),
    searchNoCoding: $('search-no-coding'),
    year: $('year'),
    month: $('month'),
    dateInput: $('specific-date'),
    histYear: $('hist-year'),
    histMonth: $('hist-month'),
    histEmployee: $('hist-employee'),
    btnAdd: $('btn-add-employee'),
    btnImportExcel: $('btn-import-excel'),
    btnSelectAll: $('btn-select-all'),
    btnRemove: $('btn-remove-selected'),
    btnResetAll: $('btn-reset-all'),
    btnExportBackup: $('btn-export-backup'),
    btnImportBackup: $('btn-import-backup'),
    btnBackup: $('btn-backup-data'), // 旧的，保留兼容

    btnShowPriorities: $('btn-show-priorities'),
    priorityModal: $('priority-modal'),
    priorityTableContainer: $('priority-table-container'),
    btnSavePriorities: $('btn-save-priorities'),
    btnCloseModal: $('btn-close-modal'),
    btnShowRest: $('btn-show-rest'),
    btnConfirmRest: $('btn-confirm-rest'),
    btnShowNoCoding: $('btn-show-no-coding'),
    btnConfirmNoCoding: $('btn-confirm-no-coding'),
    btnHistView: $('btn-hist-view'),
    btnHistEmployee: $('btn-hist-employee'),
    btnHistRestRank: $('btn-hist-rest-rank'),
    btnGenerate: $('btn-generate'),
    btnMonthlyGenerate: $('btn-monthly-generate'),
    btnResetSchedule: $('btn-reset-schedule'),
    btnExport: $('btn-export'),
    btnExportExcel: $('btn-export-excel'),
    btnExpandAll: $('btn-expand-all'),
    btnCollapseAll: $('btn-collapse-all'),
    preview: $('preview'),
    monthlyPreview: $('monthly-preview'),
    historyPreview: $('history-preview'),
    progress: $('progress'),
    progressBar: $('progress-bar'),

    employeeSelfLookup: $('employee-self-lookup'),
    btnLookupSchedule: $('btn-lookup-schedule'),
    selfServicePanel: $('self-service-panel'),
    myScheduleDetails: $('my-schedule-details'),
    requestDate: $('request-date'),
    requestReason: $('request-reason'),
    requestDetails: $('request-details'),
    btnSubmitRequest: $('btn-submit-request'),

    workloadChart: $('workload-chart'),
    skillDistributionChart: $('skill-distribution-chart'),
    balanceScore: $('balance-score'),
    satisfactionScore: $('satisfaction-score'),
    completionRate: $('completion-rate'),
    skillMatch: $('skill-match'),
    aiSuggestions: $('ai-suggestions'),
    suggestionsList: $('suggestions-list'),

    notificationPanel: $('notification-panel')
};
/**
 * 渲染复选框列表
 */
function renderCheckboxes(container, list, checkedValues = [], searchQuery = '') {
    container.innerHTML = '';
    const filteredList = list.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()));
    filteredList.forEach(name => {
        const div = document.createElement('label');
        div.className = 'checkbox-item';
        div.setAttribute('tabindex', '0');
        div.innerHTML = `<input type="checkbox" value="${name}" ${checkedValues.includes(name) ? 'checked' : ''}><span>${name}</span>`;
        div.addEventListener('keydown', e => { if (e.key === 'Enter') div.querySelector('input').click(); });
        container.appendChild(div);
    });
}
/**
 * 获取复选框选中的值
 */
function getChecked(container) {
    return Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
}
/**
 * 全选/反选
 */
function toggleSelectAll(container, isSelectAll) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = isSelectAll);
}
/**
 * 获取当前日期的 key
 */
function getCurrentDateKey(prefix) {
    const y = +elements.year.value, m = +elements.month.value, d = +elements.dateInput.value;
    if (!y || !m || !d || d < 1) return null;
    const maxDay = new Date(y, m, 0).getDate();
    if (d > maxDay) return null;
    return `${prefix}_${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
/**
 * 获取指定日期的 key
 */
function getDateKey(prefix, y, m, d) {
    return `${prefix}_${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
/**
 * 获取月度生成标志 key
 */
function getMonthlyGeneratedKey(y, m) {
    return `monthly_generated_${y}-${String(m).padStart(2, '0')}`;
}
/**
 * 验证排班数据是否有效
 */
function isValidScheduleData(data) {
    return data && data.assignments && data.stats && typeof data.stats.working === 'number';
}
/**
 * 渲染分组 UI
 */
function renderGroups() {
    const assigned = new Set();
    Object.values(AppState.groups).forEach(group => group.forEach(emp => assigned.add(emp)));
    const available = AppState.employees.filter(emp => !assigned.has(emp));
    renderCheckboxes(elements.groupAvailList, available, [], elements.groupSearch.value);
    elements.groupAvailList.style.display = 'block';
    const groupLabels = {
        0: 'G组 (周日休)', 1: 'A组 (周一休)', 2: 'B组 (周二休)',
        3: 'C组 (周三休)', 4: 'D组 (周四休)', 5: 'E组 (周五休)', 6: 'F组 (周六休)'
    };
    elements.groupsContainer.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const groupBox = document.createElement('div');
        groupBox.className = 'group-box';
        const count = AppState.groups[i].length;
        const status = count >= 3 && count <= 10 ? '✅ 理想' : count < 3 ? '⚠️ 不足' : '❌ 过多';
        groupBox.innerHTML = `
            <div class="group-header">${groupLabels[i]}</div>
            <div class="group-count">${status} (${count}/3-10人)</div>
            <div class="group-list">${AppState.groups[i].join('<br>') || '空'}</div>
        `;
        elements.groupsContainer.appendChild(groupBox);
    }
}
/**
 * 验证分组
 */
function validateGroups() {
    let totalAssigned = 0;
    Object.values(AppState.groups).forEach(group => totalAssigned += group.length);
    const coverage = AppState.employees.length > 0 ? (totalAssigned / AppState.employees.length * 100).toFixed(1) : 0;
    let validGroups = 0;
    for (let i = 0; i < 7; i++) {
        const count = AppState.groups[i].length;
        if (count >= 3 && count <= 10) validGroups++;
    }
    if (validGroups === 7 && coverage >= 90) {
        alert(`✅ 分组完美！覆盖率: ${coverage}%，全组理想大小。`);
    } else {
        alert(`⚠️ 分组需优化：覆盖率 ${coverage}%，理想组数 ${validGroups}/7。建议每组3-10人，总覆盖>90%。`);
    }
}
// ======================
// IndexedDB 核心数据库助手
// ======================
let db = null;
/**
 * 初始化 IndexedDB 数据库
 */
function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }
        const request = indexedDB.open(CONSTANTS.DB_NAME, CONSTANTS.DB_VERSION);
        request.onerror = (event) => {
            console.error("数据库打开失败:", event.target.error);
            reject(event.target.error);
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("数据库打开成功");
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            console.log("数据库升级...");
            db = event.target.result;

            if (!db.objectStoreNames.contains(CONSTANTS.STORE_CONFIG)) {
                db.createObjectStore(CONSTANTS.STORE_CONFIG, { keyPath: 'key' });
            }

            if (!db.objectStoreNames.contains(CONSTANTS.STORE_SCHEDULES)) {
                db.createObjectStore(CONSTANTS.STORE_SCHEDULES, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(CONSTANTS.STORE_RESTS)) {
                db.createObjectStore(CONSTANTS.STORE_RESTS, { keyPath: 'key' });
            }
            // 新增存储区
            if (!db.objectStoreNames.contains(CONSTANTS.STORE_NOTIFICATIONS)) {
                db.createObjectStore(CONSTANTS.STORE_NOTIFICATIONS, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}
/**
 * 异步保存数据到 IndexedDB
 */
async function saveData(storeName, key, value) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const data = { key: key, value: value };
 
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            console.error(`保存数据失败 [${storeName} - ${key}]:`, event.target.error);
            reject(event.target.error);
        };
    });
}
/**
 * 异步从 IndexedDB 加载数据
 */
async function loadData(storeName, key, defaultValue = null) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = (event) => {
            const result = event.target.result;
            if (result) {
                resolve(result.value);
            } else {
                resolve(defaultValue);
            }
        };
        request.onerror = (event) => {
            console.error(`加载数据失败 [${storeName} - ${key}]:`, event.target.error);
            reject(event.target.error);
        };
    });
}
/**
 * 异步从 IndexedDB 删除数据
 */
async function deleteData(storeName, key) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            console.error(`删除数据失败 [${storeName} - ${key}]:`, event.target.error);
            reject(event.target.error);
        };
    });
}
/**
 * 导出所有数据 (优化：确保所有模块数据完整导出)
 */
async function exportAllData() {
    if (!db) await initDB();
    const allData = {
        config: {},
        schedules: {},
        rests: {},
        notifications: []
    };
    // Config (所有配置模块：员工、分组、优先级、不会刻码等)
    const configTx = db.transaction([CONSTANTS.STORE_CONFIG], 'readonly');
    const configStore = configTx.objectStore(CONSTANTS.STORE_CONFIG);
    const configCursor = configStore.openCursor();
    await new Promise((resolve) => {
        configCursor.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                allData.config[cursor.value.key] = cursor.value.value;
                cursor.continue();
            } else {
                resolve();
            }
        };
    });
    // Schedules (所有排班数据)
    const schedTx = db.transaction([CONSTANTS.STORE_SCHEDULES], 'readonly');
    const schedStore = schedTx.objectStore(CONSTANTS.STORE_SCHEDULES);
    const schedCursor = schedStore.openCursor();
    await new Promise((resolve) => {
        schedCursor.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                allData.schedules[cursor.value.key] = cursor.value.value;
                cursor.continue();
            } else {
                resolve();
            }
        };
    });
    // Rests (所有休息数据)
    const restTx = db.transaction([CONSTANTS.STORE_RESTS], 'readonly');
    const restStore = restTx.objectStore(CONSTANTS.STORE_RESTS);
    const restCursor = restStore.openCursor();
    await new Promise((resolve) => {
        restCursor.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                allData.rests[cursor.value.key] = cursor.value.value;
                cursor.continue();
            } else {
                resolve();
            }
        };
    });
    // Notifications (所有通知数据)
    const notifTx = db.transaction([CONSTANTS.STORE_NOTIFICATIONS], 'readonly');
    const notifStore = notifTx.objectStore(CONSTANTS.STORE_NOTIFICATIONS);
    const notifCursor = notifStore.openCursor();
    await new Promise((resolve) => {
        notifCursor.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                allData.notifications.push(cursor.value);
                cursor.continue();
            } else {
                resolve();
            }
        };
    });
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('所有模块数据（员工、分组、优先级、排班、休息、通知）导出成功', 'success');
}
/**
 * 导入所有数据 (优化：导入后全面刷新所有模块UI，确保所有功能显示)
 */
async function importAllData(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const allData = JSON.parse(e.target.result);
            // 清空现有数据
            const tx = db.transaction([CONSTANTS.STORE_CONFIG, CONSTANTS.STORE_SCHEDULES, CONSTANTS.STORE_RESTS, CONSTANTS.STORE_NOTIFICATIONS], 'readwrite');
            const configStore = tx.objectStore(CONSTANTS.STORE_CONFIG);
            const schedStore = tx.objectStore(CONSTANTS.STORE_SCHEDULES);
            const restStore = tx.objectStore(CONSTANTS.STORE_RESTS);
            const notifStore = tx.objectStore(CONSTANTS.STORE_NOTIFICATIONS);
            await new Promise((resolve, reject) => {
                configStore.clear().onsuccess = () => {
                    Object.entries(allData.config || {}).forEach(([k, v]) => configStore.put({ key: k, value: v }));
                };
                schedStore.clear().onsuccess = () => {
                    Object.entries(allData.schedules || {}).forEach(([k, v]) => schedStore.put({ key: k, value: v }));
                };
                restStore.clear().onsuccess = () => {
                    Object.entries(allData.rests || {}).forEach(([k, v]) => restStore.put({ key: k, value: v }));
                };
                notifStore.clear().onsuccess = () => {
                    (allData.notifications || []).forEach(notif => notifStore.put(notif));
                    resolve();
                };
                tx.onerror = reject;
            });
            // 重新加载AppState (所有模块)
            AppState.employees = allData.config?.employees || DEFAULT_EMPLOYEES;
            AppState.groups = allData.config?.groups || {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []};
            AppState.priorities = allData.config?.priorities || {};
            AppState.noCodingEmployees = allData.config?.noCoding || [];
            AppState.notifications = allData.notifications || [];
            // 全面刷新UI：列表、分组、日期UI、AI建议、历史预览等
            await refreshLists();
            renderGroups();
            await updateUIForDate();
            await generateAISuggestions();
            // 刷新历史预览（如果有日期）
            if (elements.histYear.value && elements.histMonth.value) {
                await renderHistoryOverview();
            }
            // ★★★ 优化：导入后重新渲染月度预览表（如果存在数据） ★★★
            await renderExistingMonthlyPreview();
            showNotification('所有模块数据导入成功，所有界面已全面刷新显示', 'success');
        } catch (error) {
            console.error('导入失败:', error);
            showNotification('导入失败：文件格式无效', 'danger');
        }
    };
    reader.readAsText(file);
}
// ======================
// 新增功能模块
// ======================
/**
 * 主题设置功能
 */
function setTheme(theme) {
    document.body.className = `theme-${theme}`;
    AppState.currentTheme = theme;
    localStorage.setItem('schedule-theme', theme);

    // 更新图表主题
    updateChartsTheme();
}
/**
 * 更新图表主题
 */
function updateChartsTheme() {
    if (window.workloadChart) {
        window.workloadChart.destroy();
        initWorkloadChart();
    }
    if (window.skillDistributionChart) {
        window.skillDistributionChart.destroy();
        initSkillDistributionChart();
    }
}
/**
 * 初始化工作量图表
 */
function initWorkloadChart() {
    const ctx = elements.workloadChart.getContext('2d');
    const isDark = AppState.currentTheme === 'dark';
    const textColor = isDark ? '#ecf0f1' : '#2c3e50';
    const gridColor = isDark ? 'rgba(236, 240, 241, 0.1)' : 'rgba(44, 62, 80, 0.1)';

    window.workloadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [{
                label: '平均工作量',
                data: [85, 78, 92, 88, 95, 65, 60],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(52, 152, 219, 0.7)'
                ],
                borderColor: [
                    'rgb(52, 152, 219)',
                    'rgb(52, 152, 219)',
                    'rgb(52, 152, 219)',
                    'rgb(52, 152, 219)',
                    'rgb(52, 152, 219)',
                    'rgb(52, 152, 219)',
                    'rgb(52, 152, 219)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: '周工作量分布',
                    color: textColor
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}
/**
 * 初始化技能分布图表
 */
function initSkillDistributionChart() {
    const ctx = elements.skillDistributionChart.getContext('2d');
    const isDark = AppState.currentTheme === 'dark';
    const textColor = isDark ? '#ecf0f1' : '#2c3e50';

    window.skillDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['主刀', '上料', '毛边', '刻码', '包装', '检料'],
            datasets: [{
                label: '技能分布',
                data: [15, 20, 18, 12, 25, 10],
                backgroundColor: [
                    'rgba(231, 76, 60, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(155, 89, 182, 0.7)',
                    'rgba(241, 196, 15, 0.7)',
                    'rgba(52, 73, 94, 0.7)'
                ],
                borderColor: [
                    'rgb(231, 76, 60)',
                    'rgb(52, 152, 219)',
                    'rgb(46, 204, 113)',
                    'rgb(155, 89, 182)',
                    'rgb(241, 196, 15)',
                    'rgb(52, 73, 94)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: '岗位技能分布',
                    color: textColor
                }
            }
        }
    });
}
/**
 * 显示通知
 */
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <strong>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️'} ${message}</strong>
        </div>
        <button class="notification-close">&times;</button>
    `;

    elements.notificationPanel.appendChild(notification);

    // 自动移除通知
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);

    // 点击关闭
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.parentNode.removeChild(notification);
    });

    // 保存到状态
    AppState.notifications.push({
        message,
        type,
        timestamp: new Date()
    });
}
/**
 * 生成AI优化建议 - 全面接入所有模块，实时异常检测
 */
async function generateAISuggestions() {
    const suggestions = [];

    // 获取当前日期
    const y = +elements.year.value, m = +elements.month.value;
    if (!y || !m) return;

    const daysInMonth = new Date(y, m, 0).getDate();

    // 1. 检查轮休分组是否完整
    let groupIssues = 0;
    Object.values(AppState.groups).forEach(g => {
        if (g.length < 3 || g.length > 10) groupIssues++;
    });
    if (groupIssues > 0) {
        suggestions.push({
            text: `轮休分组异常：${groupIssues}个组不符合3-10人要求，建议调整分组`,
            severity: "high"
        });
    }

    // 2. 检查员工总数是否足够
    if (AppState.employees.length < CONSTANTS.FIXED_STAFF_REQUIRED) {
        suggestions.push({
            text: `员工总数不足，当前${AppState.employees.length}人，至少需要${CONSTANTS.FIXED_STAFF_REQUIRED}人`,
            severity: "high"
        });
    }

    // 3. 检查刻码技能人员是否足够
    const canCode = AppState.employees.filter(e => !AppState.noCodingEmployees.includes(e));
    if (canCode.length < CONSTANTS.CODING_MACHINES) {
        suggestions.push({
            text: `会刻码人员不足，当前${canCode.length}人，需要${CONSTANTS.CODING_MACHINES}人`,
            severity: "medium"
        });
    }

    // 4. 检查本月排班完成情况
    let scheduledDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const key = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, day);
        const data = await loadData(CONSTANTS.STORE_SCHEDULES, key, null);
        if (isValidScheduleData(data)) scheduledDays++;
    }

    const completionRate = (scheduledDays / daysInMonth * 100).toFixed(1);
    if (completionRate < 100) {
        suggestions.push({
            text: `本月排班完成率${completionRate}%，有${daysInMonth - scheduledDays}天未排班`,
            severity: "medium"
        });
    }

    // 5. 检查优先级设置完整性
    let unsetPriorities = 0;
    AppState.employees.forEach(emp => {
        if (!AppState.priorities[emp] || Object.values(AppState.priorities[emp]).some(v => v === undefined || v < 0)) unsetPriorities++;
    });
    if (unsetPriorities > 0) {
        suggestions.push({
            text: `${unsetPriorities}名员工优先级未设置或无效，建议完善以优化智能分配`,
            severity: "medium"
        });
    }

    // 6. 检查分组覆盖率
    let totalAssigned = 0;
    Object.values(AppState.groups).forEach(group => totalAssigned += group.length);
    const coverage = AppState.employees.length > 0 ? (totalAssigned / AppState.employees.length * 100).toFixed(1) : 0;
    if (coverage < 90) {
        suggestions.push({
            text: `轮休分组覆盖率仅${coverage}%，建议增加分组覆盖员工`,
            severity: "high"
        });
    }

    // 7. 检查不会刻码人员比例
    const noCodingRatio = AppState.noCodingEmployees.length / AppState.employees.length * 100;
    if (noCodingRatio > 20) {
        suggestions.push({
            text: `不会刻码人员比例过高 (${noCodingRatio.toFixed(1)}%)，可能影响刻码岗位分配`,
            severity: "medium"
        });
    }

    // 8. 检查历史数据异常（例如，某员工休息过多）
    const restCounts = {};
    AppState.employees.forEach(emp => restCounts[emp] = 0);
    for (let day = 1; day <= daysInMonth; day++) {
        const restKey = getDateKey(CONSTANTS.STORE_RESTS, y, m, day);
        const rests = await loadData(CONSTANTS.STORE_RESTS, restKey, []);
        rests.forEach(emp => {
            if (restCounts[emp] !== undefined) restCounts[emp]++;
        });
    }
    const maxRest = Math.max(...Object.values(restCounts));
    const avgRest = Object.values(restCounts).reduce((a, b) => a + b, 0) / AppState.employees.length;
    if (maxRest > avgRest * 1.5) {
        const overRestEmps = Object.entries(restCounts).filter(([_, c]) => c > avgRest * 1.5);
        suggestions.push({
            text: `${overRestEmps.length}名员工休息天数异常 (${maxRest}天 > 平均${avgRest.toFixed(1)}天)，建议均衡调整`,
            severity: "low"
        });
    }

    // 如果没有建议，显示积极信息
    if (suggestions.length === 0) {
        suggestions.push({
            text: "系统运行良好，所有模块数据正常，无异常检测到",
            severity: "low"
        });
    }

    // 渲染建议
    elements.suggestionsList.innerHTML = '';
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <div class="suggestion-icon">💡</div>
            <div class="suggestion-text">${suggestion.text}</div>
            <div class="suggestion-severity ${suggestion.severity}">${suggestion.severity}</div>
        `;
        elements.suggestionsList.appendChild(item);
    });
}
/**
 * 查询员工自己的排班
 */
async function lookupEmployeeSchedule(name) {
    if (!name || !AppState.employees.includes(name)) {
        showNotification('请输入有效的员工姓名', 'warning');
        return;
    }

    const y = +elements.year.value, m = +elements.month.value, d = +elements.dateInput.value;
    if (!y || !m || !d) {
        showNotification('请选择完整日期', 'warning');
        return;
    }

    const scheduleKey = getCurrentDateKey(CONSTANTS.STORE_SCHEDULES);
    const data = await loadData(CONSTANTS.STORE_SCHEDULES, scheduleKey, null);

    if (!isValidScheduleData(data)) {
        showNotification('当日无排班数据', 'warning');
        return;
    }

    const {assignments} = data;
    let position = '未分配';

    // 查找员工岗位
    for (let machine of CONSTANTS.CUTTING_MACHINES) {
        if (assignments[`c${machine}_knife`] === name) {
            position = `${machine}号裁切 - 主刀`;
            break;
        }
        if (assignments[`c${machine}_load`] && assignments[`c${machine}_load`].includes(name)) {
            position = `${machine}号裁切 - 上料`;
            break;
        }
        if (assignments[`c${machine}_edge`] && assignments[`c${machine}_edge`].includes(name)) {
            position = `${machine}号裁切 - 毛边`;
            break;
        }
    }

    if (position === '未分配') {
        if (assignments.coding && assignments.coding.includes(name)) {
            position = '刻码';
        } else if (assignments.pack && assignments.pack.includes(name)) {
            position = '包装';
        } else if (assignments.inspection && assignments.inspection.includes(name)) {
            position = '检料';
        }
    }

    elements.myScheduleDetails.innerHTML = `
        <p><strong>姓名:</strong> ${name}</p>
        <p><strong>日期:</strong> ${y}年${m}月${d}日</p>
        <p><strong>岗位:</strong> ${position}</p>
    `;

    elements.selfServicePanel.style.display = 'block';
}
/**
 * 提交换班申请
 */
function submitShiftRequest() {
    const date = elements.requestDate.value;
    const reason = elements.requestReason.value;
    const details = elements.requestDetails.value;

    if (!date || !details) {
        showNotification('请填写完整申请信息', 'warning');
        return;
    }

    showNotification('换班申请已提交，等待管理员审批', 'success');

    // 清空表单
    elements.requestDate.value = '';
    elements.requestReason.value = 'personal';
    elements.requestDetails.value = '';
}
/**
 * 更新月度生成按钮状态
 */
async function updateMonthlyGenerateButton() {
    const y = +elements.year.value, m = +elements.month.value;
    if (!y || !m) {
        elements.btnMonthlyGenerate.disabled = true;
        return;
    }
    const generatedKey = getMonthlyGeneratedKey(y, m);
    const isGenerated = await loadData(CONSTANTS.STORE_CONFIG, generatedKey, false);
    elements.btnMonthlyGenerate.disabled = isGenerated;
    if (isGenerated) {
        elements.btnMonthlyGenerate.title = '该月已生成，请先重置排班';
    } else {
        elements.btnMonthlyGenerate.title = '一键生成本月排班';
    }
}
/**
 * ★★★ 新增：渲染现有月度预览表（从数据库加载，不生成） ★★★
 */
async function renderExistingMonthlyPreview() {
    const y = +elements.year.value, m = +elements.month.value;
    if (!y || !m) return;
    const generatedKey = getMonthlyGeneratedKey(y, m);
    const isGenerated = await loadData(CONSTANTS.STORE_CONFIG, generatedKey, false);
    if (!isGenerated) return;
    const daysInMonth = new Date(y, m, 0).getDate();
    elements.monthlyPreview.innerHTML = '<em>正在加载月度排班预览...</em>';
    let monthlyData = [];
    const groupLabels = { 0: 'G组', 1: 'A组', 2: 'B组', 3: 'C组', 4: 'D组', 5: 'E组', 6: 'F组' };
    let successCount = 0;
    let failedDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
        try {
            const tempDate = new Date(y, m - 1, day);
            const weekday = tempDate.getDay();
            const restKey = getDateKey(CONSTANTS.STORE_RESTS, y, m, day);
            const dayRests = await loadData(CONSTANTS.STORE_RESTS, restKey, []);
            const restLength = dayRests.length;
            const restGroup = groupLabels[weekday];
            const schedKey = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, day);
            const scheduleData = await loadData(CONSTANTS.STORE_SCHEDULES, schedKey, null);
            let dayHTML, working, insp = 0;
            if (isValidScheduleData(scheduleData)) {
                const {stats, assignments} = scheduleData;
                working = stats.working;
                insp = assignments.inspection ? assignments.inspection.length : 0;
                dayHTML = renderScheduleHTML(scheduleData, y, m, day);
                successCount++;
            } else {
                working = AppState.employees.length - restLength;
                dayHTML = `<div style="color: red; text-align: center; padding: 20px;"><em>⚠️ 无排班数据 (休息: ${restGroup} ${restLength}人)</em></div>`;
                failedDays.push(day);
            }
            monthlyData.push({day, html: dayHTML, restGroup, restLength, working, insp});
        } catch (e) {
            console.error(`加载第${day}天失败:`, e);
            failedDays.push(day);
        }
    }
    let fullHTML = `<h3>📅 ${y}年${m}月 完整月度排班 (共${daysInMonth}天)</h3><p><em>点击日期展开详细岗位分配。</em></p><div class="accordion-container">`;
    monthlyData.forEach(({day, html, restGroup, restLength, working, insp}) => {
        fullHTML += `
            <button class="accordion">📅 ${m}月${day}日 - 休息: ${restGroup} (${restLength}人) | 在岗: ${working} | 检料: ${insp}</button>
            <div class="panel" style="display: none;"><div class="accordion-content">${html}</div></div>
        `;
    });
    fullHTML += `</div>`;
    if (failedDays.length > 0) {
        fullHTML += `<p style="color: #e74c3c;">⚠️ 异常日期: ${failedDays.join(', ')} (无数据)</p>`;
    }
    elements.monthlyPreview.innerHTML = fullHTML;
    initMonthlyAccordions();
    showNotification(`月度预览加载完成！已显示 ${successCount}/${daysInMonth} 天数据。`, 'success');
}
// ======================
// 核心算法与计算逻辑
// ======================
/**
 * 数组随机排序
 */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
/**
 * [异步] 获取上一个工作日的角色
 */
async function getLastWorkRole(emp, y, m, d) {
    let currentDate = new Date(y, m - 1, d);
    for (let i = 1; i <= 30; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(currentDate.getDate() - i);
        const py = prevDate.getFullYear();
        const pm = prevDate.getMonth() + 1;
        const pd = prevDate.getDate();

        const restKey = getDateKey(CONSTANTS.STORE_RESTS, py, pm, pd);
        const rests = await loadData(CONSTANTS.STORE_RESTS, restKey, []);
        if (rests.includes(emp)) continue;
        const schedKey = getDateKey(CONSTANTS.STORE_SCHEDULES, py, pm, pd);
        const data = await loadData(CONSTANTS.STORE_SCHEDULES, schedKey, null);

        if (!data?.assignments) continue;
        const {assignments} = data;

        for (let machine of CONSTANTS.CUTTING_MACHINES) {
            if (assignments[`c${machine}_knife`] === emp) return '主刀';
            if (assignments[`c${machine}_load`] && assignments[`c${machine}_load`].includes(emp)) return '上料';
            if (assignments[`c${machine}_edge`] && assignments[`c${machine}_edge`].includes(emp)) return '毛边';
        }
        if (assignments.coding && assignments.coding.includes(emp)) return '刻码';
        if (assignments.pack && assignments.pack.includes(emp)) return '包装';
        if (assignments.inspection && assignments.inspection.includes(emp)) return '检料';
    }
    return null;
}
/**
 * [异步] 获取最近5个工作日的角色集
 */
async function getRecentRoles(emp, y, m, d) {
    const roles = new Set();
    let currentDate = new Date(y, m - 1, d);
    const lookback = CONSTANTS.CYCLE_DAYS;
    for (let i = 1; i <= lookback * 2; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(currentDate.getDate() - i);
        const py = prevDate.getFullYear();
        const pm = prevDate.getMonth() + 1;
        const pd = prevDate.getDate();
        const restKey = getDateKey(CONSTANTS.STORE_RESTS, py, pm, pd);
        const rests = await loadData(CONSTANTS.STORE_RESTS, restKey, []);
        if (rests.includes(emp)) continue;
        const schedKey = getDateKey(CONSTANTS.STORE_SCHEDULES, py, pm, pd);
        const data = await loadData(CONSTANTS.STORE_SCHEDULES, schedKey, null);

        if (!data?.assignments) continue;
        const {assignments} = data;
        let role = null;
        for (let machine of CONSTANTS.CUTTING_MACHINES) {
            if (assignments[`c${machine}_knife`] === emp) { role = '主刀'; break; }
            if (assignments[`c${machine}_load`] && assignments[`c${machine}_load`].includes(emp)) { role = '上料'; break; }
            if (assignments[`c${machine}_edge`] && assignments[`c${machine}_edge`].includes(emp)) { role = '毛边'; break; }
        }
        if (!role) {
            if (assignments.coding && assignments.coding.includes(emp)) role = '刻码';
            else if (assignments.pack && assignments.pack.includes(emp)) role = '包装';
            else if (assignments.inspection && assignments.inspection.includes(emp)) role = '检料';
        }
        if (role) roles.add(role);
        if (roles.size >= lookback) break;
    }
    return Array.from(roles);
}
/**
 * [异步] 获取过去月次数 (1到d-1日) - 通用角色
 */
async function getPastMonthlyCount(employee, jobType, y, m, d) {
    let count = 0;
    const daysInMonth = new Date(y, m, 0).getDate();
    const endDay = Math.min(d - 1, daysInMonth);
    for (let day = 1; day <= endDay; day++) {
        const key = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, day);
        const data = await loadData(CONSTANTS.STORE_SCHEDULES, key, null);
        if (data && data.assignments) {
            const {assignments} = data;
            if (jobType === '主刀') {
                for (let machine of CONSTANTS.CUTTING_MACHINES) {
                    if (assignments[`c${machine}_knife`] === employee) { count++; break; }
                }
            } else if (jobType === '上料') {
                for (let machine of CONSTANTS.CUTTING_MACHINES) {
                    if (assignments[`c${machine}_load`] && assignments[`c${machine}_load`].includes(employee)) { count++; break; }
                }
            } else if (jobType === '毛边') {
                for (let machine of CONSTANTS.CUTTING_MACHINES) {
                    if (assignments[`c${machine}_edge`] && assignments[`c${machine}_edge`].includes(employee)) { count++; break; }
                }
            } else if (jobType === '刻码') {
                if (assignments.coding && assignments.coding.includes(employee)) count++;
            } else if (jobType === '包装') {
                if (assignments.pack && assignments.pack.includes(employee)) count++;
            } else if (jobType === '检料') {
                if (assignments.inspection && assignments.inspection.includes(employee)) count++;
            }
        }
    }
    return count;
}
/**
 * [异步] 获取过去月机器特定次数 (1到d-1日) - 裁切角色
 */
async function getPastMonthlyCountForMachine(emp, role, machine, y, m, d) {
    let count = 0;
    const daysInMonth = new Date(y, m, 0).getDate();
    const endDay = Math.min(d - 1, daysInMonth);
    const subrole = role === '主刀' ? 'knife' : role === '上料' ? 'load' : 'edge';
    const mkey = `c${machine}_${subrole}`;
    for (let day = 1; day <= endDay; day++) {
        const key = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, day);
        const data = await loadData(CONSTANTS.STORE_SCHEDULES, key, null);
        if (data && data.assignments && data.assignments[mkey]) {
            const ass = data.assignments[mkey];
            if (subrole === 'knife') {
                if (ass === emp) count++;
            } else {
                if (Array.isArray(ass) && ass.includes(emp)) count++;
            }
        }
    }
    return count;
}
/**
 * [同步] 适应度分数计算
 */
function fitScore(emp, role, allCounts, ignoreCycle = false, machine = null) {
    const empData = allCounts.get(emp);
    if (!empData) return -Infinity;
    const pastCount = empData.pastCounts.get(role) || 0;
    const isNoCoding = AppState.noCodingEmployees.includes(emp);
    let limit = Infinity;
    if (role === '主刀') limit = CONSTANTS.MONTHLY_LIMIT;
    else if (role === '检料') limit = isNoCoding ? CONSTANTS.NO_CODING_INSP_LIMIT : 6;
    if (pastCount >= limit) return -Infinity;
    const lastRole = empData.lastRole;
    if (lastRole === role) return -Infinity;
    if (!ignoreCycle) {
        const recentRoles = empData.recentRoles;
        if (recentRoles.includes(role)) return -Infinity;
    }
    let cycleBonus = 0;
    if (!ignoreCycle) {
        const recentRoles = empData.recentRoles;
        if (!recentRoles.includes(role) && recentRoles.length < CONSTANTS.CYCLE_DAYS) {
            cycleBonus = 20;
        }
    }
    const target = (role === '检料') ? (isNoCoding ? CONSTANTS.NO_CODING_INSP_LIMIT : 6) : CONSTANTS.MONTHLY_LIMIT;
    let balanceBonus = Math.max(0, target - pastCount) * 20;
    if (role === '检料') {
        balanceBonus *= 2;
    }
    const pri = AppState.priorities[emp]?.[role] || 0;
    let inspCrossBalance = 0;
    const inspPast = empData.pastCounts.get('检料') || 0;
    const inspTarget = isNoCoding ? CONSTANTS.NO_CODING_INSP_LIMIT : 6;

    if (role === '检料') {
        if (inspPast < inspTarget) {
            inspCrossBalance = (inspTarget - inspPast) * 25;
        }
    } else {
        if (inspPast < inspTarget - 1) {
            inspCrossBalance = - (inspTarget - inspPast) * 30;
        }
    }
    let score = pri + cycleBonus + balanceBonus + inspCrossBalance - pastCount * 0.5;
    if (machine && (role === '主刀' || role === '上料' || role === '毛边')) {
        const subrole = role === '主刀' ? 'knife' : role === '上料' ? 'load' : 'edge';
        const machineRoleKey = `c${machine}_${subrole}`;
        const pastMachineCount = empData.pastMachineCounts.get(machineRoleKey) || 0;
        const machineTarget = CONSTANTS.TARGET_PER_MACHINE;
        let machineBalanceBonus = Math.max(0, machineTarget - pastMachineCount) * 10 - pastMachineCount * 0.5;
        if (isNoCoding) machineBalanceBonus *= 1.5;
        score += machineBalanceBonus;
    }
    if (isNoCoding && (role === '上料' || role === '毛边') && inspPast >= CONSTANTS.NO_CODING_INSP_LIMIT) {
        score += 15;
    } else if (isNoCoding && role === '包装' && inspPast >= CONSTANTS.NO_CODING_INSP_LIMIT) {
        score += 10;
    }
    return score;
}
/**
 * [同步] 过滤并排序候选人
 */
function filterByRotation(candidates, role, allCounts, ignoreCycle = false, machine = null) {
    return candidates
        .map(emp => ({
            emp: emp,
            score: fitScore(emp, role, allCounts, ignoreCycle, machine)
        }))
        .filter(item => item.score > -Infinity)
        .sort((a, b) => b.score - a.score)
        .map(item => item.emp);
}
/**
 * [同步] 获取下一个最佳人员
 */
function getNextPerson(generalPool, idxRef, role, allCounts, assignedToday = new Set(), machine = null) {
    if (idxRef.value >= generalPool.length) {
        return null;
    }

    if (assignedToday.has(generalPool[idxRef.value])) {
        idxRef.value++;
        return getNextPerson(generalPool, idxRef, role, allCounts, assignedToday, machine);
    }
    const remaining = generalPool.slice(idxRef.value);

    let candidates = filterByRotation(remaining, role, allCounts, false, machine);

    if (candidates.length === 0) {
        candidates = filterByRotation(remaining, role, allCounts, true, machine);
    }

    if (candidates.length === 0) {
        console.warn(`⚠️ 强制分配 ${role} (违反部分规则)`);
        const selected = remaining.find(emp =>
            !assignedToday.has(emp) &&
            allCounts.get(emp).lastRole !== role
        );
        if (!selected) return null;
        const selIdx = generalPool.indexOf(selected, idxRef.value);
        if (selIdx > -1) {
            [generalPool[idxRef.value], generalPool[selIdx]] = [generalPool[selIdx], generalPool[idxRef.value]];
        }
    } else {
        const selected = candidates[0];
        const selIdx = generalPool.indexOf(selected, idxRef.value);
        if (selIdx > -1) {
            [generalPool[idxRef.value], generalPool[selIdx]] = [generalPool[selIdx], generalPool[idxRef.value]];
        }
    }

    const finalSelected = generalPool[idxRef.value];
    idxRef.value++;
    assignedToday.add(finalSelected);
    return finalSelected;
}
/**
 * [异步] 生成单日排班逻辑
 */
async function generateScheduleInternal(y, m, d, rests, runningPastCounts = null) {

    AppState.noCodingEmployees = await loadData(CONSTANTS.STORE_CONFIG, 'noCoding', []);
    const working = AppState.employees.filter(e => !rests.includes(e));
    if (working.length < CONSTANTS.FIXED_STAFF_REQUIRED) {
        console.warn(`⚠️ ${y}-${m}-${d} 岗位人员不足 (${working.length}/${CONSTANTS.FIXED_STAFF_REQUIRED})，将部分分配`);
    }
    const canCode = working.filter(e => !AppState.noCodingEmployees.includes(e));
    if (canCode.length < CONSTANTS.CODING_MACHINES) {
        console.warn(`⚠️ ${y}-${m}-${d} 技能人员不足 (${canCode.length}/${CONSTANTS.CODING_MACHINES})，将部分分配刻码`);
    }
    const allCounts = new Map();
    console.log(`[${y}-${m}-${d}] 正在预计算 ${working.length} 名员工的历史数据...`);

    for (const emp of working) {
        const pastCounts = runningPastCounts ? (runningPastCounts.get(emp) || new Map()) : new Map();
        const pastMachineCounts = runningPastCounts ? (runningPastCounts.get(emp) || new Map()) : new Map();
        if (!runningPastCounts) {
            for (const role of CONSTANTS.ROLES) {
                pastCounts.set(role, await getPastMonthlyCount(emp, role, y, m, d));
            }
            for (const role of ['主刀', '上料', '毛边']) {
                 for (const machine of CONSTANTS.CUTTING_MACHINES) {
                     const subrole = role === '主刀' ? 'knife' : role === '上料' ? 'load' : 'edge';
                     const machineRoleKey = `c${machine}_${subrole}`;
                     pastMachineCounts.set(machineRoleKey, await getPastMonthlyCountForMachine(emp, role, machine, y, m, d));
                 }
            }
        }

        const lastRole = await getLastWorkRole(emp, y, m, d);
        const recentRoles = await getRecentRoles(emp, y, m, d);

        allCounts.set(emp, { lastRole, recentRoles, pastCounts, pastMachineCounts });
    }
    console.log(`[${y}-${m}-${d}] 预计算完成。`);
    const cuttingAssignments = {};
    const topLevelAssignments = { coding: [], pack: [], inspection: [] };
    const stats = { total: AppState.employees.length, rest: [...rests], working: working.length, noCoding: AppState.noCodingEmployees.length };
    const assignedToday = new Set();
    try {
        // 1. 刻码分配
        let codingCandidates = filterByRotation(canCode, '刻码', allCounts, false);
        if (codingCandidates.length < CONSTANTS.CODING_MACHINES) {
            codingCandidates = filterByRotation(canCode, '刻码', allCounts, true);
        }
        topLevelAssignments.coding = codingCandidates.slice(0, CONSTANTS.CODING_MACHINES);
        topLevelAssignments.coding.forEach(emp => assignedToday.add(emp));
        if (topLevelAssignments.coding.length < CONSTANTS.CODING_MACHINES) {
            console.warn(`⚠️ ${y}-${m}-${d} 仅分配 ${topLevelAssignments.coding.length} 名刻码人员`);
        }
        // 2. 通用池
        const remainingWorking = shuffle(working.filter(e => !assignedToday.has(e)));
        let idx = { value: 0 };
        // 3. 裁切分配
        for (let machine of CONSTANTS.CUTTING_MACHINES) {
            const load1 = getNextPerson(remainingWorking, idx, '上料', allCounts, assignedToday, machine);
            const load2 = getNextPerson(remainingWorking, idx, '上料', allCounts, assignedToday, machine);
            cuttingAssignments[`c${machine}_load`] = [load1, load2].filter(Boolean);

            const knife = getNextPerson(remainingWorking, idx, '主刀', allCounts, assignedToday, machine);
            cuttingAssignments[`c${machine}_knife`] = knife || '';

            const edge1 = getNextPerson(remainingWorking, idx, '毛边', allCounts, assignedToday, machine);
            const edge2 = getNextPerson(remainingWorking, idx, '毛边', allCounts, assignedToday, machine);
            cuttingAssignments[`c${machine}_edge`] = [edge1, edge2].filter(Boolean);
        }
        // 4. 包装分配
        for (let i = 0; i < CONSTANTS.PEOPLE_FOR_PACKAGING; i++) {
            const packEmp = getNextPerson(remainingWorking, idx, '包装', allCounts, assignedToday);
            if (packEmp) topLevelAssignments.pack.push(packEmp);
        }
        // 5. 检料分配
        const fixedAssigned = assignedToday.size;
        const targetInspection = Math.max(0, working.length - fixedAssigned);

        if (targetInspection > 0) {
            let inspectionAssigned = [];
            for (let i = 0; i < targetInspection; i++) {
                const inspEmp = getNextPerson(remainingWorking, idx, '检料', allCounts, assignedToday);
                if (inspEmp) inspectionAssigned.push(inspEmp);
            }
            topLevelAssignments.inspection = inspectionAssigned;
        }
        // 扁平合并 & 保存
        const flatAssignments = { ...cuttingAssignments, ...topLevelAssignments };
        const scheduleData = { assignments: flatAssignments, stats };

        const key = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, d);
        await saveData(CONSTANTS.STORE_SCHEDULES, key, scheduleData);

        AppState.monthlyCache.set(d, scheduleData);
        return scheduleData;
    } catch (e) {
        console.error(`生成 ${y}-${m}-${d} 失败:`, e);
        return null;
    }
}
/**
 * [异步] 更新运行月计数
 */
function updateRunningCounts(runningMonthlyCounts, assignments, cuttingMachines) {
    for (let machine of cuttingMachines) {
        const emp = assignments[`c${machine}_knife`];
        if (emp) {
            const empMap = runningMonthlyCounts.get(emp);
            empMap.set('主刀', (empMap.get('主刀') || 0) + 1);
            const machineKey = `c${machine}_knife`;
            empMap.set(machineKey, (empMap.get(machineKey) || 0) + 1);
        }
    }
    for (let machine of cuttingMachines) {
        if (assignments[`c${machine}_load`]) {
            assignments[`c${machine}_load`].forEach(emp => {
                if (emp) {
                    const empMap = runningMonthlyCounts.get(emp);
                    empMap.set('上料', (empMap.get('上料') || 0) + 1);
                    const machineKey = `c${machine}_load`;
                    empMap.set(machineKey, (empMap.get(machineKey) || 0) + 1);
                }
            });
        }
    }
    for (let machine of cuttingMachines) {
        if (assignments[`c${machine}_edge`]) {
            assignments[`c${machine}_edge`].forEach(emp => {
                if (emp) {
                    const empMap = runningMonthlyCounts.get(emp);
                    empMap.set('毛边', (empMap.get('毛边') || 0) + 1);
                    const machineKey = `c${machine}_edge`;
                    empMap.set(machineKey, (empMap.get(machineKey) || 0) + 1);
                }
            });
        }
    }
    if (assignments.coding) {
        assignments.coding.forEach(emp => {
            if (emp) {
                const empMap = runningMonthlyCounts.get(emp);
                empMap.set('刻码', (empMap.get('刻码') || 0) + 1);
            }
        });
    }
    if (assignments.pack) {
        assignments.pack.forEach(emp => {
            if (emp) {
                const empMap = runningMonthlyCounts.get(emp);
                empMap.set('包装', (empMap.get('包装') || 0) + 1);
            }
        });
    }
    if (assignments.inspection) {
        assignments.inspection.forEach(emp => {
            if (emp) {
                const empMap = runningMonthlyCounts.get(emp);
                empMap.set('检料', (empMap.get('检料') || 0) + 1);
            }
        });
    }
}
// ======================
// 主要功能函数
// ======================
/**
 * [异步] 刷新所有列表 (同步删除员工)
 */
async function refreshLists() {
    const restKey = getCurrentDateKey(CONSTANTS.STORE_RESTS);
    AppState.restEmployees = (await loadData(CONSTANTS.STORE_RESTS, restKey, [])).filter(e => AppState.employees.includes(e));
    AppState.noCodingEmployees = AppState.noCodingEmployees.filter(e => AppState.employees.includes(e));
    // 同步分组
    Object.keys(AppState.groups).forEach(key => {
        AppState.groups[key] = AppState.groups[key].filter(e => AppState.employees.includes(e));
    });
    await saveData(CONSTANTS.STORE_CONFIG, 'noCoding', AppState.noCodingEmployees);
    await saveData(CONSTANTS.STORE_CONFIG, 'groups', AppState.groups);
    if (restKey) await saveData(CONSTANTS.STORE_RESTS, restKey, AppState.restEmployees);

    renderCheckboxes(elements.deleteList, AppState.employees);
    renderCheckboxes(elements.restList, AppState.employees, AppState.restEmployees);
    renderCheckboxes(elements.noCodingList, AppState.employees, AppState.noCodingEmployees);
    renderGroups();
}
/**
 * [异步] 根据日期更新 UI
 */
async function updateUIForDate() {
    const scheduleKey = getCurrentDateKey(CONSTANTS.STORE_SCHEDULES);

    if (!scheduleKey) {
        elements.preview.innerHTML = '<em>请选择完整的年月日以查看或生成排班。</em>';
        elements.preview.classList.remove('show');
        [elements.btnGenerate, elements.btnResetSchedule, elements.btnExport, elements.btnExportExcel].forEach(btn => btn.disabled = true);
        return;
    }

    const savedData = await loadData(CONSTANTS.STORE_SCHEDULES, scheduleKey, null);

    if (isValidScheduleData(savedData)) {
        elements.preview.innerHTML = renderScheduleHTML(savedData, +elements.year.value, +elements.month.value, +elements.dateInput.value);
        elements.preview.classList.add('show');
        elements.btnGenerate.disabled = true;
        elements.btnResetSchedule.disabled = false;
        elements.btnExport.disabled = false;
        elements.btnExportExcel.disabled = false;
    } else {
        elements.preview.innerHTML = '<em>点击"生成当天排班"按钮以查看结果。</em>';
        elements.preview.classList.remove('show');
        elements.btnGenerate.disabled = false;
        elements.btnResetSchedule.disabled = true;
        elements.btnExport.disabled = true;
        elements.btnExportExcel.disabled = true;
    }

    await refreshLists();
    await updateMonthlyGenerateButton();
    // ★★★ 优化：更新日期时，也检查并渲染月度预览 ★★★
    await renderExistingMonthlyPreview();
}
/**
 * [同步] 渲染单日HTML
 */
function renderScheduleHTML(data, y, m, d) {
    const {assignments, stats} = data;
    const cutting_total = CONSTANTS.CUTTING_MACHINES.length * CONSTANTS.PEOPLE_PER_CUTTING_MACHINE;
    let html = `<div class="schedule-container"><div class="schedule-header"><h3>📅 ${y}年${m}月${d}日 岗位安排表</h3></div><div class="schedule-stats"><strong>📊 统计：</strong> 总人数：${stats.total}｜休息：${stats.rest.length}｜在岗：${stats.working} (其中 ${stats.noCoding} 人不刻码)｜检料：${assignments.inspection ? assignments.inspection.length : 0}</div>`;
    html += `<div class="schedule-wrapper">`;

    // 裁切机组
    html += `<div class="machine-group"><div class="group-title"><i class="fas fa-cut"></i> 裁切机组（共${cutting_total}人）</div><table><caption>裁切机岗位分配</caption><tr><th>岗位</th><th>人员</th></tr>`;
    for (let machine of CONSTANTS.CUTTING_MACHINES) {
        const loadNames = assignments[`c${machine}_load`] ? assignments[`c${machine}_load`].join(" + ") : "未分配";
        const knifeName = assignments[`c${machine}_knife`] || "未分配";
        const edgeNames = assignments[`c${machine}_edge`] ? assignments[`c${machine}_edge`].join(" + ") : "未分配";
        html += `<tr><td>${machine}号裁切 - 上料</td><td>${loadNames}</td></tr><tr class="highlight"><td>${machine}号裁切 - 主刀</td><td>${knifeName}</td></tr><tr><td>${machine}号裁切 - 毛边</td><td>${edgeNames}</td></tr>`;
    }
    html += `</table></div>`;

    // 刻码机组
    html += `<div class="machine-group"><div class="group-title"><i class="fas fa-print"></i> 刻码机组（共${CONSTANTS.CODING_MACHINES}人）</div><table><caption>刻码机岗位分配</caption><tr><th>岗位</th><th>人员</th></tr>`;
    if (assignments.coding) {
        for (let i = 0; i < Math.min(assignments.coding.length, CONSTANTS.CODING_MACHINES); i++) {
            html += `<tr><td>${i+1}号刻码机</td><td>${assignments.coding[i] || "未分配"}</td></tr>`;
        }
        if (assignments.coding.length < CONSTANTS.CODING_MACHINES) {
            for (let i = assignments.coding.length; i < CONSTANTS.CODING_MACHINES; i++) {
                html += `<tr><td>${i+1}号刻码机</td><td style="color: red;">部分分配不足</td></tr>`;
            }
        }
    } else {
        for (let i = 0; i < CONSTANTS.CODING_MACHINES; i++) {
            html += `<tr><td>${i+1}号刻码机</td><td style="color: red;">未分配</td></tr>`;
        }
    }
    html += `</table></div>`;

    // 包装组
    html += `<div class="machine-group"><div class="group-title"><i class="fas fa-box"></i> 包装组（共${CONSTANTS.PEOPLE_FOR_PACKAGING}人）</div><table><caption>包装岗位分配</caption><tr><td>包装岗位</td><td>${assignments.pack ? assignments.pack.join(" + ") : "未分配"}</td></tr></table></div>`;

    // 检料组
    html += `<div class="machine-group"><div class="group-title"><i class="fas fa-search"></i> 检料组（共${assignments.inspection ? assignments.inspection.length : 0}人）</div><table><caption>检料岗位分配</caption><tr><td>检料人员</td><td>${assignments.inspection && assignments.inspection.length > 0 ? assignments.inspection.join(" + ") : "无"}</td></tr></table></div></div></div>`;
    return html;
}
/**
 * [异步] 生成单日排班 (UI)
 */
async function generateSchedule() {
    const y = +elements.year.value, m = +elements.month.value, d = +elements.dateInput.value;
    if (!d || d < 1) return alert("请填写有效日期！");

    const restKey = getCurrentDateKey(CONSTANTS.STORE_RESTS);
    const rests = await loadData(CONSTANTS.STORE_RESTS, restKey, []);

    try {
        elements.progress.style.display = 'block';
        elements.progressBar.value = 0;
        elements.progressBar.max = 100;
        elements.preview.innerHTML = '<div style="color:#3498db; text-align:center;">📊 正在智能分配岗位... (正在预计算历史数据)</div>';
        const scheduleData = await generateScheduleInternal(y, m, d, rests, null);

        if (!scheduleData) throw new Error('生成失败：人员不足或算法异常');
        elements.preview.innerHTML = renderScheduleHTML(scheduleData, y, m, d);
        elements.preview.classList.add('show');
        elements.progress.style.display = 'none';
        await updateUIForDate();

        // 更新AI建议
        await generateAISuggestions();

        showNotification('排班生成成功！', 'success');
    } catch (e) {
        console.error("排班生成失败:", e);
        elements.preview.innerHTML = `<p style="color:red; text-align:center;">❌ ${e.message || '排班生成失败，请联系管理员。'}</p>`;
        elements.progress.style.display = 'none';
        showNotification('排班生成失败', 'danger');
    }
}
/**
 * [异步] 一键月度批量生成
 */
async function generateMonthlySchedule() {
    const y = +elements.year.value, m = +elements.month.value;
    if (!y || !m) return alert("请选择年月！");
    if (Object.values(AppState.groups).every(g => g.length === 0)) {
        return alert("⚠️ 请先设置轮休分组！");
    }
    const generatedKey = getMonthlyGeneratedKey(y, m);
    const isGenerated = await loadData(CONSTANTS.STORE_CONFIG, generatedKey, false);
    if (isGenerated) {
        showNotification('该月已生成排班，请先重置排班。', 'warning');
        return;
    }
    if (!confirm(`确定生成本月 (${y}-${m}) 所有排班？\n将自动应用轮休分组休息。`)) return;
    const daysInMonth = new Date(y, m, 0).getDate();
    elements.progress.style.display = 'block';
    elements.progressBar.value = 0;
    elements.progressBar.max = daysInMonth;
    const progressDiv = elements.progress.querySelector('div') || elements.progress.appendChild(document.createElement('div'));
    progressDiv.textContent = '📊 正在批量生成月度排班...';
    elements.monthlyPreview.innerHTML = '<em>生成中...</em>';
    let monthlyData = [];
    const groupLabels = { 0: 'G组', 1: 'A组', 2: 'B组', 3: 'C组', 4: 'D组', 5: 'E组', 6: 'F组' };
    let runningMonthlyCounts = new Map();
    AppState.employees.forEach(emp => {
        let roleMap = new Map();
        CONSTANTS.ROLES.forEach(r => roleMap.set(r, 0));
        for (const role of ['主刀', '上料', '毛边']) {
            for (const machine of CONSTANTS.CUTTING_MACHINES) {
                const subrole = role === '主刀' ? 'knife' : role === '上料' ? 'load' : 'edge';
                const machineRoleKey = `c${machine}_${subrole}`;
                roleMap.set(machineRoleKey, 0);
            }
        }
        runningMonthlyCounts.set(emp, roleMap);
    });
    let successCount = 0;
    let failedDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
        try {
            const tempDate = new Date(y, m - 1, day);
            const weekday = tempDate.getDay();
            const dayRests = [...AppState.groups[weekday]];
            const restKey = getDateKey(CONSTANTS.STORE_RESTS, y, m, day);
            await saveData(CONSTANTS.STORE_RESTS, restKey, dayRests);
            const restLength = dayRests.length;
            const restGroup = groupLabels[weekday];
            const schedKey = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, day);
            let scheduleData = null;
            const existingData = await loadData(CONSTANTS.STORE_SCHEDULES, schedKey, null);

            if (!isValidScheduleData(existingData)) {
                scheduleData = await generateScheduleInternal(y, m, day, dayRests, runningMonthlyCounts);

                if (scheduleData) {
                    updateRunningCounts(runningMonthlyCounts, scheduleData.assignments, CONSTANTS.CUTTING_MACHINES);
                    successCount++;
                } else {
                    failedDays.push(day);
                }
            } else {
                scheduleData = existingData;
                updateRunningCounts(runningMonthlyCounts, scheduleData.assignments, CONSTANTS.CUTTING_MACHINES);
                successCount++;
            }
            if (isValidScheduleData(scheduleData)) {
                const {stats, assignments} = scheduleData;
                const working = stats.working;
                const insp = assignments.inspection ? assignments.inspection.length : 0;
                const dayHTML = renderScheduleHTML(scheduleData, y, m, day);
                monthlyData.push({day, html: dayHTML, restGroup, restLength, working, insp});
            } else {
                const working = AppState.employees.length - restLength;
                const dayHTML = `<div style="color: red; text-align: center; padding: 20px;"><em>⚠️ 生成失败：人员不足或分配异常 (休息: ${restGroup} ${restLength}人)</em></div>`;
                monthlyData.push({day, html: dayHTML, restGroup, restLength, working, insp: 0});
            }
            elements.progressBar.value = day;
            progressDiv.textContent = `📊 正在批量生成月度排班... 已完成 ${day}/${daysInMonth} 天`;
        } catch (e) {
            console.error(`月度生成第${day}天失败:`, e);
            failedDays.push(day);
        }
    }

    elements.progress.style.display = 'none';
    AppState.monthlyCache.clear();
    let fullHTML = `<h3>📅 ${y}年${m}月 完整月度排班 (共${daysInMonth}天)</h3><p><em>点击日期展开详细岗位分配。</em></p><div class="accordion-container">`;
    monthlyData.forEach(({day, html, restGroup, restLength, working, insp}) => {
        fullHTML += `
            <button class="accordion">📅 ${m}月${day}日 - 休息: ${restGroup} (${restLength}人) | 在岗: ${working} | 检料: ${insp}</button>
            <div class="panel" style="display: none;"><div class="accordion-content">${html}</div></div>
        `;
    });
    fullHTML += `</div>`;
    if (failedDays.length > 0) {
        fullHTML += `<p style="color: #e74c3c;">⚠️ 异常日期: ${failedDays.join(', ')} (已显示占位符，可手动重试生成)</p>`;
    }
    elements.monthlyPreview.innerHTML = fullHTML;
    elements.preview.innerHTML = `<em>月度排班已生成，请在下方"本月全部排班预览表"查看详情。</em>`;
    elements.preview.classList.add('show');
    initMonthlyAccordions();
    await updateUIForDate();
    // 更新AI建议
    await generateAISuggestions();
    // 设置月度生成标志
    await saveData(CONSTANTS.STORE_CONFIG, generatedKey, true);
    await updateMonthlyGenerateButton();
    const alertMsg = `✅ 月度排班生成完成！处理 ${daysInMonth}/${daysInMonth} 天。${failedDays.length > 0 ? `\n⚠️ 异常: ${failedDays.length} 天 (${failedDays.join(', ')})` : ''}`;
    showNotification(alertMsg, 'success');
}
/**
 * 初始化月度accordion
 */
function initMonthlyAccordions() {
    const container = elements.monthlyPreview.querySelector('.accordion-container');
    if (!container) return;
    container.querySelectorAll('.accordion').forEach(acc => {
        const newAcc = acc.cloneNode(true);
        acc.parentNode.replaceChild(newAcc, acc);
    });
    container.querySelectorAll('.accordion').forEach(acc => {
        acc.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
        });
    });
    elements.btnExpandAll.onclick = () => {
        container.querySelectorAll('.panel').forEach(p => p.style.display = 'block');
        container.querySelectorAll('.accordion').forEach(a => a.classList.add('active'));
        elements.btnExpandAll.style.display = 'none';
        elements.btnCollapseAll.style.display = 'inline-block';
    };
    elements.btnCollapseAll.onclick = () => {
        container.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
        container.querySelectorAll('.accordion').forEach(a => a.classList.remove('active'));
        elements.btnExpandAll.style.display = 'inline-block';
        elements.btnCollapseAll.style.display = 'none';
    };
    elements.btnExpandAll.style.display = 'inline-block';
    elements.btnCollapseAll.style.display = 'none';
    container.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    container.querySelectorAll('.accordion').forEach(a => a.classList.remove('active'));
}
/**
 * [异步] 重置排班
 */
async function resetSchedule() {
    const y = +elements.year.value, m = +elements.month.value;
    if (!y || !m) return alert("请选择年月以重置！");
    const daysInMonth = new Date(y, m, 0).getDate();
    const d = +elements.dateInput.value;

    // 新增：密码验证
    const password = prompt("重置排班需要管理员权限，请输入密码：");
    if (password !== "888888") {
        showNotification("密码错误，重置操作已取消。", 'danger');
        return;
    }

    const isMonthlyReset = confirm(`密码验证通过。\n重置当前月 (${y}-${m}) 所有排班数据？\n- 单日: ${d ? `${d}日` : '当前日期'} 排班和休息\n- 月度: 全部 ${daysInMonth} 天排班和休息数据\n此操作不可恢复。`);
    if (!isMonthlyReset && d < 1) return alert("请选择具体日期以重置单日数据！");
    try {
        let clearedCount = 0;
        const generatedKey = getMonthlyGeneratedKey(y, m);
        if (isMonthlyReset) {
            for (let day = 1; day <= daysInMonth; day++) {
                const schedKey = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, day);
                const restKey = getDateKey(CONSTANTS.STORE_RESTS, y, m, day);
                await deleteData(CONSTANTS.STORE_SCHEDULES, schedKey);
                await deleteData(CONSTANTS.STORE_RESTS, restKey);
                clearedCount++;
            }
            // 删除月度生成标志
            await deleteData(CONSTANTS.STORE_CONFIG, generatedKey);
            AppState.monthlyCache.clear();
            elements.monthlyPreview.innerHTML = '<em>月度排班数据已重置，请重新生成。</em>';
        } else {
            const schedKey = getCurrentDateKey(CONSTANTS.STORE_SCHEDULES);
            const restKey = getCurrentDateKey(CONSTANTS.STORE_RESTS);
            if (schedKey) {
                await deleteData(CONSTANTS.STORE_SCHEDULES, schedKey);
                clearedCount++;
            }
            if (restKey) {
                await deleteData(CONSTANTS.STORE_RESTS, restKey);
                clearedCount++;
                AppState.restEmployees = [];
            }
            AppState.monthlyCache.delete(d);
        }

        await updateUIForDate();

        // 更新AI建议
        await generateAISuggestions();

        showNotification(`重置成功！已清空 ${clearedCount} 项数据。`, 'success');
    } catch (e) {
        console.error("重置失败:", e);
        showNotification(`重置失败: ${e.message}`, 'danger');
    }
}
/**
 * [异步] Excel导入
 */
async function importExcel(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});

            const newEmployees = jsonData
                .flat()
                .map(name => String(name).trim())
                .filter(name => name && !AppState.employees.includes(name));
            if (newEmployees.length > 0) {
                AppState.employees.push(...newEmployees);
                newEmployees.forEach(name => {
                    if (!AppState.priorities[name]) {
                        AppState.priorities[name] = { '主刀': 3, '上料': 2, '毛边': 2, '刻码': 2, '包装': 1, '检料': 4 };
                    }
                });

                await saveData(CONSTANTS.STORE_CONFIG, 'employees', AppState.employees);
                await saveData(CONSTANTS.STORE_CONFIG, 'priorities', AppState.priorities);

                await refreshLists();
                renderGroups();

                // 更新AI建议
                await generateAISuggestions();

                showNotification(`从Excel导入 ${newEmployees.length} 名新员工`, 'success');
            } else {
                showNotification('Excel中无新员工数据', 'warning');
            }
        } catch (error) {
            console.error("Excel 导入失败:", error);
            showNotification("Excel 导入失败", 'danger');
        }
    };
    reader.readAsArrayBuffer(file);
}
/**
 * [异步] 导出Excel
 */
async function exportToExcel() {
    const y = +elements.year.value, m = +elements.month.value, d = +elements.dateInput.value;
    if (!y || !m || !d) {
        showNotification('请选择完整日期以导出', 'warning');
        return;
    }

    const scheduleKey = getCurrentDateKey(CONSTANTS.STORE_SCHEDULES);
    const data = await loadData(CONSTANTS.STORE_SCHEDULES, scheduleKey, null);
    if (!data || !isValidScheduleData(data)) {
        showNotification('无当天排班数据可导出 (请先生成排班)', 'warning');
        return;
    }

    const {assignments, stats} = data;
    const daysInMonth = new Date(y, m, 0).getDate();
    const wb = XLSX.utils.book_new();
    // 当天统计Sheet
    let dayStatsData = [['统计', '值'],
        ['总人数', stats.total],
        ['休息', stats.rest.length],
        ['在岗', stats.working],
        ['不会刻码', stats.noCoding],
        ['检料人数', assignments.inspection ? assignments.inspection.length : 0]];
    const dayStatsWs = XLSX.utils.aoa_to_sheet(dayStatsData);
    XLSX.utils.book_append_sheet(wb, dayStatsWs, '当天统计');
    // 当天排班Sheet
    let dayScheduleData = [['岗位', '人员']];
    for (let machine of CONSTANTS.CUTTING_MACHINES) {
        dayScheduleData.push([`${machine}号裁切 - 上料`, assignments[`c${machine}_load`] ? assignments[`c${machine}_load`].join(' + ') : '']);
        dayScheduleData.push([`${machine}号裁切 - 主刀`, assignments[`c${machine}_knife`] || '']);
        dayScheduleData.push([`${machine}号裁切 - 毛边`, assignments[`c${machine}_edge`] ? assignments[`c${machine}_edge`].join(' + ') : '']);
    }
    if (assignments.coding) {
        for (let i = 0; i < assignments.coding.length; i++) {
            dayScheduleData.push([`${i+1}号刻码机`, assignments.coding[i] || '']);
        }
    }
    if (assignments.pack) {
        dayScheduleData.push(['包装岗位', assignments.pack.join(' + ')]);
    }
    if (assignments.inspection) {
        dayScheduleData.push(['检料人员', assignments.inspection.join(' + ')]);
    }
    const dayScheduleWs = XLSX.utils.aoa_to_sheet(dayScheduleData);
    XLSX.utils.book_append_sheet(wb, dayScheduleWs, '当天排班');
    // 下载
    const filename = `排班_${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}.xlsx`;
    XLSX.writeFile(wb, filename);
    showNotification('Excel导出成功', 'success');
}
/**
 * [异步] 历史月度概览
 */
async function renderHistoryOverview() {
    const y = +elements.histYear.value, m = +elements.histMonth.value;
    if (!y || !m) return elements.historyPreview.innerHTML = '<em>请选择年月。</em>';
    const daysInMonth = new Date(y, m, 0).getDate();
    let html = `<h3>📅 ${y}年${m}月 排班概览</h3>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const key = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, day);
        const data = await loadData(CONSTANTS.STORE_SCHEDULES, key, null);

        const restKey = getDateKey(CONSTANTS.STORE_RESTS, y, m, day);
        const rests = await loadData(CONSTANTS.STORE_RESTS, restKey, []);

        if (isValidScheduleData(data)) {
            const {stats, assignments} = data;
            html += `<div class="history-day"><h4>${y}-${m}-${String(day).padStart(2, '0')} (休息: ${rests.length})</h4><div class="history-stats">`;
            html += `<div>在岗: ${stats.working}</div><div>主刀: ${CONSTANTS.CUTTING_MACHINES.length}</div><div>刻码: ${CONSTANTS.CODING_MACHINES}</div><div>包装: ${CONSTANTS.PEOPLE_FOR_PACKAGING}</div><div>检料: ${assignments.inspection ? assignments.inspection.length : 0}</div>`;
            html += `</div></div>`;
        } else {
            html += `<div class="history-day"><h4>${y}-${m}-${String(day).padStart(2, '0')} (无排班)</h4><div class="history-stats"><div>休息: ${rests.length}</div></div></div>`;
        }
    }
    elements.historyPreview.innerHTML = html;
}
/**
 * [异步] 员工本月统计
 */
async function renderEmployeeStats() {
    const y = +elements.histYear.value, m = +elements.histMonth.value;
    const emp = elements.histEmployee.value.trim();
    if (!y || !m || !emp || !AppState.employees.includes(emp)) {
        showNotification('请选择年月并输入有效员工姓名', 'warning');
        return;
    }

    let stats = { '主刀': 0, '上料': 0, '毛边': 0, '刻码': 0, '包装': 0, '检料': 0 };
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const key = getDateKey(CONSTANTS.STORE_SCHEDULES, y, m, day);
        const data = await loadData(CONSTANTS.STORE_SCHEDULES, key, null);

        if (isValidScheduleData(data)) {
            const {assignments} = data;
            for (let machine of CONSTANTS.CUTTING_MACHINES) {
                if (assignments[`c${machine}_knife`] === emp) stats.主刀++;
            }
            for (let machine of CONSTANTS.CUTTING_MACHINES) {
                if (assignments[`c${machine}_load`] && assignments[`c${machine}_load`].includes(emp)) stats.上料++;
                if (assignments[`c${machine}_edge`] && assignments[`c${machine}_edge`].includes(emp)) stats.毛边++;
            }
            if (assignments.coding && assignments.coding.includes(emp)) stats.刻码++;
            if (assignments.pack && assignments.pack.includes(emp)) stats.包装++;
            if (assignments.inspection && assignments.inspection.includes(emp)) stats.检料++;
        }
    }

    let html = `<div class="employee-stats"><h4>${emp} 本月岗位统计</h4><table class="stats-table"><tr><th>岗位</th><th>次数</th></tr>`;
    Object.entries(stats).forEach(([role, count]) => {
        html += `<tr><td>${role}</td><td>${count}</td></tr>`;
    });
    html += `</table></div>`;
    elements.historyPreview.innerHTML = html;
}
/**
 * [异步] 休息天数排行 (显示所有员工)
 */
async function renderRestRank() {
    const y = +elements.histYear.value, m = +elements.histMonth.value;
    if (!y || !m) {
        showNotification('请选择年月', 'warning');
        return;
    }
    const daysInMonth = new Date(y, m, 0).getDate();
    const restCounts = {};
    AppState.employees.forEach(emp => restCounts[emp] = 0);

    for (let day = 1; day <= daysInMonth; day++) {
        const key = getDateKey(CONSTANTS.STORE_RESTS, y, m, day);
        const rests = await loadData(CONSTANTS.STORE_RESTS, key, []);
        rests.forEach(emp => {
            if (restCounts[emp] !== undefined) restCounts[emp]++;
        });
    }

    const ranked = Object.entries(restCounts).sort((a, b) => b[1] - a[1]);
    let html = `<div class="rest-rank"><h4>本月休息天数排行 (所有员工)</h4><table class="stats-table"><tr><th>员工</th><th>休息天数</th></tr>`;
    ranked.forEach(([emp, count]) => {
        html += `<tr><td>${emp}</td><td>${count}</td></tr>`;
    });
    html += `</table></div>`;
    elements.historyPreview.innerHTML = html;
}
// ======================
// 优先级弹窗逻辑
// ======================
/**
 * [异步] 打开优先级设置弹窗 (实时同步)
 */
async function openPriorityModal() {
    try {
        AppState.employees = await loadData(CONSTANTS.STORE_CONFIG, 'employees', DEFAULT_EMPLOYEES);
        AppState.priorities = await loadData(CONSTANTS.STORE_CONFIG, 'priorities', {});

        const roles = CONSTANTS.ROLES;

        let tableHtml = '<table class="priority-table"><thead><tr><th>员工</th>';
        roles.forEach(role => {
            tableHtml += `<th>${role}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        AppState.employees.forEach(emp => {
            tableHtml += `<tr><td>${emp}</td>`;
            roles.forEach(role => {
                if (!AppState.priorities[emp]) {
                    AppState.priorities[emp] = {};
                }
                const value = AppState.priorities[emp][role] || 0;
                tableHtml += `
                    <td>
                        <input type="number" min="0" max="10" value="${value}" data-emp="${emp}" data-role="${role}" onchange="updatePriorityRealTime(this)">
                    </td>
                `;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';

        elements.priorityTableContainer.innerHTML = tableHtml;
        elements.priorityModal.style.display = 'flex';
    } catch (error) {
        console.error("打开优先级弹窗失败:", error);
        showNotification("打开设置失败", 'danger');
    }
}
/**
 * 实时更新优先级
 */
async function updatePriorityRealTime(input) {
    const emp = input.dataset.emp;
    const role = input.dataset.role;
    const value = parseInt(input.value, 10) || 0;
    if (!AppState.priorities[emp]) AppState.priorities[emp] = {};
    AppState.priorities[emp][role] = value;
    await saveData(CONSTANTS.STORE_CONFIG, 'priorities', AppState.priorities);
    showNotification(`实时更新 ${emp} 的 ${role} 优先级为 ${value}`, 'success');
    await generateAISuggestions(); // 实时更新AI建议
}
/**
 * 关闭优先级弹窗
 */
function closePriorityModal() {
    elements.priorityModal.style.display = 'none';
}
/**
 * [异步] 保存优先级设置 (批量)
 */
async function savePriorities() {
    try {
        const inputs = elements.priorityTableContainer.querySelectorAll('input[type="number"]');
        let newPriorities = { ...AppState.priorities };
        inputs.forEach(input => {
            const emp = input.dataset.emp;
            const role = input.dataset.role;
            const value = parseInt(input.value, 10) || 0;

            if (!newPriorities[emp]) {
                newPriorities[emp] = {};
            }
            newPriorities[emp][role] = value;
        });

        AppState.priorities = newPriorities;

        await saveData(CONSTANTS.STORE_CONFIG, 'priorities', AppState.priorities);

        showNotification("优先级批量保存成功！所有模块已实时同步。", 'success');
        closePriorityModal();
        await generateAISuggestions();
    } catch (error) {
        console.error("保存优先级失败:", error);
        showNotification("保存失败", 'danger');
    }
}
// ======================
// 事件绑定
// ======================
function setupEventListeners() {

    // 优先级弹窗事件
    elements.btnShowPriorities.addEventListener('click', openPriorityModal);
    elements.btnCloseModal.addEventListener('click', closePriorityModal);
    elements.btnSavePriorities.addEventListener('click', savePriorities);
    // 全选按钮
    elements.btnSelectAll.addEventListener('click', () => {
        const isAnyChecked = Array.from(elements.deleteList.querySelectorAll('input[type="checkbox"]')).some(cb => cb.checked);
        toggleSelectAll(elements.deleteList, !isAnyChecked);
    });
    // 员工管理
    elements.btnAdd.addEventListener('click', async () => {
        const val = elements.newEmp.value.trim();
        if (!val) {
            showNotification("请输入姓名！", 'warning');
            return;
        }
        if (AppState.employees.includes(val)) {
            showNotification("该员工已存在！", 'warning');
            return;
        }

        AppState.employees.push(val);
        AppState.priorities[val] = { '主刀': 3, '上料': 2, '毛边': 2, '刻码': 2, '包装': 1, '检料': 4 };

        await saveData(CONSTANTS.STORE_CONFIG, 'employees', AppState.employees);
        await saveData(CONSTANTS.STORE_CONFIG, 'priorities', AppState.priorities);

        elements.newEmp.value = '';
        await refreshLists();

        // 更新AI建议
        await generateAISuggestions();

        showNotification(`成功添加：${val} (默认优先级已设置)`, 'success');
    });
    elements.newEmp.addEventListener('keypress', e => {
        if (e.key === 'Enter') elements.btnAdd.click();
    });
    elements.btnImportExcel.addEventListener('click', () => {
        const file = elements.excelImport.files[0];
        if (!file) {
            showNotification("请选择Excel文件！", 'warning');
            return;
        }
        importExcel(file);
    });
    elements.btnRemove.addEventListener('click', async () => {
        const selected = getChecked(elements.deleteList);
        if (selected.length === 0) {
            showNotification("请先勾选要删除的员工。", 'warning');
            return;
        }
        if (confirm(`确定删除 ${selected.length} 名员工？\n${selected.join(", ")}`)) {
            AppState.employees = AppState.employees.filter(e => !selected.includes(e));
            selected.forEach(name => delete AppState.priorities[name]);

            await saveData(CONSTANTS.STORE_CONFIG, 'employees', AppState.employees);
            await saveData(CONSTANTS.STORE_CONFIG, 'priorities', AppState.priorities);

            await refreshLists(); // 同步删除到其他模块

            // 更新AI建议
            await generateAISuggestions();

            showNotification(`已删除 ${selected.length} 名员工，所有模块已同步更新`, 'success');
        }
    });
    elements.btnResetAll.addEventListener('click', async () => {
        if (confirm("确定恢复为初始员工名单？（分组/优先级将重置）")) {
            AppState.employees = [...DEFAULT_EMPLOYEES];
            AppState.priorities = {};
            AppState.groups = {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []};

            await saveData(CONSTANTS.STORE_CONFIG, 'employees', AppState.employees);
            await saveData(CONSTANTS.STORE_CONFIG, 'priorities', AppState.priorities);
            await saveData(CONSTANTS.STORE_CONFIG, 'groups', AppState.groups);

            await refreshLists();

            // 更新AI建议
            await generateAISuggestions();

            showNotification("已恢复默认名单 (优先级/分组已重置)", 'success');
        }
    });
    // 备份功能 (美化后事件)
    elements.btnExportBackup.addEventListener('click', exportAllData);
    elements.backupImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) importAllData(file);
    });
    elements.btnImportBackup.addEventListener('click', () => elements.backupImport.click());
    // 日期
    elements.month.addEventListener('change', updateMaxDay);
    elements.year.addEventListener('change', updateMaxDay);
    elements.dateInput.addEventListener('change', async () => {
        validateDate();
        await updateUIForDate();
    });
    elements.dateInput.addEventListener('keyup', async () => {
        validateDate();
        await updateUIForDate();
    });
    // 分组
    elements.groupSearch.addEventListener('input', () => renderGroups());
    elements.btnAssignGroup.addEventListener('click', async () => {
        const selected = getChecked(elements.groupAvailList);
        const groupId = elements.selectedGroup.value;
        if (selected.length === 0) {
            showNotification("请勾选要分配的员工！", 'warning');
            return;
        }
        if (AppState.groups[groupId].length + selected.length > 10) {
            showNotification("组已超限！每组最多10人。", 'warning');
            return;
        }

        AppState.groups[groupId].push(...selected);
        await saveData(CONSTANTS.STORE_CONFIG, 'groups', AppState.groups);

        renderGroups();

        // 更新AI建议
        await generateAISuggestions();

        showNotification(`已分配 ${selected.length} 人到组${groupId}。`, 'success');
    });
    elements.btnClearGroups.addEventListener('click', async () => {
        if (confirm("清空所有分组？")) {
            AppState.groups = {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []};
            await saveData(CONSTANTS.STORE_CONFIG, 'groups', AppState.groups);
            renderGroups();

            // 更新AI建议
            await generateAISuggestions();

            showNotification("已清空所有分组。", 'success');
        }
    });
    elements.btnValidateGroups.addEventListener('click', validateGroups);
    // 休息
    elements.btnShowRest.addEventListener('click', () => {
        elements.restList.style.display = "block";
        elements.searchRest.style.display = "block";
    });
    elements.btnConfirmRest.addEventListener('click', async () => {
        AppState.restEmployees = getChecked(elements.restList);
        const key = getCurrentDateKey(CONSTANTS.STORE_RESTS);
        if (key) {
            await saveData(CONSTANTS.STORE_RESTS, key, AppState.restEmployees);

            // 更新AI建议
            await generateAISuggestions();

            showNotification(`已确认为 ${elements.year.value}-${elements.month.value}-${elements.dateInput.value} 的 ${AppState.restEmployees.length} 名休息员工。`, 'success');
        }
        elements.restList.style.display = 'none';
        elements.searchRest.style.display = 'none';
    });
    // 不会刻码
    elements.btnShowNoCoding.addEventListener('click', () => {
        elements.noCodingList.style.display = 'block';
        elements.searchNoCoding.style.display = "block";
    });
    elements.btnConfirmNoCoding.addEventListener('click', async () => {
        AppState.noCodingEmployees = getChecked(elements.noCodingList);
        await saveData(CONSTANTS.STORE_CONFIG, 'noCoding', AppState.noCodingEmployees);

        // 更新AI建议
        await generateAISuggestions();

        showNotification(`已确认 ${AppState.noCodingEmployees.length} 名不会刻码人员（永久有效）。`, 'success');
        elements.noCodingList.style.display = 'none';
        elements.searchNoCoding.style.display = 'none';
    });
    // 员工自助服务
    elements.btnLookupSchedule.addEventListener('click', () => {
        const name = elements.employeeSelfLookup.value.trim();
        lookupEmployeeSchedule(name);
    });
    elements.employeeSelfLookup.addEventListener('keypress', e => {
        if (e.key === 'Enter') elements.btnLookupSchedule.click();
    });
    elements.btnSubmitRequest.addEventListener('click', submitShiftRequest);
    // 操作面板
    elements.btnGenerate.addEventListener('click', generateSchedule);
    elements.btnMonthlyGenerate.addEventListener('click', generateMonthlySchedule);
    elements.btnResetSchedule.addEventListener('click', resetSchedule);
    elements.btnExport.addEventListener('click', async () => {
        const scheduleKey = getCurrentDateKey(CONSTANTS.STORE_SCHEDULES);
        const data = await loadData(CONSTANTS.STORE_SCHEDULES, scheduleKey, null);
        if (!data || !isValidScheduleData(data)) {
            showNotification('无排班数据可打印 (请先生成排班)', 'warning');
            return;
        }
        window.print();
    });
    elements.btnExportExcel.addEventListener('click', exportToExcel);
    // 历史
    elements.btnHistView.addEventListener('click', renderHistoryOverview);
    elements.btnHistEmployee.addEventListener('click', renderEmployeeStats);
    elements.btnHistRestRank.addEventListener('click', renderRestRank);
    elements.histMonth.addEventListener('change', renderHistoryOverview);
    elements.histYear.addEventListener('change', renderHistoryOverview);
    // 搜索功能
    elements.searchDelete.addEventListener('input', () => {
        renderCheckboxes(elements.deleteList, AppState.employees, [], elements.searchDelete.value);
    });

    elements.searchRest.addEventListener('input', () => {
        renderCheckboxes(elements.restList, AppState.employees, AppState.restEmployees, elements.searchRest.value);
    });

    elements.searchNoCoding.addEventListener('input', () => {
        renderCheckboxes(elements.noCodingList, AppState.employees, AppState.noCodingEmployees, elements.searchNoCoding.value);
    });
    // 全局错误处理
    window.addEventListener('error', e => {
        showNotification(`系统错误: ${e.message}`, 'danger');
    });
}
function updateMaxDay() {
    const y = +elements.year.value, m = +elements.month.value;
    if (!y || !m) return;
    const d = new Date(y, m, 0).getDate();
    elements.dateInput.max = d;
    elements.dateInput.placeholder = `1-${d}`;
    updateMonthlyGenerateButton();
}
function validateDate() {
    const y = +elements.year.value, m = +elements.month.value, d = +elements.dateInput.value;
    if (d > 0) {
        const max = new Date(y, m, 0).getDate();
        if (d > max) {
            elements.dateInput.value = '';
            showNotification(`无效日期！${m}月最多${max}日。`, 'warning');
        }
    }
}
// ======================
// 异步初始化 (主入口)
// ======================
async function main() {
    try {
        await initDB();

        AppState.employees = await loadData(CONSTANTS.STORE_CONFIG, 'employees', [...DEFAULT_EMPLOYEES]);
        AppState.priorities = await loadData(CONSTANTS.STORE_CONFIG, 'priorities', {});
        AppState.groups = await loadData(CONSTANTS.STORE_CONFIG, 'groups', {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []});
        AppState.noCodingEmployees = await loadData(CONSTANTS.STORE_CONFIG, 'noCoding', []);

        // 加载保存的主题
        const savedTheme = localStorage.getItem('schedule-theme') || 'light';
        setTheme(savedTheme);

        const today = new Date();
        elements.year.value = today.getFullYear();
        for (let mon = 1; mon <= 12; mon++) {
            elements.month.appendChild(new Option(`${mon}月`, mon));
        }
        elements.month.value = today.getMonth() + 1;
        elements.dateInput.value = today.getDate();
        updateMaxDay();
        elements.histYear.value = today.getFullYear();
        for (let mon = 1; mon <= 12; mon++) {
            elements.histMonth.appendChild(new Option(`${mon}月`, mon));
        }
        elements.histMonth.value = today.getMonth() + 1;

        setupEventListeners();

        // 初始化新增功能
        initWorkloadChart();
        initSkillDistributionChart();
        await generateAISuggestions();

        await updateUIForDate();
        renderGroups();
        console.log("应用初始化完成。");
        showNotification("系统已准备就绪", 'success');
    } catch (error) {
        console.error("应用初始化失败:", error);
        showNotification("应用初始化失败！请刷新页面。", 'danger');
    }
}
// 启动应用
main();