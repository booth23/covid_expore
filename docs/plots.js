//function barPlot(selector, data, dim, {...vals}={}) {

function barPlot({...vals}={}) {


    var {selector, 
        data, 
        dim,
        xspace = 200, 
        w=500, 
        h=500, 
        titlespace=50,
        title = ''} = vals;

    var width = w + margin.right + margin.left + xspace + 20;
    var height = h + margin.top + margin.bottom + titlespace + 40;

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

    function color1(d) {
      if (dim.currentFilter() == d) {
        return "gray";
      } else {
        return "steelblue";
      };
    };
  
    // add rectangles for each category
    var bars = chart.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("height", d=> Math.max(h - yscale(d.value),0))
        .attr("width",xscale.bandwidth())
        .attr("x", d=>xscale(d.key))
        .attr("y", d=>yscale(Math.max(d.value, 0)))
        .attr("fill", d => color1(d.key))
        .attr("margin", "3px")
        .on("mouseover", d => mouseover(d, {'labels':orgs}))  
        .on("mousemove", d => mousemove())		
        .on("mouseout", d => mouseout())
        .on("click", function(d) {
            if (dim.currentFilter() !== d.key){
              
              dim.filter(d.key);
              renderAll();
              
            } else {
              
              dim.filterAll();
              renderAll();
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
                .tickValues(xscale.domain().filter(function(d,i){ return !(i%4)})))
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
        .text(title)
        ;

    if (filters().length > 0) {       
          svg.append("text")
            .attr("x", margin.right)
            .attr("y", height-margin.bottom)
            .style("font-size", "12px")
            .text("Filtered by " + filters())
            ;
    };



    var periods = ["Weekly","Monthly"];


    var totalvals = ["Total:", formatDollar(ndx.groupAll().reduceSum(d=>d.amt).value())];
    

    var total = svg.append("g")
      .attr("transform", d => "translate(" + margin.left + "," + (margin.top + titlespace) + ")");
      
    total.selectAll("text")
      .data(totalvals)
      .enter()
      .append("text")
      .attr("x", 0)
      .attr("y", d => totalvals.indexOf(d)*25)
      .style('fill', 'black')
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
                row1_params['data'] = weeklyGroup.all().sort(sortWeek);
                row1_params['title'] = "Obligations by Week";
                row1_params['dim'] = weeklyDim;
                //barPlot(selector, weeklyGroup.all().sort(sortWeek), "Obligations by Week", weeklyDim, vals);
            } else {
                row1_params['data'] = monthGroup.all().sort(sortMonth);
                row1_params['title'] = "Obligations by Month"
                row1_params['dim'] = monthDim
                
            };
            barPlot(row1_params);
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
  var fourth = w / 3;
  var half = w / 2;
  var labelOffset = fourth * 1.2;
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

  function color1(d) {
    if (dim.currentFilter() == d) {
      return "gray";
    } else {
      return color(d);
    }
  };
  

  plotArea.selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('fill', d => color1(d.data.key))
    .attr('stroke', 'white')
    .attr('d', arc)
    .on("mouseover", d => mouseover(d))  
    .on("mousemove", d => mousemove())		
    .on("mouseout", d => mouseout())
    .on("click", function(d) {
      var t = d3.select(this);
      if (dim.currentFilter() !== d.data.key){

        dim.filter(d.data.key);
        renderAll();
      } else {
        //t.attr("fill",d => color(d.data.key));
        dim.filterAll();
        renderAll();
        

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

  chart.append("text")
    .attr("x", (w+margin.left+margin.right)/2)            
    .attr("y", margin.top)
    .attr("class","figtitle")
    .text(title1);

  
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

  if (filters().length > 0) {
    chart.append("text")
      .attr("x", margin.right)
      .attr("y", h-margin.bottom)
      .style("font-size","12px")
      .text("Filtered by " + filters());
  };
};


  //////////////////////////////////////////////////
function tablePlot(selector, dataraw, fields, {...args}= {}) {
    d3.select(selector).selectAll("svg").remove();
    d3.select(selector).selectAll("table").remove();
    d3.select(selector).selectAll("text").remove();

    var {lu={}, fieldmask={}, rowUrl=null, rowFilter=null, title1=""} = args;

    if (visnDim.currentFilter()) {
      var data = visnGroup.all().filter(d => d.key == visnDim.currentFilter()).map(function(d,i) {d['number'] = i + 1; return d});
    } else {
      var data = dataraw.map(function(d,i) {d['number'] = i + 1; return d});
    };

    
    

    var container = d3.select(selector)
      .style("text-align","center");

    container.append("text")
      .attr("class", "figtitle")
      .style("display","inline-block")
      .style("width","100%")
      .text(title1);

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

    if (filters().length > 0) {
      var tfoot = table.append("tfoot");

      tfoot.append("td");

      tfoot.append("td")
        .attr("colspan",0)
        .text("Filtered by " + filters());
      
    };


    var tablebody = table.append("tbody");

    rows = tablebody
      .selectAll("tr")
      .data(data)
      .enter()
      .append("tr")
      .on("click", function(d) {
        t = d3.select(this)
        if(visnDim.currentFilter()==d.key) {        
            t.attr("class","")
            visnDim.filterAll();  
            renderAll();
              
            } else {
              t.attr("class","selected_row");
              visnDim.filter(d.key);
              renderAll();
            };
            
        });
      

    var cells = rows.selectAll("td")
      .data(function (row) {
            return fields.map(function (field) {
                return { name: field, value: row[field] };
            });
        })
        .enter()
        .append("td")
        .attr('data-th', d=> lu[d.name])
        .text(function(d) { if (d.name=="value") {return formatDollar(+d.value)} else {return d.value}} );

};



/////////////////////     VISN Map    /////////////////////
function stateMap(selector, dataraw, height=600, width=900) {

  d3.select(selector).selectAll("svg").remove();

  var data = dataraw.filter(d => d.key.startsWith("NCO"));


  var features = visn.features;

  var fixed = visn;
  fixed['features'] = visn.features.map(function(feature) {
    return turf.rewind(feature,{reverse:true});
  });

  var projection = d3.geoAlbersUsa().fitExtent([[25,25],[width-25,height-25]], fixed);

  var path = d3.geoPath()
    .projection(projection)
  ;
  
  var scheme = ["#FCFF33", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", 
        "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#7fc97f", "#beaed4", "#fdc086", 
        "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666", "#1b9e77", "#d95f02", 
        "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"];

  var stLu = arrayToObject(data);

  var visnlist = data.map(d=>d.key);

  var color = d3.scaleOrdinal()
      .domain(visnlist)
      .range(scheme)
      ;

  function color1(d) {
    if (visnDim.currentFilter() == d) {
      return "white";
    } else {
      return color(d)
    };
  };
  
  var svg = d3.select(selector)
      .append("svg")
      .attr("width",width)
      .attr("height",height)
      .style("border","3px solid black")
      ;


  function mouseover(k) {
        
    d3.select("#tooltip")
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
      .attr("fill",d=> color1(d.properties.VISN))
      .attr("stroke","black")
      .attr("id",d=>d.properties.VISN)
      .on("mouseover", d => mouseover(d.properties.VISN))  
      .on("mousemove", d => mousemove())		
      .on("mouseout", d => mouseout())
      .on("click", function(d) {
        var k = d.properties.VISN;
        var f = visnDim.currentFilter();

        if (k==f){
          visnDim.filterAll();
        
      } else {
        
        visnDim.filter(d.properties.VISN);
        
      }
      renderAll();
      })

      ;

  function vpos(d) {
    v = d.properties.VISN;
    if (v=="NCO 20") { return ["159","145"]}
    else if (v=="NCO 01") { return ["870","165"]}
    else if (v=="NCO 02") { return ["770","195"]}
    else if (v=="NCO 05") { return ["738","271"]}
    else if (v=="NCO 08") { return ["770","468"]}
    else if (v=="NCO 10") { return ["660","250"]}
    else if (v=="NCO 12") { return ["592","200"]}
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
    .text("NCO Obligations");


    svg.append("g")
    .append("text")
    .attr("x", 445)            
    .attr("y", 360)
    //.attr("class","figtitle")
    .text("NCO 19");

    if (filters().length > 0) {
      svg.append("text")
        .attr("x", width - 200)
        .attr("y", height-15)
        .style("font-size","12px")
        .text("Filtered by " + filters());
    };


  };