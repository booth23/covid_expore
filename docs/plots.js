function barPlot(selector, data, title="", dim, {...vals}={}) {


    var {xspace = 200, w=500, h=500, titlespace=30} = vals;

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
            .attr("height", h + margin.top + margin.right + titlespace)
            .style("background-color", "white");

    var chart = svg.append("g")
            .attr("transform", "translate(" + (margin.left + xspace) + "," + (margin.top+titlespace) + ")")
            ;
  
    // add rectangles for each category
    var bars = chart.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("height", d=> Math.max(h - yscale(d.value),0))
        .attr("width",xscale.bandwidth())
        .attr("x", d=>xscale(d.key))
        .attr("y", d=>yscale(Math.max(d.value, 0)))
        .attr("fill", "steelblue")
        .attr("margin", "3px")
        .on("mouseover", d => mouseover(d, {'labels':orgs}))  
        .on("mousemove", d => mousemove())		
        .on("mouseout", d => mouseout())
        .on("click", function(d) {
            var t = d3.select(this);
            if (t.attr("fill") == "steelblue"){
              t.attr("fill","grey")
              dim.filter(d.key);
              renderAll(selector);
              
            } else {
              t.attr("fill","steelblue");
              dim.filterAll();
              renderAll(selector);
            };
            
          })
        ;

  
    if (data.length < 10) {
        chart.append("g")
            .attr("transform", "translate(" + (0) + "," + h + ")")
            .call(d3.axisBottom(xscale));
    } else {
        chart.append("g")
            .attr("transform", "translate(" + (0) + "," + h + ")")
            .call(d3.axisBottom(xscale)
                //.ticks(8)
                .tickValues(xscale.domain().filter(function(d,i){ return !(i%3)})))
                ;
    };

  
    // create y axis
    var y_axis = d3.axisLeft()
        .scale(yscale)
        .tickFormat(d => '$' + (Math.max(d,0) / 1000000) + "M")
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

    var periods = ["Weekly","Monthly"];

    
    //var totalvals = ["Total:", formatDollar(d3.sum(data,d => d.value))];
    var totalvals = ["Total:", formatDollar(ndx.groupAll().reduceSum(d=>d.obligatedAmount).value())];
    

    var total = svg.append("g")
      .attr("transform", d => "translate(" + margin.left + "," + (margin.top + titlespace) + ")");
      
    total.selectAll("text")
      .data(totalvals)
      .enter()
      .append("text")
      .attr("x", 0)
      .attr("y", d => totalvals.indexOf(d)*25)
      .style('fill', 'steelblue')
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(d=>d);

      var menu = svg.append("g")
      .attr("transform", d => "translate(" + margin.left + "," + (margin.top + titlespace + 75) + ")");


    menu.selectAll("rect")
        .data(periods)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => periods.indexOf(d) * 65) 
        .attr("class", "button")
        .style("fill", "steelblue")
        .style("border-radius","5px")
        .on("click", function(d){
            if (d=="Weekly") {
                barPlot(selector, weeklyGroup.all().sort(sortWeek), "Obligations by Week", weeklyDim, vals);
            } else {
                //barPlot(selector, reorder(monthGroup.all(), Object.values(months)), vals);
                barPlot(selector, monthGroup.all().sort(sortMonth), "Obligations by Month", monthDim, vals);
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

  


  //////////////////////////////////////////////////
function tablePlot(selector, data, fields, {...args}= {}) {
    d3.select(selector).selectAll("svg").remove();
    d3.select(selector).selectAll("table").remove();

    var {lu={}, rowUrl=null, rowFilter=null} = args;

    var container = d3.select(selector);

    //var caption = container.append("caption")
    //    .attr("class", "caption")
    //    .text(title);

    var table = container.append("table")
      .attr("class","table");

    var header = table.append("thead").append("tr");

    header
      .selectAll("th")
      .data(fields)
      .enter()
      .append("th")
      .text(d => lu[d])
      .on("click", d => tablePlot(selector, colSort(data,d), fields, args))
    ;

    var tablebody = table.append("tbody");

    rows = tablebody
      .selectAll("tr")
      .data(data)
      .enter()
      .append("tr")
      .on("click", function(d) {
          if(rowFilter) {
              t = d3.select(this)
              if (t.attr("class") == "selected_row"){
                t.attr("class","")
                dim.filterAll();
                
                renderAll(selector);
                
              } else {
                t.attr("class","selected_row");
                rowFilter.filter(d.key);
                renderAll(selector);
              };
              
            };
          
          if(rowUrl) {window.open(d[rowUrl])}});

    var cells = rows.selectAll("td")
      .data(function (row) {
            return fields.map(function (field) {
                return { name: field, value: row[field] };
            });
        })
        .enter()
        .append("td")
        .attr('data-th', d=> d.name)
        .text(d => formatDollar(+d.value || d.value));

};