document.addEventListener('DOMContentLoaded', async function () {
  const dummyTabsContainer = document.getElementById('ExpandedMenu1');
  const menuArrow = document.getElementById('menuArrow');

    document.addEventListener('arrowClicked', async (event) => {
      const { entityName } = event.detail;
      window.location.href = `index.html?resource=${entityName}`;  
    });

    function collapseMenu1() {
      try {
        const expandedMenuContainer = document.getElementById('ExpandedMenu1');
        expandedMenuContainer.classList.remove('visible');
      } catch (error) {
        console.error('Error collapsing menu:', error);
      }
    }
  
async function splicedData(entity) {
    try {
        const entityresponse = await fetch(`Data/Entities/${entity}.json`);
        const entitydata = await entityresponse.json();
        if (entitydata) {
            const dataForAddresses = [];
            entitydata.Titles.forEach(titleData => {
                titleData.Addresses.forEach(address => {
                    const [Address, FirstSeen, IncomingTx, OutgoingTx, UTXOs, IncomingBalance, OutgoingBalance, RemainingBalance, MempoolTxn] = address.split(', ');
                    const addressDataArray = [Address, titleData.Title, FirstSeen, IncomingTx, OutgoingTx, UTXOs, IncomingBalance, OutgoingBalance, RemainingBalance, MempoolTxn];
                    dataForAddresses.push(addressDataArray);
                });
            });
            return dataForAddresses; 
        }
    } catch (error) {
        console.error(error);
    }
}
            
async function EntitiesSummary(entities) {
    try {
        const response = await fetch(`Data/EntitiesSummary.json`);
        const data = [];
        const entityresponse = await response.json();
        await shared.createTable(entityresponse, 'DataTableContainer', `Entities Summary`);
    } catch (error) {
        console.error('Error fetching entity response:', error);
    }
}

async function ExpandedMenu1() {
  collapseMenu1();
  try {
    const tabs = ["Bitcoin Network Statistics", "Bitcoin Education (Coming Soon)", "Txn Fees Calculator", "About"];
    const expandedMenuContainer = document.getElementById('ExpandedMenu1');
    tabs.forEach(tab => {
      const tabElement = document.createElement('a');
      tabElement.textContent = tab;
      tabElement.classList.add('tab');
      expandedMenuContainer.appendChild(tabElement);
      tabElement.addEventListener('click', function () {
        handleTabClick(tab);
        expandedMenuContainer.classList.remove('visible');
      });
    });

    function handleTabClick(tab) {
      const allTabs = document.querySelectorAll('.tab');
      allTabs.forEach(tabElement => tabElement.classList.remove('active'));
      switch (tab) {
        case "Bitcoin Network Statistics":
            console.log("sd")
          openPopup('netstats.html');
          break;
        case "Bitcoin Education":
          openPopup('bitcoinedu.html');
          break;
        case "Txn Fees Calculator":
          openPopup('feescal.html');
          break;
        case "About":
          openPopup('about.html');
          break;
      }}

    menuArrow.addEventListener('click', function () {
      expandedMenuContainer.classList.toggle('visible');
    });
  } catch (error) {
    console.error('Error fetching dynamic menu data:', error);
  }
}

async function handleEntityClick(entityName) {
    try {
        if (entityName === 'EntitiesSummary') {
            EntitiesSummary("All");
        } else if (entityName === 'Richest100Addresses') { 
            const entityresponse = await fetch(`Data/Top100Richest.json`); 
            const data = await entityresponse.json();
            shared.createTable(data, 'DataTableContainer', "Richest 100 Addresses");
        } else if (entityName === 'Top100UTXOs') { 
            const entityresponse = await fetch(`Data/Top100UTXOReduced.json`); 
            const data = await entityresponse.json();
            shared.createTable(data, 'DataTableContainer', "Top 100 UTXOs");
        } else {
            const data = await splicedData(entityName);
            if (data) {
                openPopup('loading.html');
                await shared.createTable(data, 'DataTableContainer', entityName);
            } else {
                openPopup('invalidlink.html');
                setTimeout(() => {
                    window.location.href = '/'
                    EntitiesSummary("All");
                }, 3000); 
            }
        }
    } catch (error) {
        console.error('Error handling entity click:', error);
    }
}

async function handleUrlParameters() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const entityParam = urlParams.get('resource');
        if (entityParam) {
            handleEntityClick(entityParam);
        } else {
            handleEntityClick('EntitiesSummary');
        }
    } catch (error) {
        console.error('Error handling URL parameters:', error);
    }
}

async function populateMenu() {
    try {
        const menu = document.getElementById('menu');
        menu.innerHTML = ''; 

        const entityLink1 = document.createElement('a');
        entityLink1.textContent = `Entities Summary`;
        entityLink1.href = `index.html?resource=EntitiesSummary`;
        entityLink1.addEventListener('click', (event) => {
            event.preventDefault(); 
            const allLinks = document.querySelectorAll('#menu a');
            allLinks.forEach(link => link.classList.remove('active'));
            entityLink1.classList.add('active');
            window.location.href = `index.html?resource=EntitiesSummary`; 
        });
        menu.appendChild(entityLink1);

        const entityLink2 = document.createElement('a');
        entityLink2.textContent = `Richest 100 Addresses`;
        entityLink2.href = `index.html?resource=Richest100Addresses`; 
        entityLink2.addEventListener('click', (event) => {
            event.preventDefault(); 
            const allLinks = document.querySelectorAll('#menu a');
            allLinks.forEach(link => link.classList.remove('active'));
            entityLink2.classList.add('active');
            window.location.href = `index.html?resource=Richest100Addresses`;
        });
        menu.appendChild(entityLink2);

        const entityLink3 = document.createElement('a');
        entityLink3.textContent = `Top 100 UTXOs`;
        entityLink3.href = `index.html?resource=Top100UTXOs`; 
        entityLink3.addEventListener('click', (event) => {
            event.preventDefault(); 
            const allLinks = document.querySelectorAll('#menu a');
            allLinks.forEach(link => link.classList.remove('active'));
            entityLink3.classList.add('active');
            window.location.href = `index.html?resource=Top100UTXOs`; 
        });
        menu.appendChild(entityLink3);

        const entitiesSummaryResponse = await fetch('Data/EntitiesSummary.json');
        const entitiesSummaryData = await entitiesSummaryResponse.json();
        for (const entityData of entitiesSummaryData) {
            const entityName = entityData[0];
            const totalAddresses = entityData[1];
            const entityLink = document.createElement('a');
            entityLink.textContent = `${entityName} (${totalAddresses.toLocaleString('en-US')})`;
            entityLink.href = `index.html?resource=${entityName}`;
            entityLink.addEventListener('click', (event) => {
                event.preventDefault();
                const allLinks = document.querySelectorAll('#menu a');
                allLinks.forEach(link => link.classList.remove('active'));
                entityLink.classList.add('active');
                window.location.href = `index.html?resource=${entityName}`
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
handleUrlParameters();
populateMenu();
ExpandedMenu1();

});
