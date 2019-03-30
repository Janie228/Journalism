// Global variables
// ------------------------------------------------------------------
var svgWidth = 960;
var svgHeight = 500;
var margin = {top: 20, right: 40, bottom: 100, left: 100};
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart, and shift the latter by left and top margins.
var svg = d3.select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);


// ------------------------------------------------------------------

// function used for updating x/y scale var upon click on axis label
function xyScale(dataset, chosenAxis, chosenData) {
  // create scales
  if (chosenAxis === "x"){
    var xyLinearScale = d3.scaleLinear()
    .domain([d3.min(dataset, d => d[chosenData]) * 0.9,
      d3.max(dataset, d => d[chosenData]) * 1.1])
    .range([0, width]);
  }else{
    var xyLinearScale = d3.scaleLinear()
    .domain([d3.min(dataset, d => d[chosenData]) * 0.9,
      d3.max(dataset, d => d[chosenData]) * 1.1])
    .range([height, 0]);
  }

  return xyLinearScale;
}

// function used for updating x & y Axis var upon click on axis label
function renderAxes(newScale, Axis, otype) {
  if (otype === "x"){
    var positionAxis = d3.axisBottom(newScale);
  }else{
    var positionAxis = d3.axisLeft(newScale);
  }

  Axis.transition()
    .duration(1000)
    .call(positionAxis);

  return Axis;
}

// function used for updating circles group with a transition to new circles
function renderCircles(circlesGroup, axisType, newScale, chosenData) {
  // alert(`${axisType}, ${chosenData}`);
  circlesGroup.transition()
    .duration(1000)
    .attr(axisType, d => newScale(d[chosenData]));
  return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis) {
  // alert(`${chosenXAxis}, ${chosenYAxis}`);
  // Concatenate tooltip label value
  switch (chosenXAxis) {
    case "income":
      var pct = ""
      var dollar = "$"
      break;
    case "age":
      var pct = ""
      var dollar = ""
      break;
    default:
      var pct = "%"
      var dollar = ""
  }

  var xLabel = chosenXAxis.charAt(0).toUpperCase() + chosenXAxis.slice(1);
  var yLabel = chosenYAxis.charAt(0).toUpperCase() + chosenYAxis.slice(1);

  // Set tooltip text
  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([-8, 0])
    .html(function (d) {
      var texttip = `<strong>${d.state}</strong><br>Population: ${parseInt(d.population).toLocaleString()}<br>`
      texttip = texttip + `${xLabel}: ${dollar}${(d[chosenXAxis]).toLocaleString()}${pct}<br>${yLabel}: ${d[chosenYAxis]}%`
      return (texttip);
    });

  // Create tooltip in the chart
  chartGroup.call(toolTip);
  
  return toolTip
}

function updateCircleText(dataset, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale) {
  chartGroup.selectAll(null).remove()
  .data(dataset)
  .enter()
  .append("text")
  .transition()
  .duration(900)
  .attr("x", d => xLinearScale(d[chosenXAxis]))
  .attr("y",  d => yLinearScale(d[chosenYAxis]))
  .text(d => d.abbr)
  .attr("class", "stateText")
  .attr("dy", 4)  // y-axis down 4
}

// Import Data
d3.csv("static/data/data.csv").then(function(oData) {
  // console.log(oData);
  // Step 1: Parse data/sast as numbers
  // ==============================
  oData.forEach(row => {
      row.poverty = +row.poverty;
      row.healthcare = +row.healthcare;
      row.age = +row.age;
      row.smokes = +row.smokes;
      row.obesity = +row.obesity;
      row.income = +row.income;
  });

  // Step 2: Create scale functions
  // ==============================
  var chosenXAxis = d3.select("#xId").node().value;
  var chosenYAxis = d3.select("#yId").node().value;

  var xLinearScale = xyScale(oData, "x", chosenXAxis);
  var yLinearScale = xyScale(oData, "y", chosenYAxis);

  // Step 3: Create axis functions
  // ==============================
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // Step 4: Append Axes to the chart
  // ==============================
  var xAxis = chartGroup.append("g").attr("transform", `translate(0, ${height})`).call(bottomAxis);
  var yAxis = chartGroup.append("g").call(leftAxis);

  // Step 5: updateToolTip 
  // ==============================
  var toolTip = updateToolTip(chosenXAxis, chosenYAxis);

  // Step 6: Create Circles
  // ==============================
  var circlesGroup = chartGroup.selectAll("circle")
  .data(oData)
  .enter()
  .append("circle")
  .attr("cx", d => xLinearScale(d[chosenXAxis]))
  .attr("cy", d => yLinearScale(d[chosenYAxis]))
  .attr("r", "10")
  .attr("class", "stateCircle")
  .on('mouseover', toolTip.show)
  .on('mouseout', toolTip.hide);

  // Step 7: Add circles' texts 
  // ==============================
  updateCircleText(oData, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale);

  // Step 8: Create group / append for x-axis & y-axis labels
  // ==============================
  var xlabelsGroup = chartGroup.append("g").attr("transform", `translate(${width / 2}, ${height + margin.top + 10})`);
  var ylabelsGroup = chartGroup.append("g").attr("transform", "rotate(-90)");

  // Step 9: Import labelData to dynamically set axises' labels
  // ==============================
  d3.csv("static/data/labelData.csv").then(function(mData) {
    // console.log(mData);
    mData.forEach(rw => {
      // console.log(`${rw.xtype}, ${rw.label}`);
      if (rw.xtype === "x"){
        rw.name = xlabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", parseInt(rw.num))
        .attr("id",  rw.xtype) // value to grab for event listener
        .attr("value", rw.name) // value to grab for event listener
        .attr("class", "aText")
        .classed(rw.flag, true)
        .text(rw.label);
      }else{
        rw.name = ylabelsGroup.append("text")
        .attr("y", 0 - margin.left + parseInt(rw.num))
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .attr("id",  rw.xtype) // value to grab for event listener
        .attr("value",  rw.name) // value to grab for event listener
        .attr("class", "aText")
        .classed(rw.flag, true)
        .text(rw.label);
      }
    });

  // Step 10: x axis labels event listener
  // ==============================
  xlabelsGroup.selectAll("text")
  .on("click", function() {
    alert("x");
    // get value of selection
    var value = d3.select(this).attr("value");
    // alert(value);
    if (value !== chosenXAxis) {
      // Remove any old text
      svg.selectAll(".stateText").remove();

      // alert(value);
      // replaces chosenXAxis with value
      d3.select("#xId").attr("value",  value);
      chosenXAxis = value;

      // updates x scale for new data
      xLinearScale = xyScale(oData, "x", chosenXAxis);

      // updates x axis with transition
      xAxis = renderAxes(xLinearScale, xAxis, "x");

      // updates tooltips with new info
      toolTip = updateToolTip(chosenXAxis, chosenYAxis);

      // updates circles with new x values
      circlesGroup = renderCircles(circlesGroup, "cx", xLinearScale, chosenXAxis);
      circlesGroup.on('mouseover', toolTip.show)
      .on('mouseout', toolTip.hide);

      // updates circles' text
      updateCircleText(oData, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale);

      // Loop thru dynamic data & activate current selection
      mData.forEach(rw => {
        // alert(rw.name.attr("value"));
        if (rw.name.attr("value") === chosenXAxis){
          rw.name.classed("active", true).classed("inactive", false);
        }else{
          if (rw.xtype === "x"){
            rw.name.classed("active", false).classed("inactive", true);
          }
        }
      });
    
    }
  });

  // Step 11: y axis labels event listener
  // ==============================
  ylabelsGroup.selectAll("text")
  .on("click", function() {
    // get value of selection
    var value = d3.select(this).attr("value");
    // alert(value);
    if (value !== chosenYAxis) {
      // // Remove any old text
      svg.selectAll(".stateText").remove();

      // alert(value);
      // replaces chosenYAxis with value
      d3.select("#yId").attr("value",  value);
      chosenYAxis = value;

      // updates x scale for new data
      yLinearScale = xyScale(oData, "y", chosenYAxis);

      // updates x axis with transition
      yAxis = renderAxes(yLinearScale, yAxis, "y");

      // updates tooltips with new info
      toolTip = updateToolTip(chosenXAxis, chosenYAxis);

      // updates circles with new x values
      // alert(circlesGroup);
      circlesGroup = renderCircles(circlesGroup, "cy", yLinearScale, chosenYAxis);
      circlesGroup.on('mouseover', toolTip.show)
      .on('mouseout', toolTip.hide);

      // updates circles' text
      updateCircleText(oData, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale);

      // Loop thru dynamic data & activate current selection
      mData.forEach(rw => {
        // alert(rw.name.attr("value"));
        if (rw.name.attr("value") === chosenYAxis){
          rw.name.classed("active", true).classed("inactive", false);
        }else{
          if (rw.xtype === "y"){
            rw.name.classed("active", false).classed("inactive", true);
          }
        }
      });
   
    }
  });

  })
  .catch(function(error){
    // handle error   
    console.log(error);
  });

})
.catch(function(error){
// handle error   
console.log(error);
})


//  This function remove or add sticky top based on screen size
function changeLayout(){
  var sticky = d3.select("#sticky");
  var fixed = d3.select("#fixed");

  switch(true)
  {
    case (window.outerWidth <= 767):
      if (fixed.attr("class") === "fixed-top"){
        fixed.classed("fixed-top", false);
        sticky.classed("sticky-offset", false);
      }
      break;
    case (window.outerWidth >= 768):
      if (fixed.attr("class") === ""){
        fixed.classed("fixed-top", true);
        sticky.classed("sticky-offset", true);
      } 
      break;   
  }

}