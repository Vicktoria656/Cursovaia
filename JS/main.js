class Table {
    constructor(name) {
        this.table = {
            rowsLength: 0
        };
        Object.defineProperty(this.table, "rowsLength", {
            enumerable: false
        });
        this.name = name
    }

    addCol(colName, typ) {
        if (this.table[colName]) {
            throw new Error(`Колонка "${colName}" уже существует`);
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
        
        if (col.type !== typeof val && val !== '') {
            throw new Error(`Тип значения не соответствует типу колонки (ожидается ${col.type}, получен ${typeof val})`);
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
        
        this.container = document.createElement('div')
        place.insertAdjacentElement('beforeend', this.container)

        const columns = Object.keys(this.table).filter(col => col !== 'rowsLength');
        this.tableId = 'editable-table-' + Math.random().toString(36).substr(2, 9);
        
        let html = `<table id="${this.tableId}"><thead><tr>`;
        
        // Заголовки к6олонок
        for (const colName of columns) {
            html += `<th>${colName}</th>`;
        }
        html += '</tr></thead><tbody>';

        // Строки таблицы
        for (let i = 0; i < this.table.rowsLength; i++) {
            html += '<tr>';
            for (const colName of columns) {
                const col = this.table[colName];
                const value = col.rows[i] !== undefined ? col.rows[i] : '';
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

        this.inserted = true
        // Добавляем таблицу в список
        // Добавляем обработчики событий для редактирования
        this.#setupCellEditing();
        this.#setContextMenu()
    }

    #setupCellEditing() {
        
        const table = document.getElementById(this.tableId)
        table.addEventListener('focusout', (e) => {
            if (e.target.tagName === 'TD') {
                const colName = e.target.dataset.col;
                const rowIndex = parseInt(e.target.dataset.row);
                const newValue = e.target.textContent.trim();
                const column = this.table[colName];

                // Обработка пустого значения
                if (newValue === '') {
                    column.rows[rowIndex] = '';
                    return;
                }

                // Проверка типа данных
                let typedValue;
                try {
                    typedValue = this.#convertToType(newValue, column.type);
                } catch (error) {
                    alert(error.message);
                    e.target.textContent = column.rows[rowIndex] !== undefined ? column.rows[rowIndex] : '';
                    return;
                }

                // Сохраняем новое значение
                column.rows[rowIndex] = typedValue;
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
                const num = Number(value);
                if (isNaN(num)) throw new Error('Неверное числовое значение');
                return num;
            case 'boolean':
                if (value.toLowerCase() === 'true') return true;
                if (value.toLowerCase() === 'false') return false;
                throw new Error('Значение должно быть true или false');
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
                    this.#addEmptyRow();
                    this.buildTable(this.container.parentElement);
                }
            },
            {
                text: 'Удалить строку',
                action: () => {
                    const rowIndex = parseInt(contextMenu.dataset.row);
                    this.#deleteRow(rowIndex);
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
                        this.buildTable(this.container.parentElement);
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

    #addEmptyRow() {
        const columns = Object.keys(this.table).filter(col => col !== 'rowsLength');
        columns.forEach(col => {
            this.table[col].rows.push('');
        });
        this.table.rowsLength++;
    }

    #deleteRow(rowIndex) {
        const columns = Object.keys(this.table).filter(col => col !== 'rowsLength');
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


let htmtable = document.querySelector('.main-content')

let table = new Table('Пример')

table.addCol('Name', 'number')

table.addRow('Name', 23)

table.addCol('Age', 'number')

table.addRow('Age', 33)
table.addRow('Age', 33)


table.buildTable(htmtable)









let table2 = new Table('Тест')

table2.addCol('Люди', 'string')

table2.addRow('Люди', 'Человек')
table2.addRow('Люди', 'Человек')

table2.addCol('Посещение', 'boolean')
table2.addRow('Посещение', true)
table2.addRow('Посещение', true)

table2.buildTable(htmtable)



