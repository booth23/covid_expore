function barPlot(selector, data, dim, {...vals}={}) {


    var {xspace = 200, 
        w=500, 
        h=500, 
        titlespace=50,
        title1 = '',
        title2 = ''} = vals;

    var width = w + margin.right + margin.left + xspace;
    var height = h + margin.top + margin.bottom + titlespace + 10;

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
            .attr("width", width)
            .attr("height", height)
            .style("background-color", "white")
            .style("border","3px solid black");

    var chart = svg.append("g")
            .attr("transform", "translate(" + (margin.left + xspace) + "," + (margin.top + titlespace) + ")")
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
            .attr("class", "axis")
            .call(d3.axisBottom(xscale));
    } else {
        chart.append("g")
            .attr("transform", "translate(" + (0) + "," + h + ")")
            .attr("class", "axis")
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
        .attr("class", "axis")
        .call(y_axis);

    svg.append("text")
        .attr("x", width/2)             
        .attr("y", margin.top)
        .attr("class", "figtitle")
        .text(title1)
        ;

    svg.append("text")
        .attr("x", width/2)             
        .attr("y", margin.top + 20)
        .attr("class", "figtitle")
        .text(title2)
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

////////////     Pie Chart       /////////////////

function pieChart (selector, dataraw, dim, title1="", title2="") {

  d3.select(selector).selectAll("svg").remove();
  d3.select(selector).selectAll("table").remove();

  var data = dataraw.filter(d => d.value > 0)

  w = 400;
  h = 400;
  var size = w * .9;
  var fourth = w / 4;
  var half = w / 2;
  var labelOffset = fourth * 1.4;
  var total = data.reduce((acc, cur) => acc + cur.value, 0);
  
 
  var chart = d3.select(selector)
    .append('svg')
    .attr('width', w + margin.left + margin.right)
    .attr("height", h)
    .style("background-color", "white")
    .style("border","3px solid black")
    //.attr('viewBox', `0 0 ${size} ${size}`)
    ;

  const plotArea = chart.append('g')
    .attr('transform', `translate(${half}, ${half})`);

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.key))
    .range(d3.schemeCategory10);

  const pie = d3.pie()
    .sort(null)
    .value(d => d.value);
 
  const arcs = pie(data);

  const arc = d3.arc()
    .innerRadius(40)
    .outerRadius(fourth)
    ;
 
  const arcLabel = d3.arc()
    .innerRadius(labelOffset)
    .outerRadius(labelOffset);

  function mouseover(d) {
      d3.select("#tooltip")
      .html((d.data.key) + "<br/>"  + formatDollar(d.value) + "<br/>" + Math.round(d.data.value / total * 100) + "%")
      .attr("class", "tooltip");
      };

  

  plotArea.selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('fill', d => color(d.data.key))
    .attr('stroke', 'white')
    .attr('d', arc)
    .on("mouseover", d => mouseover(d))  
    .on("mousemove", d => mousemove())		
    .on("mouseout", d => mouseout())
    .on("click", function(d) {
      var t = d3.select(this);
      if (t.attr("fill") !== "grey"){
        t.attr("fill","grey")
        dim.filter(d.data.key);
        renderAll(selector);
      } else {
        t.attr("fill",d => color(d.data.key));
        dim.filterAll();
        renderAll(selector);
        

    }});

  const arcValue = d3.arc()
    .innerRadius(fourth * .75)
    .outerRadius(fourth * .75);

  const values = plotArea.append("g")
    .selectAll('text')
    .data(arcs)
    .enter()
    .append('text')
    .style('text-anchor', 'middle')
    .style('alignment-baseline', 'middle')
    .attr('transform', d => `translate(${arcValue.centroid(d)})`)
    
    ;

    //values.append('tspan')
    //.attr('y', -10)
    //.attr('x', 5)
    //.style('font-weight', 'bold')
    //.style("fill", "white")
    //.text(d => `${Math.round(d.data.value / total * 100)}%`)
    

  const labels = plotArea.append("g")
    .selectAll('text')
    .data(arcs)
    .enter()
    .append('text')
    .attr("class", "axis")
    .style('text-anchor', 'middle')
    .style("font-size", "14px")
    .style('alignment-baseline', 'middle')
    .attr('transform', d => `translate(${arcLabel.centroid(d)})`);
   

  labels.append('tspan')
    .attr('y', '-0.6em')
    .attr('x', 0)
    .style('font-weight', 'bold')
    .text(d => `${d.data.key}`);

  //labels.append('tspan')
  //  .attr('y', '0.6em')
  //  .attr('x', 0)
  //  .text(d => `${formatDollar(d.data.value/1000000)}M`);



  chart.append("text")
    .attr("x", (w+margin.left+margin.right)/2)            
    .attr("y", margin.top)
    .attr("class","figtitle")
    .text(title1);

  chart.append("text")
    .attr("x", (w+margin.left+margin.right)/2)            
    .attr("y", margin.top+20)
    .attr("class","figtitle")
    .text(title2);

  
  chart.selectAll("dots")
  .data(arcs)
  .enter()
  .append("circle")
    .attr("cx", w-margin.right-margin.left-30)
    .attr("cy", function(d,i){ return h - 82 + i*20}) 
    .attr("r", 7)
    .style("fill", d=>color(d.data.key));

  // Add the names.
  chart.selectAll("labels")
  .data(arcs)
  .enter()
  .append("text")
    .attr("x", w-margin.right-margin.left-20)
    .attr("y", function(d,i){ return h - 80 + i*20})
    .style("fill", d=>color(d.data.key))
    .text(d=>d.data.key)
    .attr("text-anchor", "left")
    .style("font-size", "14px")
    .style('font-weight', 'bold')
    .style("alignment-baseline", "middle");
};


  //////////////////////////////////////////////////
function tablePlot(selector, dataraw, fields, {...args}= {}) {
    d3.select(selector).selectAll("svg").remove();
    d3.select(selector).selectAll("table").remove();

    var {lu={}, fieldmask={}, rowUrl=null, rowFilter=null, title1="", title2=""} = args;

    var data = dataraw.map(function(d,i) {d['number'] = i + 1; return d});
    

    var container = d3.select(selector)
      .style("text-align","center");

    container.append("text")
      .attr("class", "figtitle")
      .style("display","inline-block")
      .style("width","100%")
      .text(title1);
    container.append("text")
      .attr("class", "figtitle")
      .style("display","inline-block")
      .style("width","100%")
      .text(title2);
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
      .attr("width", function(d, i) {
        if(i==0) {
          return "10%"
        } else if (i==1) {
          return "70%"
        } else {
          return "20%"
        }
      })
      .on("click", d => tablePlot(selector, colSort(data,d), fields, args))

    ;

    var tablebody = table.append("tbody");

    rows = tablebody
      .selectAll("tr")
      .data(data)
      .enter()
      .append("tr")
      ;

    var cells = rows.selectAll("td")
      .data(function (row) {
            return fields.map(function (field) {
                return { name: field, value: row[field] };
            });
        })
        .enter()
        .append("td")
        .attr('data-th', d=> lu[d.name])
        .text(function(d) { console.log(d); if (d.name=="value") {return formatDollar(+d.value)} else {return d.value}} );

};



/////////////////////     VISN Map    /////////////////////
function stateMap(selector, data, height=600, width=900) {

  d3.select(selector).selectAll("svg").remove();


  var features = visn.features;

  var fixed = visn;
  fixed['features'] = visn.features.map(function(feature) {
    return turf.rewind(feature,{reverse:true});
  });


    

  var projection = d3.geoAlbersUsa().fitExtent([[25,25],[width-25,height-25]], fixed);

  var path = d3.geoPath()
    .projection(projection)
  ;


  var stLu = arrayToObject(data);
  

  var visnlist = data.map(d=>d.key);

    
  
  var color = d3.scaleOrdinal()
      .domain(visnlist)
      .range(d3.schemeCategory10.concat(d3.schemeAccent, d3.schemeDark2))
      ;
  
  var svg = d3.select(selector)
      .append("svg")
      .attr("width",width)
      .attr("height",height)
      .style("border","3px solid black")
      ;






  function mouseover(k) {
        
    d3.select("#tooltip")
    //.html(k + "<br/>"  + formatDollar(stLu[k]))
    .html("<br>"+ formatDollar(stLu[k]))
    .attr("class", "tooltip");
    };

  var visns = svg
      .selectAll("g")
      .data(fixed.features)
      .enter()
      .append("g");
  
  visns.append("path")
      .attr("d", path)
      .attr("fill",d=> color(d.properties.VISN))
      .attr("stroke","black")
      .attr("id",d=>d.properties.VISN)
      .on("mouseover", d => mouseover(d.properties.VISN))  
      .on("mousemove", d => mousemove())		
      .on("mouseout", d => mouseout())
      ;

  function vpos(d) {
    v = d.properties.VISN;
    if (v=="NCO 20") { return ["159","145"]}
    else if (v=="NCO 01") { return ["820","160"]}
    else {return path.centroid(d)}
    };

  // Append VISN names  
  visns.append("text")
      .text(function(d){
          return d.properties.VISN;
      })
      .attr("x", d => vpos(d)[0])
      .attr("y", d => vpos(d)[1])
      .attr("text-anchor","middle")
      .attr('font-size','12pt');

  // Append Title 1
    svg.append("g")
    .append("text")
    .attr("x", (width+margin.left+margin.right)/2)            
    .attr("y", margin.top)
    .attr("class","figtitle")
    .text("VISN Obligations");

  // Append Title 2
  svg.append("g")
      .append("text")
      .attr("x", (width+margin.left+margin.right)/2)            
      .attr("y", margin.top+20)
      .attr("class","figtitle")
      .text("February 3 - July 13, 2020");
    


  };