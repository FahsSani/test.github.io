const tableContainer = document.getElementById('DataTableContainer');
const titleContainer = document.getElementById('title-container');
const buttonContainer = document.getElementById('button-container');
const title = document.getElementById('title');
const excelButton = document.querySelector('.btn-export-excel');
const pdfButton = document.querySelector('.btn-export-pdf');
const searchContainer = document.getElementById('datatable_filter');
const dataTableWrapper = document.getElementById('datatable_wrapper');

const shared = {
    
  getBitcoinUSDValue: async () => {
    const apiEndpoints = [
      'https://mempool.space/api/v1/prices',
    ];
    let bitcoinUSDValue = null;
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        bitcoinUSDValue = data.USD;
        if (bitcoinUSDValue !== null) {
          break;
        }
      } catch (error) {
        console.error(`Error fetching Bitcoin/USD value from ${endpoint}:`, error);
      }}
    return bitcoinUSDValue || 0; 
  },

    getBitcoinSupply: async () => {
        const endpoint = 'https://mempool.space/api/blocks/tip/height'; 
        let BitcoinSupply = 0;  
        try {
            const response = await fetch(endpoint);
            const blockHeightData = await response.json();  
            if (blockHeightData !== null) {
                for (let i = 0; i < Math.floor(blockHeightData / 210000); i++) {
                    const supplyInInterval = 210000 * (50 / Math.pow(2, i));
                    BitcoinSupply += supplyInInterval;
                }
                const remainingBlocks = blockHeightData % 210000;
                const lastIntervalSupply = remainingBlocks * (50 / Math.pow(2, Math.floor(blockHeightData / 210000)));
                BitcoinSupply += lastIntervalSupply;
            }
        } catch (error) {
            console.error(`Error fetching Bitcoin/USD value from ${endpoint}:`, error);
        }
        return BitcoinSupply || 0;
    },
      
generateData: async function (data, containerId, entity) {
    const table = document.createElement('table');
    let Address;
    const bitcoinUSDValue = await shared.getBitcoinUSDValue();
    const totalSupply = await shared.getBitcoinSupply()
    const rows = [];

    data.forEach((item, rowIndex) => {
        const AddressesMain = item[1];        
        const MempoolTxn = parseFloat(item[9]) || 0;
        const IncomingTx = parseFloat(item[3]) || 0;
        const OutgoingTx = parseFloat(item[4]) || 0;
        const utxoCount = parseFloat(item[5]) || 0;
        const IncomingBalanceBTC = parseFloat(item[6]) || 0;
        const OutgoingBalanceBTC = parseFloat(item[7]) || 0;
        const RemainingBalanceBTC = parseFloat(item[8]) || 0;
        const RemainingBalanceUSD = RemainingBalanceBTC * bitcoinUSDValue;
        const totalSupplyPer = RemainingBalanceBTC / totalSupply;

        let options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short' };
        let lastupdate = new Date(item[10] * 1000).toLocaleString('en-US', options);
        let row = []; 


        if (entity === 'Entities Summary') {
            cellHTML = `<span class="title" style="color: red;">${item[0]}</span>` + (item[1] ? `<span class="title" style="color: white;"> (${item[1].toLocaleString('en-US')} ${item[1] === 1 ? 'Add.' : 'Add.'}) </span>` : '') + `<style="padding: 0; margin: 0;">, Tag: <span style="color: red; padding: 0; margin: 0;">${item[11]}</span>`
                       + `<br><p style="padding: 0; margin: 0;">Last Updated: <span style="color: white; padding: 0; margin: 0;">${lastupdate} </span></p>`;
                    
            row.push(cellHTML);   
        } else {
            let firstseen = new Date(item[2] * 1000).toLocaleString('en-US', options);
            let cellHTML;
                cellHTML = `${item[1] ? `${item[1]}` : ''} <span class="title" style="color: red;">(${item[0]})</span>
                    <br>First Seen: ${firstseen}</br>`;
            row.push(cellHTML);
        }
        row.push(IncomingTx, OutgoingTx, utxoCount, IncomingBalanceBTC, OutgoingBalanceBTC, RemainingBalanceBTC, RemainingBalanceUSD, totalSupplyPer, AddressesMain);
        rows.push(row); 
    });
    return rows; 
},

createTable: async function (info, containerId, entity) {
    const table = await shared.generateData(info, containerId, entity);
    const data = table;
    const totalSupply = await shared.getBitcoinSupply()

    if ($.fn.DataTable.isDataTable('#datatable')) {
        $('#datatable').DataTable().destroy();
    }

    $('#datatable').find('thead th').css('width', '');

    const titleText = entity.toUpperCase();
    $('#title').html(titleText);

    let columns;
    showFooter();

    if (entity === 'Entities Summary') {
        columns = [
            { 
                title: "Entities", 
                render: function(data, type, row) {
                    return data;
                }, 
                createdCell: function (td, cellData, rowData, rowIndex, colIndex) {
                    td.addEventListener('click', () => {
                        const entityName = rowData[0];
                        const parser = new DOMParser();
                        const htmlDoc = parser.parseFromString(entityName, 'text/html');
                        const titleElement = htmlDoc.querySelector('.title');
                        const title = titleElement.textContent.trim();
                        const arrowClickedEvent = new CustomEvent('arrowClicked', {
                            detail: { entityName: title },
                        });
                        document.dispatchEvent(arrowClickedEvent);
                    });
                }},
        ];
    } else {
        columns = [
            { 
                title: "Address", 
                render: function(data, type, row) {
                    return data;
                }},
        ];
    }
    columns.push(
        { title: "Incoming Txs", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
        { title: "Outgoing Txs", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
        { title: "UTXOs", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
        { title: "Incoming Balance BTC", render: $.fn.dataTable.render.number(',', '.', 8, '', '') },
        { title: "Outgoing Balance BTC", render: $.fn.dataTable.render.number(',', '.', 8, '', '') },
        { title: "Remaining Balance BTC", render: $.fn.dataTable.render.number(',', '.', 8, '', '') },
        { title: "Balance USD", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
        { 
            title: "% Of Supply", 
            render: function (data) {
                return (parseFloat(data) * 100).toFixed(4) + '%';
            } 
        },
        { title: "TotalAddresses", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
    );
    var exportButton = {
        extend: 'collection',
        text: 'Export',
        buttons: [
            {
                extend: 'copyHtml5',
                footer: true,
            },
            {
                text: 'Image',
                action: function (e, dt, button, config) {
                    var table = document.getElementById('datatable');
                    domtoimage.toJpeg(table)
                        .then(function (dataUrl) {
                            var link = document.createElement('a');
                            link.href = dataUrl;
                            link.download = 'table_image.jpeg';
                            link.click();
                        })
                        .catch(function(error) {
                            console.error('Error capturing table as image:', error);
                        });
                }
            },
            {
                extend: 'csvHtml5',
                footer: true 
            },
            {
                extend: 'excelHtml5',
                footer: true 
            },
            {
                extend: 'pdfHtml5',
                footer: true,
                orientation: 'landscape',
                pageSize: 'A3', 
                exportOptions: {
                    columns: ':visible'
                },
                customize: function(doc) {
                    doc.pageMargins = [5, 5, 5, 5]; 
                    doc.defaultStyle.alignment = 'center';
                }
            }
        ],
        dropdown: {
            align: 'bottom',
            style: {
                marginTop: '100px'
            }
        }
    };
    
    const dataTable = $('#datatable').DataTable({
        "paging": false,
        "searching": true, 
        "colReorder": true,
        "ordering": true, 
        "order": [[7, 'desc']], 
        "dom": 'Bfrtip', 
        "buttons": [
            exportButton
        ],
        "language": {
            "search": "Search: ",
        },
        data: data,
        columns: columns,
        "columnDefs": [
            { "orderable": true, "targets": [0] } ,
            { "targets": [0], "width": "350px" }, 
            { "targets": [8], "width": "0px" } 
        ],

    });

    if (entity === 'Entities Summary') {
      dataTable.column(-1).visible(false);
    } else {
      dataTable.column(-1).visible(false);
      dataTable.column(-2).visible(false);
    }

    $('#datatable').on('column-reorder.dt', function (e, settings, details) {
        console.log('Column ' + details.column + ' reordered to position ' + details.to);
    });

    $('#datatable tbody').on('click', 'tr', function () {
        $(this).toggleClass('selected');
    });

    $('#datatable_filter input').on('input', function() {
        dataTable.draw();
    });

    dataTable.on('draw.dt', function() {
        setTimeout(function() {
            updateFooterCallback();
        }, 0);
    });

    const tableCreatedEvent = new CustomEvent('tableCreated', {
        detail: { entityName: entity }
    });
    setTimeout(function() {
        document.dispatchEvent(tableCreatedEvent);
        updateFooterCallback();
    }, 1);

    function updateFooterCallback(data) {
        if (dataTable && $.fn.DataTable.isDataTable('#datatable')) {
            var filteredData = dataTable.rows({ search: 'applied' }).data();
            var totalEntities = filteredData.length;
            var totalAddresses = 0;
            filteredData.each(function(row) {
                totalAddresses += parseInt(row[9]);
            });
            var incomingTxsTotal = filteredData.reduce(function(a, b) {
                return a + b[1];
            }, 0);
            var outgoingTxsTotal = filteredData.reduce(function(a, b) {
                return a + b[2];
            }, 0);
            var utxosTotal = filteredData.reduce(function(a, b) {
                return a + b[3];
            }, 0);
            var incomingBalanceTotal = filteredData.reduce(function(a, b) {
                return a + b[4];
            }, 0);
            var outgoingBalanceTotal = filteredData.reduce(function(a, b) {
                return a + b[5];
            }, 0);
            var remainingBalanceTotal = filteredData.reduce(function(a, b) {
                return a + b[6];
            }, 0);
            var balanceUSDTotals = filteredData.reduce(function(a, b) {
                return a + b[7];
            }, 0);
            var totalSupplyPer = (remainingBalanceTotal / totalSupply) * 100;  

            if (entity === 'Entities Summary') {
                dataTable.column(0).footer().innerHTML = "Total Entities: <span style='color: red;'>" + totalEntities + "</span> Total Addresses: <span style='color: red;'>" + $.fn.dataTable.render.number(',', '.', 0, '', '').display(totalAddresses) + "</span>";
            } else {
                dataTable.column(0).footer().innerHTML = "Total Addresses: <span style='color: red;'>" + $.fn.dataTable.render.number(',', '.', 0, '', '').display(totalEntities) + "</span>";
            }
            dataTable.column(1).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 0, '', '').display(incomingTxsTotal);
            dataTable.column(2).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 0, '', '').display(outgoingTxsTotal);
            dataTable.column(3).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 0, '', '').display(utxosTotal);
            dataTable.column(4).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 8, '', '').display(incomingBalanceTotal);
            dataTable.column(5).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 8, '', '').display(outgoingBalanceTotal);
            dataTable.column(6).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 8, '', '').display(remainingBalanceTotal);
            dataTable.column(7).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 0, '', '').display(balanceUSDTotals);
            dataTable.column(8).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 4, '', '').display(totalSupplyPer) + '%';
        }
    }  
}};

function showFooter() {
    $('#datatable tfoot').show();
}

function hideFooter() {
    $('#datatable tfoot').hide();
}



