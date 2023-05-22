
let mapBoxAccessToken = "pk.eyJ1IjoiZ2lhY29tb29yc2kiLCJhIjoiY2pubTM0Nml6MW02MDNwcWY0ajc3ZHE3diJ9.fz0p1ZmseERTYVzXJPqS0Q"
mapboxgl.accessToken = mapBoxAccessToken;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://maps.geops.io/styles/base_bright_v2/style.json?key=5cc87b12d7c5370001c1d6552688c8395e0e4e94a4faf2368b9915dd',
  center: [8, 42.5],
  zoom: 5,
});

var container = map.getCanvasContainer();
var width = document.getElementById("map").offsetWidth;
var height = document.getElementById("map").offsetHeight;

var svg = d3
  .select(container)
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("position", "absolute")
  .style("z-index", 1000);

/**
 * Function to project coordinates to the exact position on the canvas given by Mapbox
 */
function project(d) {
  return map.project(new mapboxgl.LngLat(d[0], d[1]));
}

var trainsMapping = {
  "Regional": "REG",
  "InterCity": "IC",
  "InterCity Notte": "ICN",
  "EuroCity": "EC",
  "High speed": "AV",
}

function getFileName(day, trainType) {
  /**
   * Returns the filename of the dataset to be used, given the day and the train type
   */
  if (day == "All days" && trainType == "All trains") {
    return "data_stop.csv"
  }
  else if (day == "All days") {
    return "data_stop_class_" + trainsMapping[trainType] + ".csv"
  }
  else if (trainType == "All trains") {
    return "data_stop_" + day.substring(0, 3) + ".csv"
  }
  else {
    return "data_stop_mix_" + day.substring(0, 3) + "_" + trainsMapping[trainType] + ".csv"

  }
}

/**
 *  
 * USER INTERACTION WITH FORM
 * 
 */
d3.select("#form-horizontal-select-day").on("change", function (d) {
  var selectedOptionDay = d3.select(this).property("value")
  var selectedOptionTrainType = d3.select("#form-horizontal-select-trainType").property("value")
  var dataset = getFileName(selectedOptionDay, selectedOptionTrainType)
  var data_stop = d3.csv("data/" + dataset, function (d) {
    return d;
  })
  Promise.all([data_stop]).then(results => {
    let station_data = results[0];
    console.log(station_data)
    d3.selectAll("circle").remove();
    plotDots(station_data);
  })
})

d3.select("#form-horizontal-select-trainType").on("change", function (d) {
  var selectedOptionTrainType = d3.select(this).property("value")
  var selectedOptionDay = d3.select("#form-horizontal-select-day").property("value")
  var dataset = getFileName(selectedOptionDay, selectedOptionTrainType)
  var data_stop = d3.csv("data/" + dataset, function (d) {
    return d;
  })
  Promise.all([data_stop]).then(results => {
    let station_data = results[0];
    console.log(station_data)
    d3.selectAll("circle").remove();
    plotDots(station_data);
  })
})

d3.select("search-station").on("submit", function (d) {
  d3.event.preventDefault();
  var stationName = d3.select("#search-station").property("value")
  console.log(stationName)
  //only take data from the station the user is looking for
  var station_data = data_stop.filter(function (d) { return d.stop_name == stationName })
  console.log(station_data)

  Promise.all([station_data]).then(results => {
    let station_data = results[0];
    console.log(station_data)
    d3.selectAll("circle").remove();
    plotDots(station_data);
  })
})


//default dataset, before the user chooses anything
var dayChosen = document.getElementById("form-horizontal-select-day").value
var trainTypeChosen = document.getElementById("form-horizontal-select-trainType").value
var dataset = getFileName(dayChosen, trainTypeChosen)

var data_stop = d3.csv("data/" + dataset, function (d) {
  return d;
})

Promise.all([data_stop]).then(results => {
  let station_data = results[0];
  console.log(station_data)
  plotDots(station_data);
})

/**
 * END USER INTERACTION WITH FORM
 * 
*/


/**
 * CODE TO HANDLE MAP
 */

function generatePopupHTML(d) {
  /**
   * Returns the HTML code for a popup of a stop
   */
  output = '<div class="uk-text-lead">'
  output += '<span style="text-align:center"><b>' + d.stop_name + "</b></span><br/>" + "Number of trains: " + d.count_stops + "<br/>" + "Avg Arrival Delay: " + Math.round(d.avg_arrival_delay * 1000) / 1000 + " min"
  output += "</div>"

  return output
}

// variable to check if the map was already fully loaded
// if it is not fully loaded, plotDots will wait 200ms and then try again
let mapHasLoaded = false;
map.on('load', function () {
  mapHasLoaded = true;
});

// variable to store the id of the station the user is hovering on
// we need it to remove the popup when the user hovers out
let hoverStationId = null;

/**
 * Handles the display of dots over the map
 * @param data: a dataframe containing the data to be plotted
 */
function plotDots(data) {

  // if the map is not fully loaded, wait 200ms and try again
  if (!mapHasLoaded) {
    setTimeout(function () { plotDots(data); }, 200);
    return;
  }

  let min_count = d3.min(data, function (d) { return Number(d.count_stops) });
  let max_count = d3.max(data, function (d) { return Number(d.count_stops) });

  /**
   * Backup code

  // let scale1 = d3.scalePow()
  //   .exponent(0.6)
  //   .domain([min_count, max_count]) // input
  //   .range([7, 25]); // output

  // let scale2 = d3.scaleLog()
  //   .domain([min_count, max_count]) // input
  //   .range([7, 25]); // output
  */

  // scales the radius using quantiles
  let scale3 = d3.scaleQuantile()
    .domain(data.map((d) => Number(d.count_stops))) // input
    .range([3, 5, 5, 5, 5, 5, 5, 5, 7, 7, 10, 15]); // output


  function scale(d) {
    return scale3(d)
  }

  // scales the color linearly
  let colormap = d3.scaleLinear()
    .domain([-10, 0, 3, 7, 100])
    .range(['#10ad0a', '#10ad0a', '#f7f414', '#e81710', '#e81710']);

  if (map.getLayer('circles')) {
    map.removeLayer('circles')
  }

  // remove source if it exists
  if (map.getSource('circles-source')) {
    map.removeSource('circles-source')
  }

  // augment the dataset with an ID
  // we need an ID for each stop in order to be able to remove the popup when the user hovers out
  let id = 0
  data = data.map(d => {
    d.id = id
    id += 1
    return d
  });


  map.addSource('circles-source', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: data.map(d => {
        return {
          type: 'Feature',
          id: d.id,
          geometry: {
            type: 'Point',
            coordinates: [d.stop_lon, d.stop_lat]
          },
          properties: {
            id: d.stop_name,
            name: d.stop_name,
            count: d.count_stops,
            delay: d.avg_arrival_delay,
            color: colormap(d.avg_arrival_delay),
            radius: scale(Number(d.count_stops)),
            html: generatePopupHTML(d)
          }
        }
      }
      )
    }
  })


  map.addLayer({
    id: 'circles',
    type: 'circle',
    source: 'circles-source',

    paint: {
      'circle-radius':
        /**
         * Complex behaviour here: 
         * when zoom is 7 (about the entire size of italy fits the screen), we set each dot's radius to 1.2 the original value. If the user hovers it, we increment the value by 10 
         * when zoom is 15, set each feature's circle radius to four times the value of the radius property
         * we scale linearly among the two values. 
         * 
         */
        [
          "interpolate", ["linear"], ["zoom"],
          // when zoom is 7 (about the entire size of italy fits the screen), we set each dot's radius to the original value
          7, ['case',
            ['boolean', ['feature-state', 'hover'], false],
            ['+', ["*", 1.2, ["get", "radius"]], 10],
            ["*", 1.2, ["get", "radius"]]
          ],
          // when zoom is 15, set each feature's circle radius to four times the value of the radius property
          15, ["*", 4, ["get", "radius"]]
        ],
      'circle-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.7
      ],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': 'white',
      'circle-stroke-width': 1,
    }
  });


  // Create a popup, but don't add it to the map yet.
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  /**
   * Adds a popup when the user hovers on a station
   */
  map.on('mouseenter', 'circles', (e) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    
    hoverStationId = e.features[0].id

    // set hover state, the new radius is handled by the paint property
    map.setFeatureState(
      { source: 'circles-source', id: hoverStationId },
      { hover: true }
    );

    // Copy coordinates array
    const coordinates = e.features[0].geometry.coordinates.slice();
    const html = e.features[0].properties.html;

    // © MapBox example code
    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(coordinates).setHTML(html).addTo(map);
  });

  map.on('mouseleave', 'circles', (e) => {
    map.setFeatureState(
      { source: 'circles-source', id: hoverStationId },
      { hover: false }
    );

    map.getCanvas().style.cursor = '';
    popup.remove();
  });

  let legend = Legend(colormap, {
    title: "avg arrival delay",
  })
  // extract content from legend and add it to the main svg
  // legend is a DOM element, we need to extract the content and put it in the main svg
  // we use insertAdjacentHTML to do that
  svg.node().insertAdjacentHTML("beforeend", '<g class="map-legend">' + legend.innerHTML + '</g>');
}