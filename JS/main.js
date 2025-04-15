class Table {
    constructor(name) {
        this.table = {
            rowsLength: 0,
            primaryKey: null,
            foreignKeys: {}
        };
        Object.defineProperties(this.table, {
            "rowsLength": { enumerable: false },
            "primaryKey": { enumerable: false },
            "foreignKeys": { enumerable: false }
        });
        this.name = name;
        this.relations = [];
    }

    // ... предыдущие методы (addCol, addRow, buildTable и др.) ...

    /**
     * Устанавливает первичный ключ для таблицы
     * @param {string} colName - Имя колонки для первичного ключа
     */
    setPrimaryKey(colName) {
        if (!this.table[colName]) {
            throw new Error(`Колонка "${colName}" не существует`);
        }
        
        // Проверяем уникальность значений в колонке
        const uniqueValues = new Set(this.table[colName].rows);
        if (uniqueValues.size !== this.table[colName].rows.length) {
            throw new Error(`Колонка "${colName}" содержит дубликаты и не может быть первичным ключом`);
        }
        
        this.table.primaryKey = colName;
    }

    /**
     * Добавляет внешний ключ для связи с другой таблицей
     * @param {string} colName - Имя колонки в текущей таблице
     * @param {Table} foreignTable - Связанная таблица
     * @param {string} foreignCol - Имя колонки в связанной таблице
     */
    addForeignKey(colName, foreignTable, foreignCol) {
        if (!this.table[colName]) {
            throw new Error(`Колонка "${colName}" не существует в текущей таблице`);
        }
        
        if (!foreignTable.table[foreignCol]) {
            throw new Error(`Колонка "${foreignCol}" не существует в связанной таблице`);
        }
        
        // Проверяем, что связанная колонка является первичным ключом
        if (foreignTable.table.primaryKey !== foreignCol) {
            throw new Error(`Колонка "${foreignCol}" не является первичным ключом в связанной таблице`);
        }
        
        // Проверяем соответствие типов
        if (this.table[colName].type !== foreignTable.table[foreignCol].type) {
            throw new Error(`Типы колонок не совпадают: ${this.table[colName].type} и ${foreignTable.table[foreignCol].type}`);
        }
        
        // Сохраняем связь
        this.table.foreignKeys[colName] = {
            table: foreignTable,
            column: foreignCol
        };
        
        // Добавляем запись о связи
        this.relations.push({
            sourceColumn: colName,
            targetTable: foreignTable.name,
            targetColumn: foreignCol
        });
    }

    /**
     * Получает связанные данные из другой таблицы
     * @param {string} colName - Имя колонки с внешним ключом
     * @param {string} relationType - Тип связи ('one-to-one', 'one-to-many')
     * @returns {Array} Массив связанных данных
     */
    getRelatedData(colName, relationType = 'one-to-many') {
        if (!this.table.foreignKeys[colName]) {
            throw new Error(`Колонка "${colName}" не является внешним ключом`);
        }
        
        const { table: foreignTable, column: foreignCol } = this.table.foreignKeys[colName];
        const result = [];
        
        for (const value of this.table[colName].rows) {
            if (value === '') {
                result.push(null);
                continue;
            }
            
            // Находим индекс строки в связанной таблице по значению
            const index = foreignTable.table[foreignCol].rows.indexOf(value);
            
            if (index !== -1) {
                if (relationType === 'one-to-one') {
                    // Для связи один-к-одному возвращаем всю строку
                    const rowData = {};
                    Object.keys(foreignTable.table).forEach(key => {
                        if (key !== 'rowsLength' && key !== 'primaryKey' && key !== 'foreignKeys') {
                            rowData[key] = foreignTable.table[key].rows[index];
                        }
                    });
                    result.push(rowData);
                } else {
                    // Для связи один-ко-многим возвращаем только значение
                    result.push(value);
                }
            } else {
                result.push(null);
            }
        }
        
        return result;
    }

    /**
     * Создает JOIN между таблицами
     * @param {Table} table2 - Вторая таблица для соединения
     * @param {string} joinType - Тип соединения ('INNER', 'LEFT', 'RIGHT')
     * @param {string} onCol - Колонка для соединения в текущей таблице
     * @param {string} table2Col - Колонка для соединения во второй таблице
     * @returns {Array} Результат JOIN-операции
     */
    join(table2, joinType = 'INNER', onCol, table2Col) {
        if (!onCol || !table2Col) {
            // Пытаемся автоматически определить связь по внешним ключам
            for (const [col, fk] of Object.entries(this.table.foreignKeys)) {
                if (fk.table === table2) {
                    onCol = col;
                    table2Col = fk.column;
                    break;
                }
            }
            
            if (!onCol || !table2Col) {
                throw new Error('Не указаны колонки для соединения и не найдены внешние ключи');
            }
        }
        
        const result = [];
        const primaryTable = joinType === 'RIGHT' ? table2 : this;
        const secondaryTable = joinType === 'RIGHT' ? this : table2;
        const primaryCol = joinType === 'RIGHT' ? table2Col : onCol;
        const secondaryCol = joinType === 'RIGHT' ? onCol : table2Col;
        
        // Собираем индексы для быстрого поиска
        const indexMap = {};
        secondaryTable.table[secondaryCol].rows.forEach((val, idx) => {
            if (!indexMap[val]) indexMap[val] = [];
            indexMap[val].push(idx);
        });
        
        // Выполняем соединение
        primaryTable.table[primaryCol].rows.forEach((val, primaryIdx) => {
            const secondaryIndexes = indexMap[val] || [];
            
            if (secondaryIndexes.length > 0 || joinType !== 'INNER') {
                if (secondaryIndexes.length === 0) {
                    // Для LEFT/RIGHT JOIN, когда нет соответствия
                    const combinedRow = this.#combineRows(primaryTable, primaryIdx, secondaryTable, null);
                    result.push(combinedRow);
                } else {
                    // Для всех совпадений
                    secondaryIndexes.forEach(secondaryIdx => {
                        const combinedRow = this.#combineRows(primaryTable, primaryIdx, secondaryTable, secondaryIdx);
                        result.push(combinedRow);
                    });
                }
            }
        });
        
        return result;
    }

    // Вспомогательный метод для объединения строк
    #combineRows(table1, idx1, table2, idx2) {
        const row = {};
        
        // Добавляем данные из первой таблицы
        Object.keys(table1.table).forEach(col => {
            if (col !== 'rowsLength' && col !== 'primaryKey' && col !== 'foreignKeys') {
                row[`${table1.name}_${col}`] = idx1 !== null ? table1.table[col].rows[idx1] : null;
            }
        });
        
        // Добавляем данные из второй таблицы
        if (table2) {
            Object.keys(table2.table).forEach(col => {
                if (col !== 'rowsLength' && col !== 'primaryKey' && col !== 'foreignKeys') {
                    row[`${table2.name}_${col}`] = idx2 !== null ? table2.table[col].rows[idx2] : null;
                }
            });
        }
        
        return row;
    }

    /**
     * Отображает связи между таблицами
     */
    showRelations() {
        if (this.relations.length === 0) {
            console.log(`Таблица "${this.name}" не имеет связей с другими таблицами`);
            return;
        }
        
        console.log(`Связи таблицы "${this.name}":`);
        this.relations.forEach(rel => {
            console.log(`- ${this.name}.${rel.sourceColumn} → ${rel.targetTable}.${rel.targetColumn}`);
        });
    }



    

    addCol(colName, typ) {
        if (this.table[colName]) {
            throw new Error(`Колонка "${colName}" уже существует`);
        }

        // Проверка допустимых типов
        const validTypes = ['string', 'number', 'boolean', 'money', 'date'];
        if (!validTypes.includes(typ)) {
            throw new Error(`Недопустимый тип данных: ${typ}. Допустимые типы: ${validTypes.join(', ')}`);
        }

        this.table[colName] = {
            type: typ,
            rows: []
        };

        Object.defineProperty(this.table[colName], "type", {
            enumerable: false
        });
        
        return this.table[colName];
    }

    addRow(colName, val) {
        if (!this.table[colName]) {
            throw new Error(`Колонка "${colName}" не существует`);
        }
        
        const col = this.table[colName];

        if (val === undefined || val === null) {
            val = '';
        }
        
        // Проверка типа для money (должен быть number)
        if (col.type === 'money' && typeof val !== 'number' && val !== '') {
            throw new Error(`Тип значения не соответствует типу колонки (ожидается number, получен ${typeof val})`);
        }
        
        // Проверка типа для date (должен быть Date или строка в формате даты)
        if (col.type === 'date' && !(val instanceof Date) && val !== '' && isNaN(Date.parse(val))) {
            throw new Error(`Тип значения не соответствует типу колонки (ожидается Date, получен ${typeof val})`);
        }
        
        // Проверка типа для остальных случаев
        if (!['money', 'date'].includes(col.type) && col.type !== typeof val && val !== '') {
            throw new Error(`Тип значения не соответствует типу колонки (ожидается ${col.type}, получен ${typeof val})`);
        }
        
        // Для дат преобразуем строку в Date
        if (col.type === 'date' && typeof val === 'string' && val !== '') {
            val = new Date(val);
        }
        
        col.rows.push(val);
        
        if (col.rows.length > this.table.rowsLength) {
            this.table.rowsLength = col.rows.length;
        }
        
        return col.rows;
    }

    buildTable(place) {
        if (!(place instanceof HTMLElement)) {
            throw new Error('Указан неверный целевой элемент');
        }
        
        this.container = document.createElement('div');
        place.insertAdjacentElement('beforeend', this.container);

        const columns = Object.keys(this.table).filter(col => col !== 'rowsLength');
        this.tableId = 'editable-table-' + Math.random().toString(36).substr(2, 9);
        
        let html = `<table id="${this.tableId}"><thead><tr>`;
        
        // Заголовки колонок
        for (const colName of columns) {
            html += `<th>${colName}</th>`;
        }
        html += '</tr></thead><tbody>';

        // Строки таблицы
        for (let i = 0; i < this.table.rowsLength; i++) {
            html += '<tr>';
            for (const colName of columns) {
                const col = this.table[colName];
                let value = col.rows[i] !== undefined ? col.rows[i] : '';
                
                // Форматирование для типа money
                if (col.type === 'money' && value !== '') {
                    value = `${value}$`;
                }
                
                // Форматирование для типа date
                if (col.type === 'date' && value !== '' && value instanceof Date) {
                    value = value.toLocaleDateString(); // Можно настроить формат
                }
                
                html += `<td 
                    data-col="${colName}" 
                    data-row="${i}"
                    contenteditable="true"
                >${value}</td>`;
            }
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        this.container.innerHTML = html;

        this.inserted = true;
        this.#setupCellEditing();
        this.#setContextMenu();
    }

    #setupCellEditing() {
        const table = document.getElementById(this.tableId);
        table.addEventListener('focusout', (e) => {
            if (e.target.tagName === 'TD') {
                const colName = e.target.dataset.col;
                const rowIndex = parseInt(e.target.dataset.row);
                let newValue = e.target.textContent.trim();
                const column = this.table[colName];

                // Обработка пустого значения
                if (newValue === '') {
                    column.rows[rowIndex] = '';
                    return;
                }

                // Удаляем знак доллара для money перед проверкой
                if (column.type === 'money') {
                    newValue = newValue.replace(/\$/g, '');
                }

                // Проверка типа данных
                let typedValue;
                try {
                    typedValue = this.#convertToType(newValue, column.type);
                } catch (error) {
                    alert(error.message);
                    // Восстанавливаем предыдущее значение с правильным форматированием
                    e.target.textContent = this.#formatValueForDisplay(column.rows[rowIndex], column.type);
                    return;
                }

                // Сохраняем новое значение
                column.rows[rowIndex] = typedValue;
                // Обновляем отображение с правильным форматированием
                e.target.textContent = this.#formatValueForDisplay(typedValue, column.type);
            }
        });

        // Обработка нажатия Enter
        table.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName === 'TD') {
                e.preventDefault();
                e.target.blur();
            }
        });
    }

    #convertToType(value, type) {
        switch (type) {
            case 'string':
                return String(value);
            case 'number':
            case 'money': // money обрабатывается как number
                const num = Number(value);
                if (isNaN(num)) throw new Error('Неверное числовое значение');
                return num;
            case 'boolean':
                if (value.toLowerCase() === 'true') return true;
                if (value.toLowerCase() === 'false') return false;
                throw new Error('Значение должно быть true или false');
            case 'date':
                const date = new Date(value);
                if (isNaN(date.getTime())) throw new Error('Неверный формат даты требуется ММ:ДД:ГГГГ');
                return date;
            default:
                return value;
        }
    }

    #formatValueForDisplay(value, type) {
        if (value === '' || value === undefined || value === null) return '';
        
        switch (type) {
            case 'money':
                return `${value}$`;
            case 'date':
                return value instanceof Date ? value.toLocaleDateString() : value;
            default:
                return value;
        }
    }




    #setContextMenu() {
        const table = document.getElementById(this.tableId);
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.display = 'none';
        document.body.appendChild(contextMenu);

        // Функции для пунктов меню
        const menuItems = [
            {
                text: 'Добавить строку',
                action: () => {
                    this.addEmptyRow();
                    this.buildTable(this.container.parentElement);
                }
            },
            {
                text: 'Удалить строку',
                action: () => {
                    const rowIndex = parseInt(contextMenu.dataset.row);
                    this.deleteRow(rowIndex);
                    this.buildTable(this.container.parentElement);
                }
            },
            {
                text: 'Добавить колонку',
                action: () => {
                    const colName = prompt('Введите название колонки:');
                    if (colName) {
                        const colType = prompt('Введите тип данных (string, number, boolean):');
                        this.addCol(colName, colType);
                        this.buildTable(this.container.parentElement);
                    }
                }
            },
            {
                text: 'Удалить колонку',
                action: () => {
                    const colName = contextMenu.dataset.col;
                    if (confirm(`Удалить колонку "${colName}"?`)) {
                        delete this.table[colName];
                        let parentElement = this.container.parentElement
                        this.remove();
                        this.buildTable(parentElement);
                    }
                }
            }
        ];

        // Создаем пункты меню
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.textContent = item.text;
            menuItem.addEventListener('click', item.action);
            contextMenu.appendChild(menuItem);
        });

        table.addEventListener('contextmenu', (ev) => {
            ev.preventDefault();
            
            // Определяем, по какому элементу кликнули
            const target = ev.target.closest('td, th');
            if (!target) return;

            // Позиционируем меню
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${ev.pageX}px`;
            contextMenu.style.top = `${ev.pageY}px`;

            // Сохраняем данные о выбранной ячейке
            if (target.tagName === 'TD') {
                contextMenu.dataset.col = target.dataset.col;
                contextMenu.dataset.row = target.dataset.row;
            }

           });

        // Скрываем меню при клике вне его
        document.addEventListener('click', (ev) => {
            if (!contextMenu.contains(ev.target)) {
                contextMenu.style.display = 'none';
            }
        });
    }

    addEmptyRow() {
        const columns = Object.keys(this.table)
        columns.forEach(col => {
            this.table[col].rows.push('');
        });
        this.table.rowsLength++;
    }

    deleteRow(rowIndex) {
        const columns = Object.keys(this.table)
        columns.forEach(col => {
            this.table[col].rows.splice(rowIndex, 1);
        });
        this.table.rowsLength--;
    }

    

    

    addInSidebar() {
        const List = document.querySelector('.sidebar ul')
        const newLi = document.createElement('li')
        newLi.textContent = this.name
        newLi.dataset.table = this.tableId
        
        
        List.insertAdjacentElement('beforeend', newLi)

        newLi.click()
    }

    remove() {
        if(!this.container) throw new Error('Таблица отсутствует')
        this.container.remove()
    }
}

