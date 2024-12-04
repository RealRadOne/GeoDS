export function spectraplot(spectraData, container) {
    const width = 800;  
    const height = 600; 

    const canvas = d3.select(container)
                     .append("canvas")
                     .attr("width", width)
                     .attr("height", height)
                     .node();

    const context = canvas.getContext("2d");

    const xScale = d3.scaleLinear()
                     .domain([0, spectraData[0].length])
                     .range([0, width]);

    const yScale = d3.scaleLinear()
                     .domain([0, spectraData.length])
                     .range([0, height]);

    const colorScale = d3.scaleSequential(d3.interpolatePlasma)
                         .domain([d3.min(spectraData.flat()), d3.max(spectraData.flat())]);

    // Draw the data on the canvas
    spectraData.forEach((row, i) => {
        row.forEach((value, j) => {
            const x = xScale(j);
            const y = yScale(i);
            const intensity = value;

            // Set the color based on intensity
            context.fillStyle = colorScale(intensity);

            // Draw the point (a small circle) at each (x, y) location
            context.beginPath();
            context.arc(x, y, 3, 0, 2 * Math.PI);
            context.fill();
        });
    });

    // Add labels and title
    context.fillStyle = "black";
    context.font = "16px Arial";
    context.fillText("3D Spectra Map", width / 2 - 50, 30);
    context.fillText("X Axis", width - 50, height - 20);
    context.fillText("Y Axis", 20, height / 2);

    // Create a tooltip element
    const tooltip = d3.select(container)
                      .append("div")
                      .style("position", "absolute")
                      .style("background", "rgba(255, 255, 255, 0.9)")
                      .style("border", "1px solid #ccc")
                      .style("padding", "5px")
                      .style("border-radius", "4px")
                      .style("font-size", "12px")
                      .style("display", "none");

    canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();

        // Get the clicked coordinates relative to the canvas
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Map canvas coordinates to data indices
        const j = Math.round(xScale.invert(x));
        const i = Math.round(yScale.invert(y));

        // Check if the indices are within bounds
        if (i >= 0 && i < spectraData.length && j >= 0 && j < spectraData[0].length) {
            const pixelValue = spectraData[i][j];

            // Show tooltip with pixel value
            tooltip.style("left", `${event.clientX + 10}px`)
                   .style("top", `${event.clientY + 10}px`)
                   .style("display", "block")
                   .html(`X: ${j}, Y: ${i}, Value: ${pixelValue}`);

            // Send the coordinates to the server
            sendCoordinates(x, y);
        } else {
            tooltip.style("display", "none");
        }
    });

    canvas.addEventListener("mouseleave", () => {
        tooltip.style("display", "none");
    });

    function sendCoordinates(x, y) {
        console.log(`Clicked coordinates: x=${x}, y=${y}`);

        fetch("/show_pixel_data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ x: x, y: y }),
        })
            .then(response => response.json())
            .then(data => {
                console.log("Response from server:", data);

                // Now, update the response plot next to the spectraplot
                const responsePlotContainer = document.getElementById('response-plot-container');
                
                // Ensure response plot is visible
                responsePlotContainer.style.display = 'block';

                // Call the function to create the response plot
                createResponsePlot(data, '#response-plot-container');
            })
            .catch(error => console.error("Error sending coordinates:", error));
    }
}


export function createResponsePlot(responseData, container) {
    const width = 800;  
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    // Clear the previous plot by removing any existing canvas or plot elements in the container
    d3.select(container).selectAll("*").remove();

    // Set up the canvas
    const canvas = d3.select(container)
                     .append("canvas")
                     .attr("width", width + margin.left + margin.right)
                     .attr("height", height + margin.top + margin.bottom)
                     .node();
    const context = canvas.getContext("2d");

    // Implement a custom Epanechnikov kernel function
    function epanechnikovKernel(x, bandwidth) {
        if (Math.abs(x) <= bandwidth) {
            return 0.75 * (1 - (x * x) / (bandwidth * bandwidth));
        } else {
            return 0;
        }
    }

    // Perform Kernel Density Estimation (KDE) manually
    function kde(data, bandwidth) {
        const density = [];
        const min = d3.min(data);
        const max = d3.max(data);
        const step = (max - min) / 100; // Step size for density estimation

        // For each point in the data range, calculate the density
        for (let i = min; i <= max; i += step) {
            let sum = 0;
            data.forEach(value => {
                sum += epanechnikovKernel(i - value, bandwidth);
            });
            density.push([i, sum / data.length]);
        }

        return density;
    }

    // Apply KDE to the responseData
    const bandwidth = 1;  // Adjust the bandwidth to change the smoothness
    const density = kde(responseData, bandwidth);

    // Define scales for X and Y axes
    const xScale = d3.scaleLinear()
                     .domain([d3.min(responseData), d3.max(responseData)])
                     .range([margin.left, width - margin.right]);

    const maxDensity = d3.max(density, d => d[1]);
    const yScale = d3.scaleLinear()
                     .domain([0, maxDensity])
                     .range([height - margin.bottom, margin.top]);

    // Draw the axes on the canvas
    context.strokeStyle = "black";
    context.lineWidth = 1;

    // X axis
    context.beginPath();
    context.moveTo(margin.left, height - margin.bottom);  // Start at bottom-left
    context.lineTo(width - margin.right, height - margin.bottom);  // End at bottom-right
    context.stroke();

    // Y axis
    context.beginPath();
    context.moveTo(margin.left, height - margin.bottom);  // Start at bottom-left
    context.lineTo(margin.left, margin.top);  // End at top-left
    context.stroke();

    // Draw X axis ticks and labels
    const xTicks = xScale.ticks(6);
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillStyle = "black";

    xTicks.forEach(tick => {
        const x = xScale(tick);
        context.beginPath();
        context.moveTo(x, height - margin.bottom);
        context.lineTo(x, height - margin.bottom + 5); // Tick length
        context.stroke();

        // Label
        context.fillText(tick.toFixed(2), x, height - margin.bottom + 10);
    });

    // Draw Y axis ticks and labels
    const yTicks = yScale.ticks(6);
    context.textAlign = "right";
    context.textBaseline = "middle";

    yTicks.forEach(tick => {
        const y = yScale(tick);
        context.beginPath();
        context.moveTo(margin.left, y);
        context.lineTo(margin.left - 5, y); // Tick length
        context.stroke();

        // Label
        context.fillText(tick.toFixed(2), margin.left - 10, y);
    });

    // Plot the density curve (KDE)
    context.beginPath();
    context.strokeStyle = "steelblue";
    context.lineWidth = 2;

    density.forEach((d, i) => {
        const x = xScale(d[0]);  // Scale X-axis
        const y = yScale(d[1]);  // Scale Y-axis
        if (i === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    });

    context.stroke();

    // Add plot title
    context.fillStyle = "black";
    context.font = "14px Arial";
    context.textAlign = "center";
    context.fillText("Density Plot (KDE)", width / 2, margin.top - 5);
}

