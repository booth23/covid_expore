function barPlot(selector, data, {...vals}={}) {


    var {title="Title", xspace = 200, w=500, h=500, titlespace=30} = vals;

    d3.select(selector).selectAll("svg").remove();
    d3.select(selector).selectAll("table").remove();

    var barwidth = (w-xspace)/data.length;


    // set x scale - this is the category
    var xscale = d3.scaleBand()
        .domain(data.map(d => d.key))
        .range([0,w])
        .paddingInner(0.1);
  
    // set y scale - equal to the highest value
    var yscale = d3.scaleLinear()
        .domain([0, d3.max(data, d=>d.value)])
        .range([h, 0]);

  
    // append svg using height and width
    var svg = d3.select(selector)
        .append("svg")
            .attr("width", w + margin.right + margin.left + xspace)
            .attr("height", h + margin.top + margin.right + titlespace);

    var chart = svg.append("g")
            .attr("transform", "translate(" + (margin.left + xspace) + "," + (margin.top+titlespace) + ")")
            ;
  
    // add rectangles for each category
    var bars = chart.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("height", d=> h - Math.max(yscale(d.value),0))
        .attr("width",xscale.bandwidth())
        .attr("x", d=>xscale(d.key))
        .attr("y", d=>yscale(d.value))
        .attr("fill", "steelblue")
        .attr("margin", "3px")
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
        .attr("y", 0-margin.top)
        .attr("class", "caption")
        .text(title)
        ;

    var periods = ["Daily","Weekly","Monthly"];

    var menu = svg.append("g")
        .attr("transform", d => "translate(" + margin.left + "," + (margin.top + titlespace) + ")");


    menu.selectAll("rect")
        .data(periods)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => periods.indexOf(d) * 65) 
        //.attr("height", 20)
        //.attr("width", 20)
        .attr("class", "button")
        .style("fill", "steelblue")
        .style("border-radius","5px")
        .on("click", function(d){
            if(d=="Daily") {
                barPlot(selector, dailyGroup.all(), vals);
            } else if (d=="Weekly") {
                barPlot(selector, weeklyGroup.all().sort(sortWeek), vals);
            } else {
                //barPlot(selector, reorder(monthGroup.all(), Object.values(months)), vals);
                barPlot(selector, monthGroup.all().sort(sortMonth), vals);
            }
        })
        ;

    menu.selectAll("text")
        .data(periods)
        .enter()
        .append("text")
        .style('fill', 'white')
        .style("font-size", "16px")
        .attr("x", 15)
        .attr("y", d => 35 + periods.indexOf(d) * 65) 
        .text(d=>d)
        ;
        
  
  };