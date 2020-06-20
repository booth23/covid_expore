function barPlot(vals) {

    console.log(margin);

    var {selector, data, title="Title", xspace = 50, w=500, h=500} = vals;

    d3.select(selector).selectAll("svg").remove();
    d3.select(selector).selectAll("table").remove();

    var barwidth = (w-xspace)/data.length;


    // set x scale - this is the category
    var xscale = d3.scaleBand()
        .domain(data.map(d => d.key))
        .range([0,w]);
  
    // set y scale - equal to the highest value
    var yscale = d3.scaleLinear()
        .domain([0, d3.max(data, d=>d.value)])
        .range([h, 0]);

  
    // append svg using height and width
    var chart = d3.select(selector)
        .append("svg")
            .attr("width", w + margin.right + margin.left)
            .attr("height", h + margin.top + margin.right)
            .append("g")
            .attr("transform", "translate(" + (margin.left + xspace) + "," + margin.top + ")")
            ;
  
    // add rectangles for each category
    var bars = chart.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("height", d=> h - Math.max(yscale(d.value),0))
        .attr("width",barwidth)
        .attr("x", d=>xscale(d.key))
        .attr("y", d=>yscale(d.value))
        .attr("fill", "steelblue")
        .on("mouseover", d => mouseover(d, {'labels':orgs}))  
        .on("mousemove", d => mousemove())		
        .on("mouseout", d => mouseout())
        ;

  
    if (data.length < 10) {
        chart.append("g")
            .attr("transform", "translate(" + (0) + "," + h + ")")
            .call(d3.axisBottom(xscale));
    } else {
        chart.append("g")
            .attr("transform", "translate(" + (0) + "," + h + ")")
            .call(d3.axisBottom(xscale)
                .tickValues(""));
    };

  
    // create y axis
    var y_axis = d3.axisLeft()
        .scale(yscale)
        .tickFormat(d => '$' + (d / 1000000) + "M")
        ;
  
    // add y axis to figure.
    chart.append("g")
        .call(y_axis);

    chart.append("text")
        .attr("x", w/2)             
        .attr("y", margin.top/2)
        .attr("class", "caption")
        .text(title)
        ;
  
  };