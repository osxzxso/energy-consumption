// Read the data from the HTML data attributes
let chartDataElement = document.getElementById('chartData');
let coalYearTotal = JSON.parse(chartDataElement.dataset.coaltotal);
let petrolYearTotal = JSON.parse(chartDataElement.dataset.petroltotal);
let natGasYearTotal = JSON.parse(chartDataElement.dataset.natgastotal);
let otherGasYearTotal = JSON.parse(chartDataElement.dataset.othergastotal);
let geoYearTotal = JSON.parse(chartDataElement.dataset.geototal);
let yearsList = JSON.parse(chartDataElement.dataset.yearslist);

let ctx = document.getElementById('myChart').getContext('2d');
let myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: yearsList,
        datasets: [
            {
                label: 'Coal',
                data: coalYearTotal,
                borderColor: ['gray'],
                backgroundColor: ['gray'],
                fill: false
            },
            {
                label: 'Natural Gas',
                data: natGasYearTotal,
                borderColor: ['rgba(107, 185, 240, 1)'],
                backgroundColor: ['rgba(107, 185, 240, 1)'],
                fill: false
            },
            {
                label: 'Petroleum',
                data: petrolYearTotal,
                borderColor: ['rgba(190, 144, 212,1)'],
                backgroundColor: ['rgba(190, 144, 212,1)'],
                fill: false
            },
            {
                label: 'Other Gas',
                data: otherGasYearTotal,
                borderColor: ['rgba(123, 239, 178, 1)'],
                backgroundColor: ['rgba(123, 239, 178, 1)'],
                fill: false
            },
            {
                label: 'Geothermal',
                data: geoYearTotal,
                borderColor: ['rgba(95, 200, 178, 1)'],
                backgroundColor: ['rgba(95, 200, 178, 1)'],
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true
    }
});