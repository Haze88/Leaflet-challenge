// create the tile layer for the background of the map
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 8,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

//water color layer 
var waterColor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});

//satelite layer
var satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

//make basemap object
let basemap = {
    // Default: defaultMap,
    GrayScale: grayscale,
    "Water Color": waterColor,
    Satellite: satelite
};

//make a map object
var myMap =L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 3,
    // layers: [defaultMap, grayscale, waterColor, satelite]
    layers: [grayscale, waterColor, satelite]
});

//add default map to map
grayscale.addTo(myMap);

//get the datat for the tectonic plates then draw on the map
//variable to hold tectonic plates layer
let tectonicplates =new L.layerGroup();

//call the api to get the info for tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    //console log to make sure stat is loaded
    // console.log(plateData);

    // load datat using geoJson and add to the tectonic plate layer
    L.geoJson(plateData,{
        // add styling for visable line
        color: "yellow",
        weight: 1
    }).addTo(tectonicplates);
    // add the tectonic plate to the map
    tectonicplates.addTo(myMap);
});


//variable to hold earthquakes data layer
let earthquakes =new L.layerGroup();

//get data for earthquakes and populate layergroup
//make a call to api for geoJson
d3.json('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
.then(
    function(earthquakeData){
        //console log to make sure stat is loaded
        // console.log(earthquakeData);
        //plot circles where radius is dependent on magnitude
        //color depends on depth

        //fucntion for color at data point
        function dataColor(depth){
            if (depth >90 )
                return"red";
            else if(depth >70)
                return "#fc4903";
            else if (depth > 50)
                return "#fc8403";
            else if (depth > 30)
                return "#fcad03";
            else if (depth >10)
                return "cafc03";
            else
                return "green"

        }
        // make a function to determine size of radius
        function radiusSize(mag){
            if (mag == 0)
                return 1; //makes sure that a 0 mag earthquake shows up
            else
                return mag * 5; // makes sure that the circle is pronounced

        }

        // add on the style of data points
        function dataStyle(feature)
        {
            return{
                opacity: 1,
                fillOpacity: 1,
                fillColor: dataColor(feature.geometry.coordinates[2]), // use index 2 for the depth
                color: "000000", //black outline
                radius: radiusSize(feature.properties.mag), //graps magnitude
                weight: 0.5
            }
        }
        // add geoJson data to earthquake layer group
        L.geoJson(earthquakeData,{
            // make marker on map, each being a circle
            pointToLayer: function(feature, latLng){
                return L.circleMarker(latLng);
            },
            //set the style for weach marker
            style: dataStyle, // calls the data style
            //add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b> ${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</bb><br>
                                Location: <b>${feature.properties.place}`);
            }
        }).addTo(earthquakes);
        //add the earthquake layer to the map
        earthquakes.addTo(myMap);
    }
    
);

// add the overlay for the plates and for earthquakes
let overlays = {
        "Tectonic Plates": tectonicplates,
        "Earthquake Data" : earthquakes
};

// add the layer control
L.control
    .layers(basemap, overlays)
    .addTo(myMap);

// add the overlay to the map - legend
let legend = L.control({
    position: "bottomright"
});

//add the properties for the legend
legend.onAdd = function() {
    //make a div for the legend to appear on page
    let div = L.DomUtil.create("div", "info lengend");

    // set up intervals
    let intervals = [-10,10,30,50,70,90];
    //set the colors for the intervals
    let colors = [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc4903",
        "red"
    ];

    // loop intervals and colors, 
    //create colored labeled squares for each interval
    for(var i = 0; 1 < intervals.length; i++)
    {
        //inner html that sets the square for each interval
        div.innerHTML += "<i style=background: "
            + colors[i]
            + "'></i> "
            + intervals[i]
            + (intervals[i +1] ? "km &ndash km;" + intervals[i +1] + "km<br>" : "+");
    }
    return div;
};

//add the legend to the map
legend.addTo(myMap);