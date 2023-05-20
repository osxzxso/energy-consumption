// Read the data from the HTML data attributes
let chartDataElement = document.getElementById('chartData');
let energyTotal = JSON.parse(chartDataElement.dataset.energytotal);
let yearsList = JSON.parse(chartDataElement.dataset.yearslist);

let ctx = document.getElementById('myChart').getContext('2d');
let myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: yearsList,
        datasets: [
            {
                label: 'US Total %%DATANAME%% Consumption by Year',
                data: energyTotal,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)'
                ],

                borderColor: [
                    'rgb(255, 99, 132)'
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
