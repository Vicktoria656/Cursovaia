let currentTab = document.querySelector('.menu-tab.active')


const menu = document.querySelector('.menu')




const changeActive = function(ev) {
    const elem = ev.target
    if(elem === menu) return;

    
    
    const oldContainer = document.getElementById(currentTab.dataset.content)
    const newContainer = document.getElementById(elem.dataset.content)

    
    oldContainer.classList.add('hide')
    newContainer.classList.remove('hide')

    if(elem.dataset.content == 'tableWork') {
        if (!relationsManager) {
            relationsManager = new RelationsManager(tableManager);
        } else {
            relationsManager.updateTablesList();
            relationsManager.updateGraph();
        }
    }

    elem.className = "menu-tab active"
    currentTab.className = "menu-tab"

    currentTab = elem
}



menu.addEventListener('click', changeActive)

