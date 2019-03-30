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
    var xyLinearScale = d3.scaleLinear().domain([d3.min(dataset, d => d[chosenData]) * 0.85, d3.max(dataset, d => d[chosenData]) * 1.1])

    if (chosenAxis === "x") {
        xyLinearScale.range([0, width]);
    } else {
        xyLinearScale.range([height, 0]);
    }

    return xyLinearScale;
}

// function used for updating x & y Axis var upon click on axis label
function renderAxes(newScale, Axis, otype) {
    if (otype === "x") {
        var positionAxis = d3.axisBottom(newScale);
    } else {
        var positionAxis = d3.axisLeft(newScale);
    }

    Axis.transition()
        .duration(1000)
        .call(positionAxis);

    return Axis;
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

// This function update label class to active or inactive
function updateLblClass(mData, chosenAxis, xisType) {
    // Loop thru dynamic data & activate current selection
    mData.forEach(rw => {
        // alert(rw.name.attr("value"));
        if (rw.name.attr("value") === chosenAxis) {
            rw.name.classed("active", true).classed("inactive", false);
        } else {
            if (rw.xtype === xisType) {
                rw.name.classed("active", false).classed("inactive", true);
            }
        }
    });
}

// This function update all circles' texts
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
}

// Import Data & Perform Tasks
// Read CSV - asynchronous - can pass result data
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

    // Step 4: Create axis functions
    // ==============================
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // Step 5: Append Axes to the chart
    // ==============================
    var xxis = chartGrp.append("g").attr("transform", `translate(0, ${height})`).call(bottomAxis);
    var yxis = chartGrp.append("g").call(leftAxis);

    // Step 6: updateToolTip 
    // ==============================
    var toolTip = updateToolTip(chosenXAxis, chosenYAxis);
    chartGrp.call(toolTip);

    // Step 7: Create Circles
    // ==============================
    var cirGrp = chartGrp.selectAll("circle")
        .data(oData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", "10")
        .attr("class", "stateCircle")
        .on('mouseover', toolTip.show)
        .on('mouseout', toolTip.hide);

    // Step 8: Add circles' texts 
    // ==============================
    updateCircleText(oData, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale, chartGrp);

    // Step 9: Create group / append for x-axis & y-axis labels
    // ==============================
    var xlblGrp = chartGrp.append("g").attr("transform", `translate(${width / 2}, ${height + margin.top + 10})`);
    var ylblGrp = chartGrp.append("g").attr("transform", "rotate(-90)");

    // Step 10: Import labelData to dynamically set axises' labels
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

        // Step 11: x axis labels event listener
        // ==============================
        xlblGrp.selectAll("text").on("click", function () {
            // get value of selection
            var label = d3.select(this).attr("value");

            if (label !== chosenXAxis) {
                // Remove any old text
                d3.selectAll(".stateText").remove();

                // alert(value);
                // replaces chosenXAxis with label
                d3.select("#xId").attr("value", label);
                chosenXAxis = label;

                // update x scale for new data
                xLinearScale = xyScale(oData, "x", chosenXAxis);

                // update x axis with transition
                xxis = renderAxes(xLinearScale, xxis, "x");

                // update tooltips with new info
                toolTip = updateToolTip(chosenXAxis, chosenYAxis);
                chartGrp.call(toolTip);

                // update circles with new x values
                cirGrp = renderCircles(cirGrp, "cx", xLinearScale, chosenXAxis);
                cirGrp.on('mouseover', toolTip.show).on('mouseout', toolTip.hide);

                // update circles' text
                updateCircleText(oData, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale, chartGrp);

                // update labels' class
                updateLblClass(mData, chosenXAxis, "x");
            }
        });

        // Step 11: y axis labels event listener
        // ==============================
        ylblGrp.selectAll("text").on("click", function () {
            // get value of selection
            var label = d3.select(this).attr("value");

            if (label !== chosenYAxis) {
                // Remove any old text
                d3.selectAll(".stateText").remove();

                // replaces chosenYAxis with label
                d3.select("#yId").attr("value",  label);
                chosenYAxis = label;

                // update x scale for new data
                yLinearScale = xyScale(oData, "y", chosenYAxis);

                // update x axis with transition
                yxis = renderAxes(yLinearScale, yxis, "y");

                // update tooltips with new info
                toolTip = updateToolTip(chosenXAxis, chosenYAxis);
                chartGrp.call(toolTip);

                // update circles with new x values
                // alert(cirGrp);
                cirGrp = renderCircles(cirGrp, "cy", yLinearScale, chosenYAxis);
                cirGrp.on('mouseover', toolTip.show).on('mouseout', toolTip.hide);

                // update circles' text
                updateCircleText(oData, chosenXAxis, chosenYAxis, xLinearScale, yLinearScale, chartGrp);

                // update labels' class
                updateLblClass(mData, chosenYAxis, "y");
            }
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



