// Global variables
var width;
var height;
var margin;

// This function setup charting environment & put the basic variable into global
function chartSetup(selector, w, h, t, b, l, r) {
  var svgWidth = w;
  var svgHeight = h;
  margin = { top: t, right: r, bottom: b, left: l };
  width = svgWidth - margin.left - margin.right;
  height = svgHeight - margin.top - margin.bottom;

  // Create an SVG wrapper, append an SVG group that will hold our chart, and shift 
  // the latter by left and top margins.
  var svg = d3.select(selector)
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  var chartGrp = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
  // alert(`${selector}, ${t}, ${b}, ${l},${r}`);

  return chartGrp
}

// function used for updating x/y scale var upon click on axis label
function xyScale(dataset, chosenAxis, chosenData) {
  // alert(`${chosenAxis}, ${chosenData}, ${width}, ${height}`);
  // create scales
  var xyLinearScale = d3.scaleLinear().domain([d3.min(dataset, d => d[chosenData]) * 0.9, d3.max(dataset, d => d[chosenData]) * 1.1])

  if (chosenAxis === "x") {
    xyLinearScale.range([0, width]);
  } else {
    xyLinearScale.range([height, 0]);
  }

  return xyLinearScale;
}

// function used for updating x & y Axis var upon click on axis label
function renderAxes(newScale, otype) {
  var Axis = window.sessionStorage.getItem("xxis")
  if (otype === "x") {
    var positionAxis = d3.axisBottom(newScale);
  } else {
    var positionAxis = d3.axisLeft(newScale);
  }

  Axis.transition()
    .duration(1000)
    .call(positionAxis);

  window.sessionStorage.setItem("xxis", Axis);
}

// function used for updating circles group with a transition to new circles
function renderCircles(cirGrp, axisType, newScale, chosenData) {
  // alert(`${axisType}, ${chosenData}`);
  cirGrp.transition()
    .duration(1000)
    .attr(axisType, d => newScale(d[chosenData]));
  return cirGrp;
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

  return toolTip
}


function updateCircleText(dataset, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale, chartGrp) {
  chartGrp.selectAll(null).remove()
    .data(dataset)
    .enter()
    .append("text")
    .transition()
    .duration(900)
    .attr("x", d => xLinearScale(d[chosenXAxis]))
    .attr("y", d => yLinearScale(d[chosenYAxis]))
    .text(d => d.abbr)
    .attr("class", "stateText")
    .attr("dy", 4)  // y-axis down 4
  
  return chartGrp
}

// Axises labels onclick event listener update function
function updateAxis(label, axisType, xyLinearScale, oData, mData) {
  // Step 1: Get current label value
  var chosenXAxis = d3.select("#xId").node().value;
  var chosenYAxis = d3.select("#yId").node().value;
  // alert(`${label}, ${xis.includes("xaxis")}`);

  // Step 2: If label is not the same as chosen axis, perform tasks
  // ==============================
  if (label !== chosenXAxis && label !== chosenYAxis) {
    // Step 3: Remove any old text
    d3.selectAll(".stateText").remove();

    //***** Step 4: Differentiate x & y axises, update
    // ==============================    
    if (axisType.includes("xaxis")) {
      // Step 5: replaces chosen axis with label  
      d3.select("#xId").attr("value", label);
      chosenXAxis = label;

      // Step 6: updates x scale for new data  
      xLinearScale = xyScale(oData, "x", chosenXAxis);
      // alert("after xyscale");

      // Step 7: updates x axis with transition
      renderAxes(xLinearScale, "x");
  

      //  Step 8: updates tooltips with new info
      toolTip = updateToolTip(chosenXAxis, chosenYAxis);
      var chartGrp = window.sessionStorage.getItem("chartGrp");
      chartGrp.call(toolTip);

      //  Step 9: updates circles with new values
      var cirGrp = renderCircles(window.sessionStorage.getItem("circleGrp"), "cx", xLinearScale, chosenXAxis);
      cirGrp.on('mouseover', toolTip.show).on('mouseout', toolTip.hide);
      window.sessionStorage.setItem("circleGrp", cirGrp);

      //  Step 10: updates circles' text
      chartGrp = updateCircleText(oData, chosenXAxis, chosenYAxis, xLinearScale, xyLinearScale, chartGrp);
      window.sessionStorage.setItem("chartGrp", chartGrp);
      updateLblClass(mData, chosenXAxis, xyis);

    }else{
      // replaces chosenXAxis with label  
      d3.select("#yId").attr("value", label);
      chosenYAxis = label;

    }

  }
 
  // Step 11: Select all the svg text label & update
    // ==============================   
    // labels = d3.selectAll(".aText");
    // alert(labels);

    // Loop thru dynamic data & activate current selection
    // labels.forEach(lbl => {
    //   alert(lbl);
    //   if (lbl.attr("value") === chosenXAxis) {
    //     lbl.classed("active", true).classed("inactive", false);
    //   } else {
    //     if (lbl.attr("class").includes("xaxis")) {
    //       lbl.classed("active", false).classed("inactive", true);
    //     }
    //   }
    // });

}

// Import Data
d3.csv("static/data/data.csv").then(function (oData) {
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

  // Step 2: Set environment variables: selector div, width, height, top, bottom, left, right
  // ==============================
  var chartGrp = chartSetup("#scatter", 950, 500, 20, 100, 100, 40);

  // Step 3: Create scale functions
  // ==============================
  var chosenXAxis = d3.select("#xId").node().value;
  var chosenYAxis = d3.select("#yId").node().value;

  var xLinearScale = xyScale(oData, "x", chosenXAxis);
  var yLinearScale = xyScale(oData, "y", chosenYAxis);
  // alert(`${chosenXAxis}, ${chosenYAxis}`);

  // Step 4: Create & append Axes to the chart & return chart
  // ==============================
  xxis = chartGrp.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xLinearScale));
  yyis = chartGrp.append("g").call(d3.axisLeft(yLinearScale));
  window.sessionStorage.setItem("xxis", xxis);
  window.sessionStorage.setItem("yyis", yyis);

  // Step 5: UpdateToolTip 
  // ==============================
  var toolTip = updateToolTip(chosenXAxis, chosenYAxis);
  // Create tooltip in the chart
  chartGrp.call(toolTip);

  // Step 6: Create circles & store circle group into session
  // ==============================
  cirGrp = chartGrp.selectAll("circle")
    .data(oData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", "10")
    .attr("class", "stateCircle")
    .on('mouseover', toolTip.show)
    .on('mouseout', toolTip.hide);

  window.sessionStorage.setItem("circleGrp", cirGrp);
  console.log(window.sessionStorage.getItem("circleGrp"));

  // Step 7: Add circles' texts 
  // ==============================
  updateCircleText(oData, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale, chartGrp);
  // alert("circle text");

  // Step 8: Create group / append for x-axis & y-axis labels
  // ==============================
  // alert(`hw: ${width / 2}, ${height + margin.top + 10}`)
  var xlblGrp = chartGrp.append("g").attr("transform", `translate(${width / 2}, ${height + margin.top + 10})`);
  var ylblGrp = chartGrp.append("g").attr("transform", "rotate(-90)");

  // Step 9: Import labelData to dynamically set axises' labels
  // ==============================
  d3.csv("static/data/labelData.csv").then(function (mData) {
    // console.log(mData);
    mData.forEach(rw => {
      // console.log(`${rw.xtype}, ${rw.label}`);
      if (rw.xtype === "x") {
        rw.name = xlblGrp.append("text")
          .attr("x", 0)
          .attr("y", parseInt(rw.num))
          .attr("value", rw.name) // value to grab for event listener
          .attr("class", "aText")
          .classed(rw.flag, true)
          .text(rw.label);
      } else {
        rw.name = ylblGrp.append("text")
          .attr("y", 0 - margin.left + parseInt(rw.num))
          .attr("x", 0 - (height / 2))
          .attr("dy", "1em")
          .attr("value", rw.name) // value to grab for event listener
          .attr("class", "aText")
          .classed(rw.flag, true)
          .text(rw.label);
      }
    });

    // Step 10: x & y axis labels event listener - pass label name, axis type, axis 
    // transform chart group, dataset, & meta dataset
    // ==============================
    xlblGrp.selectAll("text").on("click", function () {
      var label = d3.select(this).attr("value");
      cirGrp = updateAxis(label, "xaxis", xLinearScale, oData, mData);
    });

    ylblGrp.selectAll("text").on("click", function () {
      var label = d3.select(this).attr("value");
      updateAxis(label, "yaxis", yLinearScale, oData, mData);
    });

  })
    .catch(function (error) {
      // handle error   
      console.log(error);
    });

})
  .catch(function (error) {
    // handle error   
    console.log(error);
  })




