const apiEndpoints = [
  'https://mempool.space/api/address/',
];


const fetchBalances = async (addresses) => {
  const errors = []; // Array to store errors
  try {
    const dataTable = [];

    for (let i = 0; i < addresses.length; i++) {
      const array = addresses[i];
      const address = array[0];

      let success = false;
      for (let retryCount = 0; retryCount < 1; retryCount++) { 
        let apiIndex = 0; 
        while (apiIndex < apiEndpoints.length) {
          try {
            const apiEndpoint = apiEndpoints[apiIndex];
            const response = await fetch(`${apiEndpoint}${address}`);
            const data = await response.json();
            if (
              data.chain_stats?.funded_txo_count >= 0 &&
              data.chain_stats?.funded_txo_sum >= 0 &&
              data.chain_stats?.spent_txo_count >= 0 &&
              data.chain_stats?.spent_txo_sum >= 0 &&
              data.chain_stats?.tx_count >= 0 &&
              data.mempool_stats?.funded_txo_count >= 0 &&
              data.mempool_stats?.funded_txo_sum >= 0 &&
              data.mempool_stats?.spent_txo_count >= 0 &&
              data.mempool_stats?.spent_txo_sum >= 0 &&
              data.mempool_stats?.tx_count >= 0
            ) {
              // Populate data
              const tableData = [
                address,
                array[1],
                array[2],
                parseFloat(data.chain_stats.tx_count + data.mempool_stats.tx_count) || 0,
                parseFloat(data.chain_stats.spent_txo_count + data.mempool_stats.spent_txo_count) || 0,
                parseFloat(data.chain_stats.funded_txo_count + data.mempool_stats.funded_txo_count) - parseFloat(data.chain_stats.spent_txo_count + data.mempool_stats.spent_txo_count) || 0,
                parseFloat((data.chain_stats.funded_txo_sum + data.mempool_stats.funded_txo_sum) / 100000000) || 0,
                parseFloat((data.chain_stats.spent_txo_sum + data.mempool_stats.spent_txo_sum) / 100000000) || 0,
                parseFloat((data.chain_stats.funded_txo_sum + data.mempool_stats.funded_txo_sum - data.chain_stats.spent_txo_sum - data.mempool_stats.spent_txo_sum) / 100000000) || 0,
                parseFloat(data.mempool_stats.tx_count) || 0
              ];

              dataTable.push(tableData);
              success = true;
              break;
            }
          } catch (error) {
            console.error(`Error fetching data for address ${address} from ${apiEndpoints[apiIndex]}:`, error);
            if (error.response && error.response.status === 404) {
              errors.push(`Address ${address} not found`);
            } else {
              openPopup('messageboard.html');
              errors.push(`Error fetching data for address ${address} from ${apiEndpoints[apiIndex]}: ${error.message}`);
              await new Promise(resolve => setTimeout(resolve, 100)); 
            }
          }
          apiIndex++;
        }
        if (success) {
          await new Promise(resolve => setTimeout(resolve, 100)); 
          break;
        }
      }
    }

    if (errors.length === 0) {
      shared.createTable(dataTable, 'DataTableContainer', "Search Results");
    }
  } catch (error) {
    console.error('Error in fetchBalances:', error);
    errors.push(error.message);
  }
};

const searchAndFetchData = async () => {
  let errorcounter = 0;
  try {
    const searchInput = document.getElementById('searchInput');
    const searchValue = searchInput.value.trim();

    const addresses = searchValue.split(',').map(address => address.trim()).filter(Boolean);
    const addressArray = await Promise.all(addresses.map(async address => {
      try {
        const responseApi = await fetch(`https://blockchain.info/q/addressfirstseen/${address}`);
        const firstseen = await responseApi.json();
        return [address, "", firstseen];
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.error(`Address ${address} is invalid.`);
          searchInput.value = `${address} (invalid)`;
          errorcounter = errorcounter + 1;
          errors.push(`Address ${address} not found`);
        } else {
          console.error(`Error fetching data for address ${address}:`, error);
          errors.push(`Error fetching data for address ${address}: ${error.message}`);
        }
        return null;
      }
    }));

    // Check if any invalid addresses were encountered
    if (errorcounter > 0) {
      showPopup(errors.join('\n')); // Display all errors in the popup
      console.error('Invalid address(es) found. Stopping execution.');
      return;
    } else {
      const validAddressArray = addressArray.filter(addressData => addressData !== null);
      if (validAddressArray.length > 0) {
        await fetchBalances(validAddressArray);
      } else {
        showPopup('No valid addresses found.');
        console.error('No valid addresses found.');
      }
    }
  } catch (error) {
    console.error('Error in searchAndFetchData:', error);
    showPopup(error.message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchFetchArrow = document.getElementById('searchFetchArrow');

  searchInput.addEventListener('keydown', async function (event) {
    if (event.key === 'Enter') {
      await searchAndFetchData();
      searchInput.value = '';
    }
  });

  searchFetchArrow.addEventListener('click', async function () {
    await searchAndFetchData();
    searchInput.value = '';
  });
});
