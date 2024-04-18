// Import necessary functions and modules
import { clusterplot } from './mdscatter.js';


document.addEventListener("DOMContentLoaded", function () {

    // Function to render Clustered MDS Plot
    function render3DPLot() {
        fetch('/show_location_data')
            .then(response => response.json())
            .then(data => {
                clusterplot(data);
            })
            .catch(error => {
                console.error('Error fetching cluster MDS data:', error);
            });
    }

    render3DPLot();

});
