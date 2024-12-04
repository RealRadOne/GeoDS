import { elementplot } from './elementplot.js';
import { spectraplot } from './spectraplot.js';
import { createResponsePlot } from './spectraplot.js';

document.addEventListener("DOMContentLoaded", function () {
    function showLoadingSpinner() {
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.style.visibility = 'visible';
        }
    }

    function hideLoadingSpinner() {
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.style.visibility = 'hidden';
        }
    }

    function processAndLoad() {
        showLoadingSpinner();
        fetch('/process_and_load')
            .then(response => response.json())
            .then(data => {
                console.log('Processing and loading completed');
                render3DPlot();
                renderSpectraPlot();
            })
            .catch(error => {
                console.error('Error processing and loading data:', error);
            })
            .finally(() => {
                hideLoadingSpinner();
            });
    }

    function render3DPlot() {
        fetch('/show_location_data')
            .then(response => response.json())
            .then(data => {
                elementplot(data);
            })
            .catch(error => {
                console.error('Error fetching element concentration data:', error);
            });
    }

    function renderSpectraPlot() {
        fetch('/show_elid_data')
            .then(response => response.json())
            .then(data => {
                // Use the updated ID for the container
                console.log(data)
                const spectraplotContainer = document.getElementById('spectraplot');
                spectraplot(data, spectraplotContainer);
            })
            .catch(error => {
                console.error('Error fetching spectra data:', error);
            });
    }

    // Start the process
    processAndLoad();
});
