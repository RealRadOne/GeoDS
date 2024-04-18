export function clusterplot(data) {

  const concentrations = Object.values(data.Concentration);
  const elements = Object.values(data.Element);
  const xRegions = Object.values(data.XRegion);
  const yRegions = Object.values(data.YRegion);

  const elementColors = {};
  elements.forEach((element, index) => {
    if (!elementColors[element]) {
      const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
      elementColors[element] = color;
    }
  });

  const elementGroups = {};
  elements.forEach((element, index) => {
    if (!elementGroups[element]) {
      elementGroups[element] = {
        xRegions: [],
        yRegions: [],
        concentrations: [],
        color: elementColors[element]
      };
    }
    elementGroups[element].xRegions.push(xRegions[index]);
    elementGroups[element].yRegions.push(yRegions[index]);
    elementGroups[element].concentrations.push(concentrations[index]);
  });

  const maxDataPoints = Math.max(...Object.values(elementGroups).map(group => group.xRegions.length));

  
  const gridSize = 100; 
  const plotData = [];
  const legendData = [];
  
  for (const element in elementGroups) {
    const group = elementGroups[element];
    const xMin = Math.min(...group.xRegions);
    const xMax = Math.max(...group.xRegions);
    const yMin = Math.min(...group.yRegions);
    const yMax = Math.max(...group.yRegions);

    const xStep = (xMax - xMin) / gridSize;
    const yStep = (yMax - yMin) / gridSize;

    const xGrid = new Array(gridSize).fill().map((_, i) => xMin + i * xStep);
    const yGrid = new Array(gridSize).fill().map((_, i) => yMin + i * yStep);

    const zGrid = new Array(gridSize).fill().map(() => new Array(gridSize).fill(0));

    // Fill the grid with concentration values where they exist
    for (let i = 0; i < group.xRegions.length; i++) {
      const xIndex = Math.floor((group.xRegions[i] - xMin) / xStep);
      const yIndex = Math.floor((group.yRegions[i] - yMin) / yStep);
      if (xIndex >= 0 && xIndex < gridSize && yIndex >= 0 && yIndex < gridSize) {
        zGrid[yIndex][xIndex] = group.concentrations[i];
      }
    }

    // Create trace for the element's surface
    const trace = {
      x: xGrid,
      y: yGrid,
      z: zGrid,
      type: 'surface',
      name: element,
      colorscale: [[0, group.color], [1, group.color]],
      showscale: false
    };

    plotData.push(trace);

    legendData.push({
      name: element,
      marker: { color: group.color }
    });
  }

  // Layout for the consolidated plot
  const layout = {
    title: 'Concentration Surface Plot',
    scene: {
      xaxis: { title: 'XRegion', automargin: true },
      yaxis: { title: 'YRegion', automargin: true },
      zaxis: { title: 'Concentration', automargin: true }
    },
    width: 1800, 
    height: 1200,
    showlegend: true,
    margin: {
      l: 100, 
      r: 100, 
      b: 100, 
      t: 100,
      pad: 4 
    }
  };

  // Create a new div element for the consolidated plot
  const plotDiv = document.createElement('div');
  plotDiv.id = `cluster-plot`;
  document.body.appendChild(plotDiv); // Append the div to the body or any other desired parent element

  // Plot the data in the created div
  Plotly.newPlot('cluster-plot', plotData, layout);
}
