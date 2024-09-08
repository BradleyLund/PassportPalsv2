// script.js
// Wait for the DOM to be ready

// script.js

// Function to parse CSV data into arrays and objects
function parseCSVData(csvData) {
  const lines = csvData.split("\r\n");
  const headers = lines[0].split(",");
  const data = [];

  console.log(headers)

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(",");
    const entry = {};

    for (let j = 0; j < headers.length; j++) {
      entry[headers[j]] = currentLine[j];
    }

    data.push(entry);
  }

  return data;
}

var visaData = [];

// Fetch the CSV file and process it
fetch("passport-index-tidy-iso3.csv")
  .then((response) => response.text())
  .then((csvData) => {
    // console.log(csvData)
    visaData = parseCSVData(csvData);
    // console.log(visaData); // You can use the parsed data as needed here
  })
  .catch((error) => console.error("Error fetching CSV data:", error));

document.addEventListener("DOMContentLoaded", function () {
  // Width and height of the map container
  var width = 800;
  var height = 500;

  // Create the SVG element to hold the map
  var svg = d3
    .select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Define the projection to convert latitude and longitude to screen coordinates
  var projection = d3
    .geoMercator()
    .scale(130)
    .translate([width / 2, height / 1.5]);

  // Create a path generator using the projection
  var path = d3.geoPath().projection(projection);

  // Load the world map GeoJSON data
  d3.json("./countries-land-10km.geo.json")
    .then(function (data) {
      console.log(visaData,'61'); // You can use the parsed data as needed here

      //   we have the visa data in the array above, now we need to pick two countries

      const countryOne = [];
      const countryTwo = [];

      //actually first we just need to show south africa's and then we can go from here

      //work out what the possible values are and then come up with a scale of colors for them

      //   maybe we convert the csv into one object with each country as a key to an array
      console.log(visaData[0],'73');

      var countriesObject = {};

      var countryCodes = [];

      var visaRequirementPossibilities = [];

      for (let i = 0; i < visaData.length; i++) {
        // create an array of the country codes
        if (countryCodes.includes(visaData[i].Passport) != true) {
          countryCodes.push(visaData[i].Passport);
          //   console.log(visaData[i].Passport);
          countriesObject[visaData[i].Passport] = {};
          //   console.log(countriesObject);
        }

        if (
          visaRequirementPossibilities.includes(visaData[i].Requirement) != true
        ) {
          visaRequirementPossibilities.push(visaData[i].Requirement);
        }

        countriesObject[visaData[i].Passport][visaData[i].Destination] =
          visaData[i].Requirement;

        // console.log(visaData[i].Destination);

        // console.log(countriesObject);
      }
      // console.log(countryCodes);

      // I could literally save this in a new json file and just import it going forwards
      console.log(countriesObject,'106');

      visaRequirementPossibilities.sort();
      console.log(visaRequirementPossibilities,'109');

      let sortedVisaRequirements = [
        "-1",
        null,
        "no admission",
        "covid ban",
        "visa required",
        "e-visa",
        "visa on arrival",
        "7",
        "10",
        "14",
        "15",
        "21",
        "28",
        "30",
        "31",
        "42",
        "45",
        "60",
        "90",
        "120",
        "180",
        "240",
        "360",
        "visa free",
      ];

      //all i want to do now and here is combine usa with zaf to have the overlapping worst
      // requirement
      let combinedVisaReqs = {};

      //get the countries that we want to compare from the select boxes like usa and south africa
      //get whichever countriesobject is the longest and then use that one to loop through below. 


      function getCombinedVisaReqs(...objects) {
        let result = {};
    
        objects.forEach(obj => {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (!result[key] || sortedVisaRequirements.indexOf(obj[key]) < sortedVisaRequirements.indexOf(result[key])) {
                        result[key] = obj[key];
                    }
                }
            }
        });
    
        return result;
      }
    
      combinedVisaReqs =getCombinedVisaReqs(countriesObject.USA, countriesObject.ZAF)



      for (let i=0;i< data.features.length;i++)
      {
        // console.log(data.features[i].properties.value) //.value = indexof the visa requirement
        // console.log(data.features[i].properties.A3,combinedVisaReqs[data.features[i].properties.A3])
        console.log(data.features[i].properties.A3);
        console.log(combinedVisaReqs[data.features[i].properties.A3])
        // data.features[i].properties.value = sortedVisaRequirements.indexOf(combinedVisaReqs[data.features[i].properties.A3])
        data.features[i].properties.value = combinedVisaReqs[data.features[i].properties.A3]

      }

      //I need to take the combinedVisaReqs give them a number value for each country. 
      //assign the value to the properties of each of the geo.json countries and then draw.

      // Use D3's built-in color scale
      // var colorScale = d3
      //   .scaleSequential()
      //   .interpolator(d3.interpolateOranges) // You can use other interpolators as well
      //   .domain([
      //     0,
      //     d3.max(data.features, function (d) {
      //       return d.properties.value;
      //     }),
      //   ]);

        // Define your custom color scale
      var colorScale = d3.scaleOrdinal()
        .domain([
          "-1",
          null,
          "no admission",
          "covid ban",
          "visa required",
          "e-visa",
          "visa on arrival",
          "7",
          "10",
          "14",
          "15",
          "21",
          "28",
          "30",
          "31",
          "42",
          "45",
          "60",
          "90",
          "120",
          "180",
          "240",
          "360",
          "visa free",
          undefined
        ]) // Your specific values
        .range([
          "#002377",
          "red", //small edit
          "red",
          "red",
          "#C0C0C0",
          "#61C7A1",
          "#B5E61D",
          "#BAFFAA",
          "#BAFFAA",
          "#BAFFAA",
          "#BAFFAA",
          "#BAFFAA",
          "#BAFFAA",
          "#9EFF9E",
          "#9EFF9E",
          "#9EFF9E",
          "#9EFF9E",
          "#9EFF9E",
          "#9EFF9E",
          "#9EFF9E",
          "#9EFF9E",
          "#9EFF9E",
          "#9EFF9E",
          "#22B14C",
          "red"
        ]);

      // Draw the map
      svg
        .selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", function (d) {
          console.log(d.properties.value, d.properties);
          return colorScale(d.properties.value);
        })
        .style("stroke", "#fff")
        .style("stroke-width", "0.5px");
    })
    .catch(function (error) {
      console.error("Error loading the GeoJSON data:", error);
    });
});
