document.addEventListener('DOMContentLoaded', async function () {

    document.addEventListener('arrowClicked', async (event) => {
      const { entityName } = event.detail;
      //console.log('Arrow clicked for entity:', entityName);
      const data = await splicedData(entityName);
      data.sort((a, b) => parseFloat(b[9]) - parseFloat(a[9]));
      shared.createTable(data, 'DataTableContainer', entityName);  
    });
    
  async function fetchTotalAddresses(entity) {
    return entity.Titles.reduce((sum, title) => sum + (title.Addresses ? title.Addresses.length : 0), 0);
  }

async function splicedData(entity) {
    try {
        const mainEntityListResponse = await fetch('entityData/entitiesMainListReduced.json');
        const mainEntityListData = await mainEntityListResponse.json();
        const entityInMainList = mainEntityListData.find(item => item.Entity === entity);
        if (entityInMainList) {
            const dataForAddresses = [];
            entityInMainList.Titles.forEach(titleData => {
                titleData.Addresses.forEach(address => {
                    const [Address, FirstSeen, IncomingTx, OutgoingTx, UTXOs, IncomingBalance, OutgoingBalance, RemainingBalance, MempoolTxn] = address.split(', ');
                    const addressDataArray = [Address, titleData.Title, FirstSeen, IncomingTx, OutgoingTx, UTXOs, IncomingBalance, OutgoingBalance, RemainingBalance, MempoolTxn];
                    dataForAddresses.push(addressDataArray);
                });
            });
            const data = dataForAddresses;
            return data
        }
    } catch (error) {
        console.error(error);
    }
}
            
async function EntitiesSummary(entities) {
    try {
        const response = await fetch(`entityData/EntitiesSummary.json`);
        const data = [];
        const entitiesMainListReducedResponse = await response.json();
        await shared.createTable(entitiesMainListReducedResponse, 'DataTableContainer', `Entities Summary`);
    } catch (error) {
        console.error('Error fetching entitiesMainListReduced:', error);
    }
}

async function populateMenu() {
    try {
        const menu = document.getElementById('menu');
        menu.innerHTML = ''; 
        const entityLink1 = document.createElement('a');
        entityLink1.textContent = `Entities Summary`;
        entityLink1.addEventListener('click', async () => {
            const allLinks = document.querySelectorAll('#menu a');
            allLinks.forEach(link => link.classList.remove('active'));
            entityLink1.classList.add('active');
            await EntitiesSummary("All");
            toggleMenu(); 
        });
        menu.appendChild(entityLink1);

        const mainEntityListResponse = await fetch('entityData/entitiesMainListReduced.json');
        const mainEntityListData = await mainEntityListResponse.json();
        for (const entity of mainEntityListData) {
            const totalAddresses = await fetchTotalAddresses(entity);
            const entityLink = document.createElement('a');
            entityLink.textContent = `${entity.Entity} (${totalAddresses.toLocaleString('en-US')})`;
            entityLink.addEventListener('click', async () => {
                const allLinks = document.querySelectorAll('#menu a');
                allLinks.forEach(link => link.classList.remove('active'));
                entityLink.classList.add('active');
                const data = await splicedData(entity.Entity);
                data.sort((a, b) => parseFloat(b[9]) - parseFloat(a[9]));
                shared.createTable(data, 'DataTableContainer', entity.Entity);
                toggleMenu(); 
            });
            const entityListItem = document.createElement('div');
            entityListItem.appendChild(entityLink);
            menu.appendChild(entityListItem);
        }
        const toggleBtn = document.getElementById('toggle-btn');
        const menuContainer = document.getElementById('menu-container');
        toggleBtn.addEventListener('click', function () {
            menu.classList.toggle('visible');
        });
    } catch (error) {
        console.error('Error fetching dynamic menu data:', error);
    }
}

document.addEventListener('DOMContentLoaded', populateMenu);
EntitiesSummary("All");
populateMenu();

});
