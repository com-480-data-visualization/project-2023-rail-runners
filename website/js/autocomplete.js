

let search_options_dropdown_id = '#stations_dropdown';

search_options_dropdown = UIkit.dropdown(search_options_dropdown_id, {
  "pos": "bottom-left",
  "mode": "click",
  "animation": true
});

// Triggered when the dropdown is shown
UIkit.util.on(search_options_dropdown_id, 'show', function () {
  document.getElementById('stations_dropdown').classList.add('active');
  console.log('showed');
});

// Triggered when the dropdown is hidden
UIkit.util.on(search_options_dropdown_id, 'hide', function () {
  console.log('hidden');
});



function pascalize(str) {
  return str.replace(/(\w)(\w*)/g, function (g0, g1, g2) { return g1.toUpperCase() + g2.toLowerCase(); });
}


let searchBox = document.getElementById("searchBox");


searchBox.addEventListener("input", function () {

  // open the dropdown if it is not already open
  if (!UIkit.dropdown(search_options_dropdown_id).isActive()) {
    UIkit.dropdown(search_options_dropdown_id).show();
  }

  let input = searchBox.value.toLowerCase();
  console.log(input)


  let autocompleteSuggestions = station_data.filter(function (item) { 
       return item["stop_name"].toLowerCase().startsWith(input);
  });

  populate_dropdown_from_dataset(autocompleteSuggestions);
});





function populate_dropdown_from_dataset(dataset) {
  let dropdown_content = document.getElementById('stations_dropdown_content');
  let dropdown_content_html = '';
  let MAX_RESULTS = 4;
  let table_length = dataset.length > MAX_RESULTS ? MAX_RESULTS : dataset.length;
  for (let i = 0; i < table_length; i++) {
    let station = dataset[i];
    dropdown_content_html += '<tr onclick="displayStation(' + station["id"] + ')"><td>' + station['stop_name'] + '</td></tr>';
  }
  if (dataset.length === 0) {
    dropdown_content_html = '<tr><td class="uk-text-center">Sorry, we couldn\'t find any station matching your search</td></tr>';
  }
  dropdown_content.innerHTML = dropdown_content_html;
}

var chosenStationPopup = null


function displayStation(id) {
  console.log("displayStation(", id, ") triggered")
  // need to retrieve the circle corresponding to this station id in the mapbox map
  station = station_data[id];
  coordinates = [station['stop_lon'], station['stop_lat']];
  description = "Station"

  if (chosenStationPopup !== null) {
    chosenStationPopup.remove();
  }

  // close dropdown
  UIkit.dropdown(search_options_dropdown_id).hide(animation = false);

  // add in text field the station stop
  searchBox.value = station['stop_name'];

  chosenStationPopup = new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setHTML(generatePopupHTML(station))
    .addTo(map);

  map.flyTo({
    center: coordinates,
    zoom: 8
  });

}