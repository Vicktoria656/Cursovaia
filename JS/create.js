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
const inputRow = document.querySelector('input#row-count')

previewTable.table.rowsLength = inputRow.value
inputRow.addEventListener('change', function() {
    previewTable.table.rowsLength = inputRow.value
})


const addCol = function(ev) {
    const colName = document.querySelector('input#col-name').value
    const colType = document.querySelector('select#col-type').selectedOptions[0].value
    
    if(previewTable.container) previewTable.remove()
    previewTable.addCol(colName, colType)
    previewTable.buildTable(previewPanel)
}

const clearForm = function() {
    previewTable.remove()
}
//