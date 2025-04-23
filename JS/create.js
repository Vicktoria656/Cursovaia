const options =  document.querySelector('.creation-options')
let oldOpt = options.children[0];

options.addEventListener('click', (ev) => {
    
    ev.target.classList.add('active')
    oldOpt.classList.remove('active')

    document.querySelector(`#${ev.target.dataset.mode}-creation`).classList.remove('hide')
    document.querySelector(`#${oldOpt.dataset.mode}-creation`).classList.add('hide')

    oldOpt = ev.target
})


// Ручное создание

const previewPanel = document.querySelector('div.preview-panel')
let previewTable = new Table('preview')


const inputName = document.querySelector('input#table-name')
const previewTitle = document.querySelector('h3#preview-title')


inputName.addEventListener('change', function() {
    previewTable.name = inputName.value
    previewTitle.textContent = inputName.value
})

const inputRow = document.querySelector('input#row-count')

previewTable.table.rowsLength = inputRow.value
inputRow.addEventListener('change', function() {
    previewTable.table.rowsLength = inputRow.value
    previewTable.remove()
    previewTable.buildTable(previewPanel)
})

let lastAdded = []

const delCol = function() {
    const colName = lastAdded.pop()
    if (confirm(`Удалить колонку "${colName}"?`)) {
    delete previewTable.table[colName];
    previewTable.remove()
    previewTable.buildTable(previewPanel);
    }
    
}

const addCol = function() {
    const colName = document.querySelector('input#col-name').value
    const colType = document.querySelector('select#col-type').selectedOptions[0].value
    
    if(previewTable.container) previewTable.remove()
    try{
    previewTable.addCol(colName, colType)
    lastAdded.push(colName)
    } catch(er) {
        alert('Колонка с таким названием уже существует')
    }
    previewTable.buildTable(previewPanel)
}



// Шаблоны

const Patterns = {
    CONTACTS: () => {
        if(previewTable.inserted) previewTable.remove()
        previewTable = new Table("Контакты")
        previewTitle.textContent = "Контакты"

        previewTable.addCol('Имя', 'string')
        previewTable.addCol('Телефон', 'string')
        previewTable.addCol('Email', 'string')
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()

        previewTable.buildTable(previewPanel)
    },

    INVENTORY: () => {
        if(previewTable.inserted) previewTable.remove()
        previewTable = new Table("Склад")
        previewTitle.textContent = "Склад"

        previewTable.addCol('Товар', 'string')
        previewTable.addCol('Количество', "number")
        previewTable.addCol('Цена', 'money')
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()

        previewTable.buildTable(previewPanel)
    },

    TASKS: () => {
        if(previewTable.inserted) previewTable.remove()
        previewTable = new Table("Задачи")
        previewTitle.textContent = "Задачи"

        previewTable.addCol('Задача', 'string')
        previewTable.addCol('Срок', 'date')
        previewTable.addCol('Статус', 'boolean')
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()
        previewTable.addEmptyRow()

        previewTable.buildTable(previewPanel)
    }
}

const selectTemplate = function(patternName) {
    const func = Patterns[patternName]
    if(func) func()
}


//Нижние кнопки

const clearForm = function() {
    if(previewTable.inserted) previewTable.remove()
}
const createTable = function() {
    if(!previewTable.inserted) return;
    const sidebar = document.querySelector('.sidebar ul')
    for(let li of sidebar.children) {
        if(li.textContent == previewTable.name) {
            alert('Таблица с таким именем уже существует')
            return
        }
    }


    previewTitle.textContent = ""
    const mainContent = document.querySelector('div.main-content')
    previewTable.remove()
    previewTable.buildTable(mainContent)
    previewTable.addInSidebar()
    let table = previewTable
    previewTable = new Table()

    
    return table
}

selectTemplate('TASKS')
let table = createTable()


selectTemplate('INVENTORY')
let table1 = createTable()
table1.setPrimaryKey('Товар')
table.addForeignKey('Задача', table1, 'Товар')

async function createTableFromJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                const tableName = file.name.replace('.json', '');
                
                // Очищаем существующую previewTable
                if (previewTable.inserted) {
                    previewTable.remove();
                }
                
                // Инициализируем новую структуру на основе существующего объекта
                previewTable = new Table(tableName);
                previewTable.name = tableName;
                previewTitle.textContent = tableName;

                // Копируем данные из JSON
                previewTable.table = {...jsonData};
                
                // Устанавливаем rowsLength как максимальную длину среди всех колонок
                let maxRows = 0;
                const columns = Object.keys(jsonData).filter(col => 
                    col !== 'rowsLength' && 
                    col !== 'primaryKey' && 
                    col !== 'foreignKeys' && 
                    col !== 'relations'
                );
                
                columns.forEach(colName => {
                    if (jsonData[colName]?.rows?.length > maxRows) {
                        maxRows = jsonData[colName].rows.length;
                    }
                });
                
                previewTable.table.rowsLength = maxRows;

                // Функция для определения типа данных
                const detectType = (value) => {
                    if (value === null || value === undefined || value === '') {
                        return 'string'; // тип по умолчанию для пустых значений
                    }
                    
                    // Проверка на дату
                    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
                        return 'date';
                    }
                    if (value instanceof Date) {
                        return 'date';
                    }
                    
                    // Проверка на денежный формат
                    if (typeof value === 'number' && String(value).includes('.')) {
                        return 'money';
                    }
                    
                    // Стандартные типы
                    switch (typeof value) {
                        case 'string': return 'string';
                        case 'number': return 'number';
                        case 'boolean': return 'boolean';
                        default: return 'string';
                    }
                };

                // Восстанавливаем типы колонок
                columns.forEach(colName => {
                    const colData = previewTable.table[colName];
                    
                    // Если тип не был сохранен, определяем его
                    if (!colData.type) {
                        // Ищем первое непустое значение для определения типа
                        const firstValue = colData.rows.find(v => v !== '' && v !== null && v !== undefined);
                        colData.type = firstValue ? detectType(firstValue) : 'string';
                    }
                    
                    // Преобразуем строковые даты в объекты Date
                    if (colData.type === 'date') {
                        colData.rows = colData.rows.map(value => {
                            if (typeof value === 'string' && value) {
                                return new Date(value);
                            }
                            return value;
                        });
                    }
                });

                // Восстанавливаем специальные свойства
                Object.defineProperties(previewTable.table, {
                    "rowsLength": { 
                        value: maxRows,
                        enumerable: false,
                        writable: true 
                    },
                    "primaryKey": { 
                        value: jsonData.primaryKey || null,
                        enumerable: false,
                        writable: true 
                    },
                    "foreignKeys": { 
                        value: jsonData.foreignKeys || {},
                        enumerable: false,
                        writable: true 
                    }
                });
                
                // Восстанавливаем связи (если есть)
                if (jsonData.relations) {
                    previewTable.relations = jsonData.relations;
                }
                
                previewTable.buildTable(previewPanel);
                resolve(previewTable);

            } catch (error) {
                reject(new Error('Ошибка при чтении файла: ' + error.message));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Ошибка при чтении файла'));
        };
        
        reader.readAsText(file);
    });
}

// Привязка к файловому инпуту
const fileInput = document.querySelector('input.secondary[type="file"]');
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.json')) {
        alert('Пожалуйста, выберите файл в формате JSON');
        return;
    }
    
    createTableFromJSON(file)
        
        
        
        
});