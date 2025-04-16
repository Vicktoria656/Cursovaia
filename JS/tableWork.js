class RelationsManager {
    constructor(tables) {
        this.tables = tables; // Массив всех таблиц
        this.relations = []; // Массив всех связей между таблицами
        this.initElements();
        this.initEventListeners();
        this.updateTablesList();
        this.updateGraph();
    }

    initElements() {
        // Основные элементы
        this.container = document.getElementById('tableWork');
        this.closeBtn = document.getElementById('closeRelations');
        this.tablesList = document.getElementById('tablesList');
        this.searchInput = document.getElementById('tableSearch');
        
        // Элементы графа
        this.graphSvg = document.querySelector('#relationsGraph svg');
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.fitViewBtn = document.getElementById('fitView');
        
        // Элементы управления связями
        this.sourceTableSelect = document.getElementById('sourceTable');
        this.sourceColumnSelect = document.getElementById('sourceColumn');
        this.targetTableSelect = document.getElementById('targetTable');
        this.targetColumnSelect = document.getElementById('targetColumn');
        this.relationTypeSelect = document.getElementById('relationType');
        this.bidirectionalCheckbox = document.getElementById('bidirectional');
        this.createRelationBtn = document.getElementById('createRelationBtn');
        
        // Элементы управления существующими связями
        this.relationsList = document.getElementById('relationsList');
        this.deleteRelationBtn = document.getElementById('deleteRelationBtn');
        this.totalRelationsSpan = document.getElementById('totalRelations');
        this.tablesInGraphSpan = document.getElementById('tablesInGraph');
        
        // Вкладки
        this.tabs = document.querySelectorAll('.control-tabs .tab');
        this.tabContents = document.querySelectorAll('.tab-content');
    }

    initEventListeners() {
        // Закрытие окна связей
        this.closeBtn.addEventListener('click', () => {
            this.container.classList.add('hide');
        });
        
        // Поиск таблиц
        this.searchInput.addEventListener('input', () => {
            this.filterTables(this.searchInput.value);
        });
        
        // Выбор таблицы в списке
        this.tablesList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                this.highlightTableInGraph(e.target.dataset.table);
            }
        });
        
        // Управление масштабом графа
        this.zoomInBtn.addEventListener('click', () => this.zoomGraph(1.2));
        this.zoomOutBtn.addEventListener('click', () => this.zoomGraph(0.8));
        this.fitViewBtn.addEventListener('click', () => this.fitGraphToView());
        
        // Выбор исходной таблицы
        this.sourceTableSelect.addEventListener('change', () => {
            this.updateColumnsSelect(this.sourceTableSelect, this.sourceColumnSelect);
        });
        
        // Выбор целевой таблицы
        this.targetTableSelect.addEventListener('change', () => {
            this.updateColumnsSelect(this.targetTableSelect, this.targetColumnSelect);
        });
        
        // Создание связи
        this.createRelationBtn.addEventListener('click', () => {
            this.createRelation();
        });
        
        // Удаление связи
        this.deleteRelationBtn.addEventListener('click', () => {
            this.deleteSelectedRelation();
        });
        
        // Переключение вкладок
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
        
        // Режимы просмотра
        document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateGraph();
            });
        });
    }

    updateTablesList() {
        this.tablesList.innerHTML = '';
        this.sourceTableSelect.innerHTML = '<option value="">-- Выберите таблицу --</option>';
        this.targetTableSelect.innerHTML = '<option value="">-- Выберите таблицу --</option>';
        
        this.tables.forEach(table => {
            // Добавляем в список таблиц
            const li = document.createElement('li');
            li.textContent = table.name;
            li.dataset.table = table.name;
            this.tablesList.appendChild(li);
            
            // Добавляем в выпадающие списки
            const option = document.createElement('option');
            option.value = table.name;
            option.textContent = table.name;
            this.sourceTableSelect.appendChild(option.cloneNode(true));
            this.targetTableSelect.appendChild(option);
        });
        
        this.updateRelationsList();
    }

    filterTables(query) {
        const items = this.tablesList.querySelectorAll('li');
        query = query.toLowerCase();
        
        items.forEach(item => {
            const tableName = item.textContent.toLowerCase();
            item.style.display = tableName.includes(query) ? '' : 'none';
        });
    }

    updateColumnsSelect(tableSelect, columnSelect) {
        columnSelect.innerHTML = '<option value="">-- Выберите колонку --</option>';
        columnSelect.disabled = !tableSelect.value;
        
        if (!tableSelect.value) return;
        
        const table = this.tables.find(t => t.name === tableSelect.value);
        if (!table) return;
        
        Object.keys(table.table).forEach(colName => {
            if (colName !== 'rowsLength' && colName !== 'primaryKey' && colName !== 'foreignKeys') {
                const option = document.createElement('option');
                option.value = colName;
                option.textContent = colName;
                columnSelect.appendChild(option);
            }
        });
    }

    createRelation() {
        const sourceTableName = this.sourceTableSelect.value;
        const sourceColumn = this.sourceColumnSelect.value;
        const targetTableName = this.targetTableSelect.value;
        const targetColumn = this.targetColumnSelect.value;
        const relationType = this.relationTypeSelect.value;
        const isBidirectional = this.bidirectionalCheckbox.checked;
        
        if (!sourceTableName || !sourceColumn || !targetTableName || !targetColumn) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        const sourceTable = this.tables.find(t => t.name === sourceTableName);
        const targetTable = this.tables.find(t => t.name === targetTableName);
        
        if (!sourceTable || !targetTable) {
            alert('Одна из таблиц не найдена');
            return;
        }
        
        try {
            // Создаем связь в таблице
            sourceTable.addForeignKey(sourceColumn, targetTable, targetColumn);
            
            // Добавляем связь в наш массив
            this.relations.push({
                sourceTable: sourceTableName,
                sourceColumn,
                targetTable: targetTableName,
                targetColumn,
                type: relationType,
                bidirectional: isBidirectional
            });
            
            // Обновляем граф и список связей
            this.updateGraph();
            this.updateRelationsList();
            
            // Очищаем форму
            this.sourceTableSelect.value = '';
            this.sourceColumnSelect.value = '';
            this.sourceColumnSelect.disabled = true;
            this.targetTableSelect.value = '';
            this.targetColumnSelect.value = '';
            this.targetColumnSelect.disabled = true;
            
            alert('Связь успешно создана!');
        } catch (error) {
            alert(`Ошибка при создании связи: ${error.message}`);
        }
    }

    updateRelationsList() {
        this.relationsList.innerHTML = '';
        
        this.relations.forEach((rel, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            
            const relationText = document.createElement('span');
            relationText.textContent = `${rel.sourceTable}.${rel.sourceColumn} → ${rel.targetTable}.${rel.targetColumn}`;
            
            const relationType = document.createElement('span');
            relationType.className = 'relation-type';
            relationType.textContent = ` (${this.getRelationTypeName(rel.type)})`;
            
            li.appendChild(relationText);
            li.appendChild(relationType);
            this.relationsList.appendChild(li);
        });
        
        // Добавляем обработчики выбора связей
        this.relationsList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                this.selectRelation(li.dataset.index);
            });
        });
        
        // Обновляем статистику
        this.totalRelationsSpan.textContent = this.relations.length;
        this.tablesInGraphSpan.textContent = this.getUniqueTables().length;
    }

    selectRelation(index) {
        // Убираем выделение со всех элементов
        this.relationsList.querySelectorAll('li').forEach(li => {
            li.classList.remove('selected');
        });
        
        // Выделяем выбранный элемент
        const selectedLi = this.relationsList.querySelector(`li[data-index="${index}"]`);
        if (selectedLi) {
            selectedLi.classList.add('selected');
            this.deleteRelationBtn.disabled = false;
            
            // Подсвечиваем связь на графе
            this.highlightRelationInGraph(index);
        }
    }

    deleteSelectedRelation() {
        const selectedLi = this.relationsList.querySelector('li.selected');
        if (!selectedLi) return;
        
        const index = parseInt(selectedLi.dataset.index);
        const relation = this.relations[index];
        
        // Удаляем связь из таблицы (если возможно)
        const sourceTable = this.tables.find(t => t.name === relation.sourceTable);
        if (sourceTable && sourceTable.table.foreignKeys[relation.sourceColumn]) {
            delete sourceTable.table.foreignKeys[relation.sourceColumn];
        }
        
        // Удаляем связь из нашего массива
        this.relations.splice(index, 1);
        
        // Обновляем отображение
        this.updateGraph();
        this.updateRelationsList();
        this.deleteRelationBtn.disabled = true;
    }

    updateGraph() {
        // Очищаем граф
        this.graphSvg.innerHTML = `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#FFA000"/>
                </marker>
            </defs>
        `;
        
        const viewMode = document.querySelector('input[name="viewMode"]:checked').value;
        
        if (viewMode === 'graph') {
            this.drawGraphView();
        } else {
            this.drawMatrixView();
        }
    }

    drawGraphView() {
        const tables = this.getUniqueTables();
        const centerX = this.graphSvg.clientWidth / 2;
        const centerY = this.graphSvg.clientHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        const angleStep = (2 * Math.PI) / tables.length;
        
        // Рисуем узлы (таблицы)
        tables.forEach((tableName, index) => {
            const angle = index * angleStep;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            // Рисуем круг
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 30);
            circle.setAttribute('fill', '#2196F3');
            circle.setAttribute('stroke', '#0D47A1');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('data-table', tableName);
            circle.classList.add('table-node');
            this.graphSvg.appendChild(circle);
            
            // Добавляем текст
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '12');
            text.textContent = tableName;
            this.graphSvg.appendChild(text);
        });
        
        // Рисуем связи
        this.relations.forEach((rel, index) => {
            const sourceIndex = tables.indexOf(rel.sourceTable);
            const targetIndex = tables.indexOf(rel.targetTable);
            
            if (sourceIndex === -1 || targetIndex === -1) return;
            
            const sourceAngle = sourceIndex * angleStep;
            const targetAngle = targetIndex * angleStep;
            
            const sourceX = centerX + radius * Math.cos(sourceAngle);
            const sourceY = centerY + radius * Math.sin(sourceAngle);
            const targetX = centerX + radius * Math.cos(targetAngle);
            const targetY = centerY + radius * Math.sin(targetAngle);
            
            // Рисуем линию
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sourceX);
            line.setAttribute('y1', sourceY);
            line.setAttribute('x2', targetX);
            line.setAttribute('y2', targetY);
            line.setAttribute('stroke', '#FFA000');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            line.setAttribute('data-relation', index);
            line.classList.add('relation-line');
            this.graphSvg.appendChild(line);
            
            // Добавляем текст с типом связи
            const textX = (sourceX + targetX) / 2;
            const textY = (sourceY + targetY) / 2;
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', '#FFA000');
            text.setAttribute('font-size', '10');
            text.textContent = this.getRelationTypeShortName(rel.type);
            this.graphSvg.appendChild(text);
        });
    }

    drawMatrixView() {
        const tables = this.getUniqueTables();
        const cellSize = 40;
        const startX = 50;
        const startY = 50;
        
        // Рисуем заголовки строк и столбцов
        tables.forEach((table, index) => {
            // Заголовки строк
            const rowText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            rowText.setAttribute('x', startX - 5);
            rowText.setAttribute('y', startY + cellSize * (index + 1) - cellSize / 2);
            rowText.setAttribute('text-anchor', 'end');
            rowText.setAttribute('dominant-baseline', 'middle');
            rowText.setAttribute('fill', 'black');
            rowText.setAttribute('font-size', '12');
            rowText.textContent = table;
            this.graphSvg.appendChild(rowText);
            
            // Заголовки столбцов
            const colText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            colText.setAttribute('x', startX + cellSize * (index + 1) - cellSize / 2);
            colText.setAttribute('y', startY - 5);
            colText.setAttribute('text-anchor', 'middle');
            colText.setAttribute('dominant-baseline', 'baseline');
            colText.setAttribute('fill', 'black');
            colText.setAttribute('font-size', '12');
            colText.textContent = table;
            this.graphSvg.appendChild(colText);
        });
        
        // Рисуем сетку
        tables.forEach((rowTable, rowIndex) => {
            tables.forEach((colTable, colIndex) => {
                // Квадрат в матрице
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', startX + cellSize * (colIndex + 1));
                rect.setAttribute('y', startY + cellSize * (rowIndex + 1));
                rect.setAttribute('width', cellSize);
                rect.setAttribute('height', cellSize);
                rect.setAttribute('fill', 'white');
                rect.setAttribute('stroke', '#ddd');
                this.graphSvg.appendChild(rect);
                
                // Проверяем наличие связи
                const relation = this.relations.find(rel => 
                    rel.sourceTable === rowTable && rel.targetTable === colTable
                );
                
                if (relation) {
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', startX + cellSize * (colIndex + 1.5));
                    circle.setAttribute('cy', startY + cellSize * (rowIndex + 1.5));
                    circle.setAttribute('r', cellSize / 3);
                    circle.setAttribute('fill', '#FFA000');
                    this.graphSvg.appendChild(circle);
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', startX + cellSize * (colIndex + 1.5));
                    text.setAttribute('y', startY + cellSize * (rowIndex + 1.5));
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'middle');
                    text.setAttribute('fill', 'white');
                    text.setAttribute('font-size', '10');
                    text.textContent = this.getRelationTypeShortName(relation.type);
                    this.graphSvg.appendChild(text);
                }
            });
        });
    }

    highlightTableInGraph(tableName) {
        // Убираем подсветку со всех узлов
        this.graphSvg.querySelectorAll('.table-node').forEach(node => {
            node.setAttribute('fill', '#2196F3');
        });
        
        // Подсвечиваем выбранный узел
        const node = this.graphSvg.querySelector(`.table-node[data-table="${tableName}"]`);
        if (node) {
            node.setAttribute('fill', '#FF5722');
        }
    }

    highlightRelationInGraph(index) {
        // Убираем подсветку со всех связей
        this.graphSvg.querySelectorAll('.relation-line').forEach(line => {
            line.setAttribute('stroke', '#FFA000');
            line.setAttribute('stroke-width', '2');
        });
        
        // Подсвечиваем выбранную связь
        const line = this.graphSvg.querySelector(`.relation-line[data-relation="${index}"]`);
        if (line) {
            line.setAttribute('stroke', '#FF5722');
            line.setAttribute('stroke-width', '4');
        }
    }

    zoomGraph(factor) {
        // Простая реализация масштабирования
        const viewBox = this.graphSvg.getAttribute('viewBox') || `0 0 ${this.graphSvg.clientWidth} ${this.graphSvg.clientHeight}`;
        const [x, y, width, height] = viewBox.split(' ').map(Number);
        
        const newWidth = width * factor;
        const newHeight = height * factor;
        const newX = x + (width - newWidth) / 2;
        const newY = y + (height - newHeight) / 2;
        
        this.graphSvg.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
    }

    fitGraphToView() {
        this.graphSvg.removeAttribute('viewBox');
    }

    switchTab(tabName) {
        // Убираем активные классы
        this.tabs.forEach(tab => tab.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        // Добавляем активные классы выбранной вкладке
        const selectedTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
        const selectedContent = document.getElementById(`${tabName}RelationTab`);
        
        if (selectedTab && selectedContent) {
            selectedTab.classList.add('active');
            selectedContent.classList.add('active');
        }
    }

    getUniqueTables() {
        const tables = new Set();
        
        // Добавляем все таблицы, которые есть в связях
        this.relations.forEach(rel => {
            tables.add(rel.sourceTable);
            tables.add(rel.targetTable);
        });
        
        // Добавляем все таблицы, даже если у них нет связей
        this.tables.forEach(table => {
            tables.add(table.name);
        });
        
        return Array.from(tables).sort();
    }

    getRelationTypeName(type) {
        const types = {
            'one-to-one': 'Один к одному',
            'one-to-many': 'Один ко многим',
            'many-to-many': 'Многие ко многим'
        };
        return types[type] || type;
    }

    getRelationTypeShortName(type) {
        const types = {
            'one-to-one': '1:1',
            'one-to-many': '1:N',
            'many-to-many': 'M:N'
        };
        return types[type] || type;
    }
}

// Инициализация менеджера связей
let relationsManager;

