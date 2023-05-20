// Read the data from the HTML data attributes
let chartDataElement = document.getElementById('chartData');
let coalYearTotal = JSON.parse(chartDataElement.dataset.coaltotal);
let petrolYearTotal = JSON.parse(chartDataElement.dataset.petroltotal);
let natGasYearTotal = JSON.parse(chartDataElement.dataset.natgastotal);
let otherGasYearTotal = JSON.parse(chartDataElement.dataset.othergastotal);
let geoYearTotal = JSON.parse(chartDataElement.dataset.geototal);
let dataName = chartDataElement.dataset.dataname;

let ctx = document.getElementById('myChart').getContext('2d');
let myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ["Coal", 'Petroleum', 'Natural Gas', 'Other Gas', 'Geothermal'],
        datasets: [{
            label: 'Energy Consumption for ' + dataName,
            data: [coalYearTotal, petrolYearTotal, natGasYearTotal, otherGasYearTotal, geoYearTotal],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 205, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(75, 165, 205, 0.2)'
            ],

            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgba(75, 165, 205)'
            ],
            fill: true,
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true
    }
});