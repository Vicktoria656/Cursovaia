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
console.log(JSON.stringify(table.table))
table1.setPrimaryKey('Товар')
table.addForeignKey('Задача', table1, 'Товар')

