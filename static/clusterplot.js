export function clusterplot(data) {
  const concentrations = Object.values(data.Concentration);
  const elements = Object.values(data.Element);
  const xRegions = Object.values(data.XRegion);
  const yRegions = Object.values(data.YRegion);
  const uniqueElements = [...new Set(elements)];

  const groupColors = ['red', 'green', 'blue'];

  const elementGroups = {};
  elements.forEach((element, index) => {
      if (!elementGroups[element]) {
          elementGroups[element] = {
              xRegions: [],
              yRegions: [],
              concentrations: []
          };
      }
      elementGroups[element].xRegions.push(xRegions[index]);
      elementGroups[element].yRegions.push(yRegions[index]);
      elementGroups[element].concentrations.push(concentrations[index]);
  });

  const elementList = document.getElementById('element-list');
  uniqueElements.forEach(element => {
      const listItem = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = element;
      checkbox.id = `checkbox-${element}`;

      const label = document.createElement('label');
      label.htmlFor = `checkbox-${element}`;
      label.innerText = element;

      listItem.appendChild(checkbox);
      listItem.appendChild(label);
      elementList.appendChild(listItem);
  });

  function plotAllElements() {
      const traces = uniqueElements.map((element, idx) => {
          const groupData = elementGroups[element];
          const color = groupColors[idx % groupColors.length];

          const xMin = Math.min(...groupData.xRegions);
          const xMax = Math.max(...groupData.xRegions);
          const yMin = Math.min(...groupData.yRegions);
          const yMax = Math.max(...groupData.yRegions);

          const gridSize = 100;
          const xStep = (xMax - xMin) / gridSize;
          const yStep = (yMax - yMin) / gridSize;

          const xGrid = new Array(gridSize).fill().map((_, i) => xMin + i * xStep);
          const yGrid = new Array(gridSize).fill().map((_, i) => yMin + i * yStep);

          const zGrid = new Array(gridSize).fill().map(() => new Array(gridSize).fill(0));

          for (let i = 0; i < groupData.xRegions.length; i++) {
              const xIndex = Math.floor((groupData.xRegions[i] - xMin) / xStep);
              const yIndex = Math.floor((groupData.yRegions[i] - yMin) / yStep);
              if (xIndex >= 0 && xIndex < gridSize && yIndex >= 0 && yIndex < gridSize) {
                  zGrid[yIndex][xIndex] = groupData.concentrations[i];
              }
          }

          return {
              x: xGrid,
              y: yGrid,
              z: zGrid,
              type: 'surface',
              name: element,
              colorscale: [[0, color], [1, color]],
              showscale: false
          };
      });

      const layout = {
          title: 'Concentration Surface Plot for All Elements',
          scene: {
              xaxis: { title: 'XRegion', automargin: true },
              yaxis: { title: 'YRegion', automargin: true },
              zaxis: { title: 'Concentration', automargin: true }
          },
          width: 850,
          height: 850,
          margin: {
              l: 50,
              r: 50,
              b: 50,
              t: 50,
              pad: 4
          }
      };

      Plotly.newPlot('plot-container', traces, layout);
  }

  function plotSelectedElements() {
      const selectedElements = Array.from(document.querySelectorAll('#element-list input:checked')).map(input => input.value);
      const traces = selectedElements.map((element, idx) => {
          const groupData = elementGroups[element];
          const color = groupColors[idx % groupColors.length];

          const xMin = Math.min(...groupData.xRegions);
          const xMax = Math.max(...groupData.xRegions);
          const yMin = Math.min(...groupData.yRegions);
          const yMax = Math.max(...groupData.yRegions);

          const gridSize = 100;
          const xStep = (xMax - xMin) / gridSize;
          const yStep = (yMax - yMin) / gridSize;

          const xGrid = new Array(gridSize).fill().map((_, i) => xMin + i * xStep);
          const yGrid = new Array(gridSize).fill().map((_, i) => yMin + i * yStep);

          const zGrid = new Array(gridSize).fill().map(() => new Array(gridSize).fill(0));

          for (let i = 0; i < groupData.xRegions.length; i++) {
              const xIndex = Math.floor((groupData.xRegions[i] - xMin) / xStep);
              const yIndex = Math.floor((groupData.yRegions[i] - yMin) / yStep);
              if (xIndex >= 0 && xIndex < gridSize && yIndex >= 0 && yIndex < gridSize) {
                  zGrid[yIndex][xIndex] = groupData.concentrations[i];
              }
          }

          return {
              x: xGrid,
              y: yGrid,
              z: zGrid,
              type: 'surface',
              name: element,
              colorscale: [[0, color], [1, color]],
              showscale: false
          };
      });

      const layout = {
          title: `Concentration Surface Plot for Selected Elements: ${selectedElements.join(', ')}`,
          scene: {
              xaxis: { title: 'XRegion', automargin: true },
              yaxis: { title: 'YRegion', automargin: true },
              zaxis: { title: 'Concentration', automargin: true }
          },
          width: 850,
          height: 850,
          margin: {
              l: 50,
              r: 50,
              b: 50,
              t: 50,
              pad: 4
          }
      };

      Plotly.newPlot('plot-container', traces, layout);
  }

  // Initial plot with all elements
  plotAllElements();

  // Expose plotSelectedElements function to global scope
  window.plotSelectedElements = plotSelectedElements;
}
