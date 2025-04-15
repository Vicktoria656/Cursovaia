const sidebar = document.querySelector('.sidebar ul')

let currentLi;



const changeActiveTable = function(ev) {
    const elem = ev.target
    if(elem === sidebar) return;
    
    if(currentLi) {
    const oldContainer = document.getElementById(currentLi.dataset.table)
    oldContainer.classList.add('hide')
    currentLi.className = "menu-tab"
    }

    const newContainer = document.getElementById(elem.dataset.table)
    const mainContent = document.querySelector('h1#table-title')
    mainContent.textContent = ev.target.textContent
    
    

    
    newContainer.classList.remove('hide')


    elem.className = "menu-tab active"
    
    

    currentLi = elem
}



sidebar.addEventListener('click', changeActiveTable)

