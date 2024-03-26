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
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    ];
    let bitcoinUSDValue = null;
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        bitcoinUSDValue = data.bitcoin.usd;
        if (bitcoinUSDValue !== null) {
          break;
        }
      } catch (error) {
        console.error(`Error fetching Bitcoin/USD value from ${endpoint}:`, error);
      }}
    return bitcoinUSDValue || 0; 
  },

    getBitcoinSupply: async () => {
        const endpoint = 'https://blockchain.info/q/getblockcount'; 
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
        pendingupdates = item[12]
        let row = []; 



        row.push("");
        if (entity === 'Entities Summary') {
            cellHTML = `<span class="title" style="color: #61dafb;">${item[0]}</span>` + (item[1] ? `<span class="title" style="color: white;"> (${item[1].toLocaleString('en-US')} ${item[1] === 1 ? 'Add.' : 'Add.'}) </span>` : '')
                       + `<br><style="padding: 0; margin: 0;">Tags: <span style="color: #61dafb; padding: 0; margin: 0;">${item[11]}</span>`;
                       //+ `<br><p style="padding: 0; margin: 0;">Last Updated: <span style="color: white; padding: 0; margin: 0;">${lastupdate} </span></p>`;
                       //+ `Updates Awaiting Processing: <span style="color: #61dafb; padding: 0; margin: 0;">${pendingupdates.toLocaleString()}</span>`;
                    
            row.push(cellHTML);   
        } else if (entity === 'Search Results') {
            let firstseen = new Date(item[2] * 1000).toLocaleString('en-US', options);
            let cellHTML;
                cellHTML = `${item[1] ? `${item[1]}` : ''} <span class="title" style="color: #61dafb;">${item[0]}</span>
                    <br>First Seen: ${firstseen}</br>`;
            row.push(cellHTML);
        } else {
            let firstseen = new Date(item[2] * 1000).toLocaleString('en-US', options);
            let cellHTML;
                cellHTML = `${item[1] ? `${item[1]}` : ''} <span class="title" style="color: #61dafb;">(${item[0]})</span>
                    <br>First Seen: ${firstseen}</br>`;
            row.push(cellHTML);
        }
        row.push(IncomingTx, OutgoingTx, utxoCount, IncomingBalanceBTC, OutgoingBalanceBTC, RemainingBalanceBTC, RemainingBalanceUSD, totalSupplyPer, AddressesMain, lastupdate);
        rows.push(row); 
    });
    return rows; 
},

createTable: async function (info, containerId, entity) {
    const data = await shared.generateData(info, containerId, entity);
    const lastUpdateTime = data[0][11];
    const totalSupply = await shared.getBitcoinSupply()
    if ($.fn.DataTable.isDataTable('#datatable')) {
        $('#datatable').DataTable().destroy();
    }

    $('#datatable').find('thead th').css('width', '');

    const titleText = entity.toUpperCase();
    $('#title').html('<p>' + titleText + '</p>');

    let columns;
    showFooter();
    let rowNumber = 1; 

    columns = [
        { 
            title: "#", 
            render: function(data, type, row, meta) {
                return rowNumber++; 
            }
        }
    ];

    if (entity === 'Entities Summary') {
        columns.push(
            { 
                title: "Entities", 
                render: function(data, type, row) {
                    return data;
                }, 
                createdCell: function (td, cellData, rowData, rowIndex, colIndex) {
                    td.addEventListener('click', () => {
                        const entityData = rowData[1];
                        const parser = new DOMParser();
                        const htmlDoc = parser.parseFromString(entityData, 'text/html');
                        const titleElement = htmlDoc.querySelector('.title');
                        if (titleElement) {
                            const title = titleElement.textContent.trim();
                            const arrowClickedEvent = new CustomEvent('arrowClicked', {
                                detail: { entityName: title }
                            });
                            document.dispatchEvent(arrowClickedEvent);
                        } else {
                            console.error('.title element not found');
                        }
                    });
                }

            }
        );
    } else {
        columns.push(
            { 
                title: "Address", 
                render: function(data, type, row) {
                    return data;
                }
            }
        );
    }
    columns.push(
        { title: "Funded TXO", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
        { title: "Spent TXO", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
        { title: "UTXOs", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
        { title: "Incoming Balance BTC", render: $.fn.dataTable.render.number(',', '.', 8, '', '') },
        { title: "Outgoing Balance BTC", render: $.fn.dataTable.render.number(',', '.', 8, '', '') },
        { title: "Remaining Balance BTC", render: $.fn.dataTable.render.number(',', '.', 8, '', '') },
        { title: "Balance USD", render: $.fn.dataTable.render.number(',', '.', 0, '', '') },
        { 
            title: "% Supply", 
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
            //{
            //    text: 'Image',
            //    action: function (e, dt, button, config) {
            //        var table = document.getElementById('datatable');
            //        domtoimage.toJpeg(table)
            //            .then(function (dataUrl) {
            //                var link = document.createElement('a');
            //                link.href = dataUrl;
            //                link.download = 'table_image.jpeg';
            //                link.click();
            //            })
            //            .catch(function(error) {
            //                console.error('Error capturing table as image:', error);
            //            });
            //    }
            //},
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

    const order = (entity === 'Top 100 UTXOs') ? [[4, 'desc']] : [[7, 'desc']];

    const dataTable = $('#datatable').DataTable({
        "paging": false,
        "searching": true, 
        "colReorder": true,
        "ordering": true,
        "order": order,
        "dom": 'Bfrtip', 
        "buttons": [
            exportButton
        ],
        "language": {
            "search": "Search In Table: ",
        },
        data: data,
        columns: columns,
        "columnDefs": [
            { "orderable": true, "targets": [0] } ,
            //{ "targets": [1], "width": "350px" }, 
            //{ "targets": [9], "width": "0px" }, 
            { 
                "targets": [0], 
                "footer": function (data, type, row, meta) {
                    return ''; 
                }
            }
        ],
        "drawCallback": function(settings) {
            $('#datatable tfoot th:eq(0)').css({
                "border": "none",
                "background-color": "transparent"
            });
        },

		"initComplete": function(settings, json) {
			if (lastUpdateTime !== 'Invalid Date') {
				var additionalText = $(`<div class="additional-text"><br>Last Update: ${lastUpdateTime}</div>`).insertAfter('#datatable_filter');
			} else {
				var additionalText = $(`<div class="additional-text"></div>`).insertAfter('#datatable_filter');;
			}
			additionalText.css({
				"color": "white",
				"float": "left", 
				"font-size": "14px",
			});
			if ($(window).width() <= 900) {
				additionalText.css({
					"font-size": "10px", 
				});
			}
		}




    });

    if (entity === 'Entities Summary') {
      dataTable.column(-1).visible(false);
    } else {
      dataTable.column(-1).visible(false);
      dataTable.column(-1).visible(false);
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
                totalAddresses += parseInt(row[10]);
            });
            var incomingTxsTotal = filteredData.reduce(function(a, b) {
                return a + b[2];
            }, 0);
            var outgoingTxsTotal = filteredData.reduce(function(a, b) {
                return a + b[3];
            }, 0);
            var utxosTotal = filteredData.reduce(function(a, b) {
                return a + b[4];
            }, 0);
            var incomingBalanceTotal = filteredData.reduce(function(a, b) {
                return a + b[5];
            }, 0);
            var outgoingBalanceTotal = filteredData.reduce(function(a, b) {
                return a + b[6];
            }, 0);
            var remainingBalanceTotal = filteredData.reduce(function(a, b) {
                return a + b[7];
            }, 0);
            var balanceUSDTotals = filteredData.reduce(function(a, b) {
                return a + b[8];
            }, 0);
            var totalSupplyPer = (remainingBalanceTotal / totalSupply) * 100;  

            dataTable.column(0).footer().html = "";
            if (entity === 'Entities Summary') {
                dataTable.column(1).footer().innerHTML = "<span style='color: white;'>Total Entities: </span><span style='color: #61dafb;'>" + totalEntities + "</span><br><span style='color: white;'>Total Addresses: </span><span style='color: #61dafb;'>" + $.fn.dataTable.render.number(',', '.', 0, '', '').display(totalAddresses) + "</span>";
            } else {
                dataTable.column(1).footer().innerHTML = "<span style='color: white;'>Total Addresses: </span><span style='color: #61dafb;'>" + $.fn.dataTable.render.number(',', '.', 0, '', '').display(totalEntities) + "</span>";
            }
            dataTable.column(2).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 0, '', '').display(incomingTxsTotal);
            dataTable.column(3).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 0, '', '').display(outgoingTxsTotal);
            dataTable.column(4).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 0, '', '').display(utxosTotal);
            dataTable.column(5).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 8, '', '').display(incomingBalanceTotal);
            dataTable.column(6).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 8, '', '').display(outgoingBalanceTotal);
            dataTable.column(7).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 8, '', '').display(remainingBalanceTotal);
            dataTable.column(8).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 0, '', '').display(balanceUSDTotals);
            dataTable.column(9).footer().innerHTML = $.fn.dataTable.render.number(',', '.', 4, '', '').display(totalSupplyPer) + '%';
        }
        const start = dataTable.page.info().start; 
        dataTable.column(0, {search: 'applied'}).nodes().each(function(cell, i) {
        cell.innerHTML = i + 1 + start; 
        });
    closePopup();
    }
}};

function showFooter() {
    $('#datatable tfoot').show();
}

function hideFooter() {
    $('#datatable tfoot').hide();
}


async function mergeAndDrawCharts() {
    try {
        const response = await fetch('Data/EntitiesSummary.json');
        const data = await response.json();

        const etfData = collectData(data, 'ETF', 20);
        const cexData = collectData(data, 'CEX', 20);
        const topEntitiesData = collectData(data, 'Companies', 10);

        const mergedData = mergeAndSortData(etfData, cexData, topEntitiesData);

        drawMergedChart(mergedData.labels, mergedData.values);

    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

function collectData(data, dataFilter, limit) {
    const filteredData = data.filter(entry => entry[11].includes(dataFilter));
    const sortedData = filteredData.sort((a, b) => b[8] - a[8]);
    const slicedData = sortedData.slice(0, limit);
    const labels = slicedData.map(entry => entry[0]);
    const values = slicedData.map(entry => parseFloat(entry[8]));
    return { labels, values };
}

function mergeAndSortData(etfData, cexData, topEntitiesData) {
    const allLabels = [].concat(etfData.labels, cexData.labels, topEntitiesData.labels);
    const allValues = [].concat(etfData.values, cexData.values, topEntitiesData.values);

    const etfColor = 'rgba(255, 99, 132, 0.4)'; // Red color for ETFs
    const cexColor = 'rgba(54, 162, 235, 0.4)'; // Blue color for CEX
    const companiesColor = 'rgba(255, 206, 86, 0.4)'; // Yellow color for Companies

    const combinedData = allLabels.map((label, index) => ({
        label,
        value: allValues[index],
        color: label.includes('ETF') ? etfColor : (label.includes('CEX') ? cexColor : companiesColor)
    }));

    combinedData.sort((a, b) => b.value - a.value);

    const sortedLabels = combinedData.map(entry => entry.label);
    const sortedValues = combinedData.map(entry => entry.value);
    const colors = combinedData.map(entry => entry.color);

    return { labels: sortedLabels, values: sortedValues, colors: colors };
}

function drawMergedChart(labels, values, colors) {
    // Create chart canvas
    var canvas = document.createElement('canvas');
    canvas.id = 'myChart';
    canvas.width = 800;
    canvas.height = 300;

    var ctx = canvas.getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: labels,
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var value = context.parsed.y.toFixed(8);
                            return 'Balance: ' + value.toString().replace(/\B(?=(\d{3})+(?!\d)(?=\.\d+$))/g, ",");
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white'
                    }
                }
            }
        }
    });

    const dataContainer = document.getElementById('DataTableContainer');
    dataContainer.appendChild(canvas);
}

function createChartContainer(chartTitle) {
    var chartContainer = document.createElement('div');
    chartContainer.classList.add('chart-container');
    chartContainer.style.marginBottom = '50px';
    
    var chartTitleElement = document.createElement('h3');
    chartTitleElement.textContent = chartTitle;
    chartTitleElement.style.color = 'white';
    chartTitleElement.style.fontSize = '20px';
    chartTitleElement.style.textAlign = 'center';
    chartContainer.appendChild(chartTitleElement);
    
    return chartContainer;
}

function createCanvas() {
    var canvas = document.createElement('canvas');
    canvas.id = 'myChart';
    canvas.width = 800;
    canvas.height = 300;
    return canvas;
}
