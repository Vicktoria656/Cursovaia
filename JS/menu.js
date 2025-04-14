let currentTab = document.querySelector('.menu-tab.active')


const menu = document.querySelector('.menu')




const changeActive = function(ev) {
    const elem = ev.target
    if(elem === menu) return;
    
    const oldContainer = document.getElementById(currentTab.dataset.content)
    const newContainer = document.getElementById(elem.dataset.content)

    
    oldContainer.classList.add('hide')
    newContainer.classList.remove('hide')


    elem.className = "menu-tab active"
    currentTab.className = "menu-tab"

    currentTab = elem
}



menu.addEventListener('click', changeActive)

document.querySelector('div.menu-tab[data-content = "create"]').click()
