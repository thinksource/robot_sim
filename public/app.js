// 全局变量
let maps = [];
let robots = [];
let commandSets = [];
let selectedMap = null;
let selectedRobot = null;
let selectedCommandSet = null;
let animationInProgress = false;

// API基础URL
const API_URL = '';

// DOM元素
const mapSelect = document.getElementById('map-select');
const robotSelect = document.getElementById('robot-select');
const commandSetSelect = document.getElementById('command-set-select');
const createMapBtn = document.getElementById('create-map-btn');
const createRobotBtn = document.getElementById('create-robot-btn');
const createCommandSetBtn = document.getElementById('create-command-set-btn');
const moveBtn = document.getElementById('move-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const reportBtn = document.getElementById('report-btn');
const commandSequence = document.getElementById('command-sequence');
const executeSequenceBtn = document.getElementById('execute-sequence-btn');
const executeCommandSetBtn = document.getElementById('execute-command-set-btn');
const statusDisplay = document.getElementById('status-display');
const mapContainer = document.getElementById('map-container');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载地图、机器人和命令集数据
  loadMaps();
  loadRobots();
  loadCommandSets();
  
  // 事件监听器
  mapSelect.addEventListener('change', handleMapSelect);
  robotSelect.addEventListener('change', handleRobotSelect);
  commandSetSelect.addEventListener('change', handleCommandSetSelect);
  createMapBtn.addEventListener('click', showCreateMapForm);
  createRobotBtn.addEventListener('click', showCreateRobotForm);
  createCommandSetBtn.addEventListener('click', showCreateCommandSetForm);
  moveBtn.addEventListener('click', () => executeCommand('MOVE'));
  leftBtn.addEventListener('click', () => executeCommand('LEFT'));
  rightBtn.addEventListener('click', () => executeCommand('RIGHT'));
  reportBtn.addEventListener('click', () => executeCommand('REPORT'));
  executeSequenceBtn.addEventListener('click', executeCommandSequence);
  executeCommandSetBtn.addEventListener('click', executeCommandSet);
  closeModal.addEventListener('click', () => modal.style.display = 'none');
  
  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

// 加载所有地图
async function loadMaps() {
  try {
    const response = await fetch(`${API_URL}/maps`);
    maps = await response.json();
    
    // 更新地图选择下拉框
    mapSelect.innerHTML = '<option value="">选择地图...</option>';
    maps.forEach(map => {
      const option = document.createElement('option');
      option.value = map.id;
      option.textContent = map.name;
      mapSelect.appendChild(option);
    });
  } catch (error) {
    updateStatus(`加载地图失败: ${error.message}`);
  }
}

// 加载所有机器人
async function loadRobots() {
  try {
    const response = await fetch(`${API_URL}/robots`);
    robots = await response.json();
    
    // 更新机器人选择下拉框
    robotSelect.innerHTML = '<option value="">选择机器人...</option>';
    robots.forEach(robot => {
      const option = document.createElement('option');
      option.value = robot.id;
      option.textContent = robot.name;
      robotSelect.appendChild(option);
    });
  } catch (error) {
    updateStatus(`加载机器人失败: ${error.message}`);
  }
}

// 处理地图选择
async function handleMapSelect() {
  const mapId = mapSelect.value;
  if (!mapId) {
    selectedMap = null;
    renderMap();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/maps/${mapId}`);
    selectedMap = await response.json();
    renderMap();
  } catch (error) {
    updateStatus(`加载地图详情失败: ${error.message}`);
  }
}

// 处理机器人选择
async function handleRobotSelect() {
  const robotId = robotSelect.value;
  if (!robotId) {
    selectedRobot = null;
    renderRobot();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/robots/${robotId}`);
    selectedRobot = await response.json();
    
    // 如果机器人所在地图与当前选择的地图不同，则加载机器人所在的地图
    if (!selectedMap || selectedMap.id !== selectedRobot.mapId) {
      const mapResponse = await fetch(`${API_URL}/maps/${selectedRobot.mapId}`);
      selectedMap = await mapResponse.json();
      
      // 更新地图选择下拉框
      mapSelect.value = selectedMap.id;
      renderMap();
    }
    
    renderRobot();
  } catch (error) {
    updateStatus(`加载机器人详情失败: ${error.message}`);
  }
}

// 渲染地图
function renderMap() {
  mapContainer.innerHTML = '';
  
  if (!selectedMap) return;
  
  const { width, height, terrain } = selectedMap;
  const cellSize = Math.min(mapContainer.clientWidth / width, mapContainer.clientHeight / height);
  
  // 创建地图单元格
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = document.createElement('div');
      cell.className = `map-cell terrain-${terrain[y][x]}`;
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;
      cell.style.left = `${x * cellSize}px`;
      cell.style.top = `${y * cellSize}px`;
      
      mapContainer.appendChild(cell);
    }
  }
  
  // 如果有选中的机器人，重新渲染
  if (selectedRobot && selectedRobot.mapId === selectedMap.id) {
    renderRobot();
  }
}

// 渲染机器人
function renderRobot() {
  // 移除现有的机器人元素
  const existingRobot = document.querySelector('.robot');
  if (existingRobot) {
    existingRobot.remove();
  }
  
  if (!selectedRobot || !selectedMap) return;
  
  const { width, height } = selectedMap;
  const { position } = selectedRobot;
  const cellSize = Math.min(mapContainer.clientWidth / width, mapContainer.clientHeight / height);
  
  // 创建机器人元素
  const robot = document.createElement('div');
  robot.className = `robot direction-${position.direction.toLowerCase()}`;
  robot.style.width = `${cellSize * 0.8}px`;
  robot.style.height = `${cellSize * 0.8}px`;
  robot.style.left = `${position.x * cellSize + cellSize * 0.1}px`;
  robot.style.top = `${position.y * cellSize + cellSize * 0.1}px`;
  
  mapContainer.appendChild(robot);
}

// 执行单个命令
async function executeCommand(commandType, parameter = null) {
  if (!selectedRobot) {
    updateStatus('请先选择一个机器人');
    return;
  }
  
  if (animationInProgress) {
    updateStatus('请等待当前命令执行完成');
    return;
  }
  
  const command = {
    type: commandType,
    parameter: parameter
  };
  
  try {
    animationInProgress = true;
    const response = await fetch(`${API_URL}/robots/${selectedRobot.id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // 更新机器人位置
      selectedRobot.position = result.newPosition;
      
      // 动画效果
      await animateRobotMovement(result);
      
      updateStatus(`命令执行成功: ${result.message}`);
    } else {
      updateStatus(`命令执行失败: ${result.message}`);
    }
  } catch (error) {
    updateStatus(`执行命令出错: ${error.message}`);
  } finally {
    animationInProgress = false;
  }
}

// 执行命令序列
async function executeCommandSequence() {
  if (!selectedRobot) {
    updateStatus('请先选择一个机器人');
    return;
  }
  
  if (animationInProgress) {
    updateStatus('请等待当前命令执行完成');
    return;
  }
  
  const commandText = commandSequence.value.trim();
  if (!commandText) {
    updateStatus('请输入命令序列');
    return;
  }
  
  // 解析命令序列
  const commands = [];
  const lines = commandText.split('\n');
  
  for (const line of lines) {
    const parts = line.trim().split(' ');
    if (parts.length > 0 && parts[0]) {
      const commandType = parts[0].toUpperCase();
      const parameter = parts.length > 1 ? parts[1] : null;
      
      commands.push({
        type: commandType,
        parameter: parameter
      });
    }
  }
  
  if (commands.length === 0) {
    updateStatus('没有有效的命令');
    return;
  }
  
  try {
    animationInProgress = true;
    updateStatus('开始执行命令序列...');
    
    // 逐个执行命令，添加延迟以便观察
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      updateStatus(`执行命令 ${i+1}/${commands.length}: ${command.type} ${command.parameter || ''}`);
      
      const response = await fetch(`${API_URL}/robots/${selectedRobot.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(command)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 更新机器人位置
        selectedRobot.position = result.newPosition;
        
        // 动画效果
        await animateRobotMovement(result);
        
        updateStatus(`命令 ${command.type} 执行成功: ${result.message}`);
      } else {
        updateStatus(`命令 ${command.type} 执行失败: ${result.message}`);
        break;
      }
      
      // 添加延迟
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    updateStatus('命令序列执行完成');
  } catch (error) {
    updateStatus(`执行命令序列出错: ${error.message}`);
  } finally {
    animationInProgress = false;
  }
}

// 机器人移动动画
async function animateRobotMovement(result) {
  return new Promise(resolve => {
    const robot = document.querySelector('.robot');
    if (!robot || !result.newPosition) {
      resolve();
      return;
    }
    
    const { width, height } = selectedMap;
    const { newPosition } = result;
    const cellSize = Math.min(mapContainer.clientWidth / width, mapContainer.clientHeight / height);
    
    // 更新方向类
    robot.className = `robot direction-${newPosition.direction.toLowerCase()}`;
    
    // 更新位置
    robot.style.left = `${newPosition.x * cellSize + cellSize * 0.1}px`;
    robot.style.top = `${newPosition.y * cellSize + cellSize * 0.1}px`;
    
    // 监听过渡结束事件
    const transitionEndHandler = () => {
      robot.removeEventListener('transitionend', transitionEndHandler);
      resolve();
    };
    
    robot.addEventListener('transitionend', transitionEndHandler);
    
    // 如果没有实际移动，手动触发resolve
    setTimeout(() => {
      resolve();
    }, 600); // 略大于CSS过渡时间
  });
}

// 显示创建地图表单
function showCreateMapForm() {
  modalBody.innerHTML = `
    <h2>创建新地图</h2>
    <form id="create-map-form">
      <div class="form-group">
        <label for="map-name">地图名称</label>
        <input type="text" id="map-name" required>
      </div>
      <div class="form-group">
        <label for="map-width">宽度</label>
        <input type="number" id="map-width" min="5" max="20" value="10" required>
      </div>
      <div class="form-group">
        <label for="map-height">高度</label>
        <input type="number" id="map-height" min="5" max="20" value="10" required>
      </div>
      <button type="submit">创建</button>
    </form>
  `;
  
  modal.style.display = 'block';
  
  // 表单提交事件
  document.getElementById('create-map-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('map-name').value;
    const width = parseInt(document.getElementById('map-width').value);
    const height = parseInt(document.getElementById('map-height').value);
    
    try {
      const response = await fetch(`${API_URL}/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, width, height })
      });
      
      const newMap = await response.json();
      maps.push(newMap);
      
      // 更新地图选择下拉框
      const option = document.createElement('option');
      option.value = newMap.id;
      option.textContent = newMap.name;
      mapSelect.appendChild(option);
      
      // 选择新创建的地图
      mapSelect.value = newMap.id;
      selectedMap = newMap;
      renderMap();
      
      modal.style.display = 'none';
      updateStatus(`地图 "${newMap.name}" 创建成功`);
    } catch (error) {
      updateStatus(`创建地图失败: ${error.message}`);
    }
  });
}

// 显示创建机器人表单
function showCreateRobotForm() {
  if (maps.length === 0) {
    updateStatus('请先创建至少一个地图');
    return;
  }
  
  modalBody.innerHTML = `
    <h2>创建新机器人</h2>
    <form id="create-robot-form">
      <div class="form-group">
        <label for="robot-name">机器人名称</label>
        <input type="text" id="robot-name" required>
      </div>
      <div class="form-group">
        <label for="robot-map">地图</label>
        <select id="robot-map" required>
          ${maps.map(map => `<option value="${map.id}">${map.name}</option>`).join('')}
        </select>
      </div>
      <button type="submit">创建</button>
    </form>
  `;
  
  // 默认选择当前地图
  if (selectedMap) {
    setTimeout(() => {
      document.getElementById('robot-map').value = selectedMap.id;
    }, 0);
  }
  
  modal.style.display = 'block';
  
  // 表单提交事件
  document.getElementById('create-robot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('robot-name').value;
    const mapId = document.getElementById('robot-map').value;
    
    try {
      const response = await fetch(`${API_URL}/robots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, mapId })
      });
      
      const newRobot = await response.json();
      robots.push(newRobot);
      
      // 更新机器人选择下拉框
      const option = document.createElement('option');
      option.value = newRobot.id;
      option.textContent = newRobot.name;
      robotSelect.appendChild(option);
      
      // 选择新创建的机器人
      robotSelect.value = newRobot.id;
      selectedRobot = newRobot;
      
      // 如果地图不同，则加载机器人所在的地图
      if (!selectedMap || selectedMap.id !== newRobot.mapId) {
        const mapResponse = await fetch(`${API_URL}/maps/${newRobot.mapId}`);
        selectedMap = await mapResponse.json();
        mapSelect.value = selectedMap.id;
        renderMap();
      } else {
        renderRobot();
      }
      
      modal.style.display = 'none';
      updateStatus(`机器人 "${newRobot.name}" 创建成功`);
    } catch (error) {
      updateStatus(`创建机器人失败: ${error.message}`);
    }
  });
}

// 加载所有命令集
async function loadCommandSets() {
  try {
    const response = await fetch(`${API_URL}/command-sets`);
    commandSets = await response.json();
    
    // 更新命令集选择下拉框
    commandSetSelect.innerHTML = '<option value="">选择命令集...</option>';
    commandSets.forEach(set => {
      const option = document.createElement('option');
      option.value = set.id;
      option.textContent = set.name;
      commandSetSelect.appendChild(option);
    });
  } catch (error) {
    updateStatus(`加载命令集失败: ${error.message}`);
  }
}

// 处理命令集选择
function handleCommandSetSelect() {
  const commandSetId = commandSetSelect.value;
  if (!commandSetId) {
    selectedCommandSet = null;
    return;
  }
  
  selectedCommandSet = commandSets.find(set => set.id === commandSetId);
}

// 执行命令集
async function executeCommandSet() {
  if (!selectedRobot) {
    updateStatus('请先选择一个机器人');
    return;
  }
  
  if (!selectedCommandSet) {
    updateStatus('请先选择一个命令集');
    return;
  }
  
  if (animationInProgress) {
    updateStatus('请等待当前命令执行完成');
    return;
  }
  
  try {
    animationInProgress = true;
    updateStatus(`开始执行命令集: ${selectedCommandSet.name}`);
    
    const response = await fetch(`${API_URL}/command-sets/${selectedCommandSet.id}/execute/${selectedRobot.id}`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      // 更新机器人状态
      const robotResponse = await fetch(`${API_URL}/robots/${selectedRobot.id}`);
      selectedRobot = await robotResponse.json();
      renderRobot();
      
      updateStatus(`命令集执行成功: ${result.results.length} 个命令已执行`);
      
      // 显示每个命令的结果
      result.results.forEach((item, index) => {
        updateStatus(`命令 ${index+1}: ${item.command} ${item.parameter || ''} - ${item.result.message}`);
      });
    } else {
      updateStatus(`命令集执行失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    updateStatus(`执行命令集出错: ${error.message}`);
  } finally {
    animationInProgress = false;
  }
}

// 显示创建命令集表单
function showCreateCommandSetForm() {
  if (robots.length === 0) {
    updateStatus('请先创建至少一个机器人');
    return;
  }
  
  // 获取所有可用命令
  fetch(`${API_URL}/commands`)
    .then(response => response.json())
    .then(commands => {
      if (commands.length === 0) {
        updateStatus('没有可用的命令');
        return;
      }
      
      modalBody.innerHTML = `
        <h2>创建新命令集</h2>
        <form id="create-command-set-form">
          <div class="form-group">
            <label for="command-set-name">命令集名称</label>
            <input type="text" id="command-set-name" required>
          </div>
          <div class="form-group">
            <label for="command-set-description">描述</label>
            <input type="text" id="command-set-description">
          </div>
          <div class="form-group">
            <label>选择命令</label>
            <div id="command-list" class="command-list">
              ${commands.map(cmd => `
                <div class="command-item">
                  <input type="checkbox" id="cmd-${cmd.id}" value="${cmd.id}">
                  <label for="cmd-${cmd.id}">${cmd.type} ${cmd.parameter || ''} - ${cmd.description}</label>
                </div>
              `).join('')}
            </div>
          </div>
          <button type="submit">创建</button>
        </form>
      `;
      
      modal.style.display = 'block';
      
      // 表单提交事件
      document.getElementById('create-command-set-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('command-set-name').value;
        const description = document.getElementById('command-set-description').value;
        
        // 获取选中的命令
        const commandIds = [];
        commands.forEach(cmd => {
          const checkbox = document.getElementById(`cmd-${cmd.id}`);
          if (checkbox && checkbox.checked) {
            commandIds.push(cmd.id);
          }
        });
        
        if (commandIds.length === 0) {
          updateStatus('请至少选择一个命令');
          return;
        }
        
        try {
          const response = await fetch(`${API_URL}/command-sets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, commandIds })
          });
          
          const newCommandSet = await response.json();
          commandSets.push(newCommandSet);
          
          // 更新命令集选择下拉框
          const option = document.createElement('option');
          option.value = newCommandSet.id;
          option.textContent = newCommandSet.name;
          commandSetSelect.appendChild(option);
          
          // 选择新创建的命令集
          commandSetSelect.value = newCommandSet.id;
          selectedCommandSet = newCommandSet;
          
          modal.style.display = 'none';
          updateStatus(`命令集 "${newCommandSet.name}" 创建成功`);
        } catch (error) {
          updateStatus(`创建命令集失败: ${error.message}`);
        }
      });
    })
    .catch(error => {
      updateStatus(`加载命令失败: ${error.message}`);
    });
}

// 更新状态显示
function updateStatus(message) {
  const timestamp = new Date().toLocaleTimeString();
  statusDisplay.innerHTML += `[${timestamp}] ${message}\n`;
  statusDisplay.scrollTop = statusDisplay.scrollHeight;
}