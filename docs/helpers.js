
  function mousemove(selection="#tooltip") {
    var t = d3.event.pageY || 0;
    var l = d3.event.pageX + 5 || 0;
    d3.select(selection)
      .style("top", (t - 65) + "px")
      .style("left", l + "px")
      ;
    
};

  
function mouseout(selection="#tooltip") {
  d3.select(selection)
    .attr("class", "hidden")
    .html("");
};

function mouseover(d, {...args}={}) {
  var {labels={}, selection="#tooltip"} = args;
  //console.log(args);
  d3.select(selection)
  .html((labels[d.key] || d.key) + "<br/>"  + formatDollar(d.value))
  .attr("class", "tooltip");
  };

//"Wk of Apr 13"
function weekDate(dt) {
  var mo = dt.slice(6,9); 
  var dy = +dt.slice(10,12);
  return new Date(2020, mos.indexOf(mo), dy);
}

function sortWeek(a,b) {

  if (weekDate(a.key) > weekDate(b.key)) {
    return 1;
  } else {
      return -1;
  }
}

function sortMonth(a,b) {

  if (mos.indexOf(a.key) > mos.indexOf(b.key)) {
    return 1;
  } else {
      return -1;
  }
}

function colSort(data, col) {
  if (sortAscending) {
      sortAscending = false;
      return data.sort(function(a, b) {
        v1 = +a[col] || a[col];
        v2 = +b[col] || b[col];
        
        if (v1 > v2) {
            return 1
        } else {
            return -1
        }
      });
  } else {
        sortAscending = true;
        return data.sort(function(a, b) {
            v1 = +a[col] || a[col];
            v2 = +b[col] || b[col];
            
            if (v1 < v2) {
                return 1
            } else {
                return -1
            }
        
        });

  }
}

const arrayToObject = (array) =>
    array.reduce((obj, item) => {
        obj[item.key] = item.value
        return obj
    }, {});


function renderAll(skip=null) {
  Object.keys(pg1).forEach(function (func) {
    if (func !== skip) {
      pg1[func]();
    }
  });
}

function cleanDept(dept) {
  if(dept) {
    return dept.split(",")[0];
  };
};

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
};

function formatDollar(val) {
  if (typeof val == 'number') {
    return '$' + val.toFixed(0).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  }
  else {
    return val;
  }
}

function scale (scaleFactor) {
  return d3.geoTransform({
      point: function(x, y) {
          this.stream.point(x * scaleFactor, y  * scaleFactor);
      }
  });
};


function totalobs(){
  //return formatDollar(d3.sum(compGroup.all().map(d=>d.value)));
  return formatDollar(ndx.groupAll().reduceSum(d=>d.obligatedAmount).value());
};

function plotTotalObs(selector) {
  var val = totalobs();
  d3.select(selector)
    .html("<b>Total Obligations</b><br>"+val);
 
}



/////////////////////////////////////////////////////  

function plotTreemap(selector, data, dim, caption='', pg=pg1, width=1000, height=500) {

  d3.select(selector).selectAll("svg").remove();
  d3.select(selector).selectAll("table").remove();
  d3.select("#treemapdiv").remove();

  

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  
  var container = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id","tm")
    .style("border","3px solid black")
    //.text("blah")
    ;

  container.append("text")
    .attr("x", (width / 2))             
    .attr("y", margin.top/2 + 5)
    .attr("class", "caption")  
    .text(caption);
  
  var svg = container.append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  

  var tooltip = d3.select("body").append("div")
                  .attr("class","hidden")
                  .attr("id","treemapdiv")
                  ;

  function mouseover(d) {
    tooltip
      .html(orgs[d.data.key] + "<br/>"  + formatDollar(d.data.value))
      .attr("class", "tooltip");
  };


  var moddata = {
    children: data.map(item => ({key: item.key, value: Math.max(item.value,0) || 0}))
  };


  var root = d3.hierarchy(moddata)
    .sum(d=>d.value)
    .sort((a, b) => b.value - a.value);

  
  d3.treemap()
    .size([width, height])
    .padding(2)
    .round(true)
    (root);



  svg
    .selectAll("rect")
    .data(root.children)
    .enter()
    .append("rect")
      .attr('x', function (d) { return Math.max(d.x0, 0) || 0; })
      .attr('y', function (d) { return Math.max(d.y0, 0) || 0; })
      .attr("id", d=>'tm' + d.data.key)
      .attr('width', function (d) { return d.x1 - d.x0 || 0; })
      .attr('height', function (d) { return d.y1 - d.y0 || 0; })
      .style("fill", d=>color(d.data.key))
      .on("mouseover", d => mouseover(d))  
      .on("mousemove", d => mousemove("#treemapdiv"))		
      .on("mouseout", d => mouseout("#treemapdiv"))
      .on("click", function(d) {

        var f = d3.select("#tm"+d.data.key);
        var cur = "" + f.style("fill");
        var exp = "" + d3.color(color(d.data.key));
      

        if (cur == exp){
         
          dim.filter(d.data.key);
          Object.keys(pg).forEach(function (func) {
            if(func!==selector) {
              pg[func]();
            };
          d3.select("#tm"+d.data.key).style("fill", "rgb(128, 128, 128)");
          });
        } else {

          f.style("fill",d => color(d.data.key));
          dim.filterAll();
          Object.keys(pg).forEach(function (func) {
            if(func!==selector) { pg[func](); }
          })
        }
      });
    ;

    

  // and to add the text labels
  svg
    .selectAll("text")
    .data(root.descendants())
    .enter()
    .append("text")
      .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
      .attr("y", function(d){ return Math.max(d.y0,0)+20})    // +20 to adjust position (lower)
      .text(d => orgs[d.data.key])
      .attr("font-size", "12px")
      .attr("fill", "white")
     
      .style("opacity", function(d) {
        //console.log(orgs[d.data.key] + ": " + (d.x1 - d.x0));
        
        if((d.x1 - d.x0) >= 150) {
          

          return 1; // show text
        } else {
          return 0; // don't show text
        }
      })
      ;





};



///////////////////////////////////////////////////

function plotCard(selector, val, title) {
 

  d3.select(selector).selectAll("svg").remove();
  d3.select(selector).selectAll("table").remove();

  var w = 300;
  var h = 150;
   
  var svg = d3.select(selector)
            .append("svg")
              .attr("width", w)
              .attr("height", h)
              .style("background-color", "steelblue")
              .style("border","3px solid black")
            .append("g")
              .attr('transform', `translate(${0}, ${h/4})`)
                ;

        svg.append("text")
            .attr("x", w/2)            
            .attr("y", (h/4)-10)
            .attr("fill", "#fff")
            .attr("text-anchor", "middle") 
            .style("font-size", "24px")
            //.style("text-decoration", "underline") 
            .text(title);

        svg.append("text")
            .attr("x", w/2)            
            .attr("y", (h/4)+10)
            .attr("fill", "#fff")
            .attr("text-anchor", "middle") 
            .style("font-size", "18px")
            .text(val);
};

////////////////////////////////////////////////////




////////////////////////////////////////////////////




//////////////////////////////////////////////////////////////////////
 
function tableAgPlot(selector, dataraw, labels=['Number','Key','Value'], lu={}, {...args}={}) {

    d3.select(selector).selectAll("table").remove();
    //var w = +d3.select(selector).style('width').slice(0, -2);

    var {w=500, rowUrl=null, rowFilter=null, title=''} = args;

    var data = dataraw.map(function(d,i) {d['Number'] = '' + i + 1; return d});

  

    var table = d3.select(selector)
      .append("table")
      .style("width", w)
      .attr("class","agtable")
      .style("border", "3px solid black");

   if(title != null) {
     table.append("caption")
      .attr("class", "tabletitle")
      .text(title);
   };

    
       
    var header = table.append("thead").append("tr");
 
    header
      .selectAll("th")
      .data(labels)
      .enter()
      .append("th")
      .attr("width", function(d, i) {
        if(i==0) {
          return "10%"
        } else if (i==1) {
          return "70%"
        } else {
          return "20%"
        }
      })
      .text(function(d) { return d; });
 
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
              rowFilter.filterAll();
              
              renderAll(selector);
              
            } else {
              t.attr("class","selected_row");
              rowFilter.filter(d.key);
              renderAll(selector);
            };
            
          };
        
        if(rowUrl) {window.open(d[rowUrl])}});

    var cells = rows.selectAll("td")
        //.data(d => Object.values(d))
        .datum(d => d)
        .enter()
        .append("td")
        .attr('data-th', d=>console.log(d))
        .text(d=>lu[d] || formatDollar(d));

  };

 


//////////////////////////////////////////////////////
function week(dt) {
  var year = +dt.slice(0,4);
  var month = +dt.slice(5,7);
  var day = +dt.slice(8,10)
  function serial(days) { return 86400000*days; }
  function dateserial(year,month,day) { return (new Date(year,month-1,day).valueOf()); }
  function weekday(date) { return (new Date(date)).getDay()+1; }
  function yearserial(date) { return (new Date(date)).getFullYear(); }
  var date = year instanceof Date ? year.valueOf() : typeof year === "string" ? new Date(year).valueOf() : dateserial(year,month,day), 
      date2 = dateserial(yearserial(date - serial(weekday(date-serial(1))) + serial(4)),1,3);
  return ~~((date - date2 + serial(weekday(date2) + 5))/ serial(7));
}


function getMonday(d) {
  var m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
  var d = new Date(d);
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday

  monday=new Date(d.setDate(diff));
  var curr_date = monday.getDate();
  var curr_month = monday.getMonth();
  var curr_year = monday.getFullYear();
  return  "Week of " + m_names[curr_month] + " " + curr_date;
}


function compare(a, b) {

  let comparison = 0;
  if (a.key > b.key) {
    comparison = 1;
  } else if (a.key < b.key) {
    comparison = -1;
  }
  return comparison;
}

function reorder(input,orderlist) {
  var output = [];
  
  orderlist.forEach( function(v){
    input.forEach( function(o){
      if(o.key == v) {
        output.push(o)
    }
  })})
  return output;
};

//////////////////////////////////////////////////////////////

function linePlot(selector, data, caption="", h=400) {
 
  //var d1 = data.sort(compare);
  var d1 = data;
  var maxval = d3.max(d1.map(d=>d.value)) * 1.1;
  

  d3.select(selector).selectAll("svg").remove();
  d3.select(selector).selectAll("table").remove();
  d3.select("#linediv").selectAll("div").remove();

    var tooltip = d3.select("body").append("div")
    .attr("class","hidden")
    .attr("id","linediv")
    ;

    

  //var w = +d3.select(selector).style('width').slice(0, -2);
  var w = 700;


  xScale = d3.scaleBand()
      .domain(d1.map(d => d.key))
      .range([0, w]);

  yScale = d3.scaleLinear()
      .domain([0, maxval]) 
      .range([h, 0]);

  yScale1 = d3.scaleLinear()
      .domain([0, maxval/1000000]) 
      .range([h, 0]);

  var svg = d3.select(selector).append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      ;
  
  svg.append("text")
      .attr("x", (w / 2))             
      .attr("y", 0 )
      .attr("text-anchor", "middle")  
      .style("font-size", "16px") 
      .style("font-weight", "bold")  
      .text(caption);


  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(xScale).ticks(6));
  

  svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(yScale1));

  var line = d3.line()
    .x(d => xScale(d.key))
    .y(d => yScale(Math.max(d.value, 0)));

   
  svg.append("path")
      .datum(d1) 
      .attr("class", "line") 
      .attr("d", line)
      
      ;


  svg.selectAll(".dot")
      .data(d1)
      .enter()
      .append("circle") 
      .attr("class", "dot")
      .attr("cx", d => xScale(d.key))
      .attr("cy", d => yScale(d.value))
      .attr("r", 5)
      .on("mouseover", d => mouseover("#linediv", d))  
      .on("mousemove", d => mousemove("#linediv"))		
      .on("mouseout", d => mouseout("#linediv"))
      ;
};

//////////////////////////////////////////////////////////

function hbarPlot(selector, data, dim, title, {...args}={}) {

  var {w=400, h=300, lu={}} = args;

  var margin = {top: 20, right: 10, bottom: 20, left: 40};

  d3.select(selector).selectAll("svg").remove();
  d3.select(selector).selectAll("table").remove();


    
      var width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom;

    var barheight = 25;

    var chart = d3.select(selector)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("background-color","white")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([0, width])
      ;

      chart.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(3));

      

    var y = d3.scaleBand()
      .domain(data.map(d => d.key))
      .range([0,height])
      .paddingInner(0.1);

    var y_axis = d3.axisLeft()
      .scale(y)
      .tickFormat(d => lu[d] || d);

    chart.append("g")
        .call(y_axis);

    var bars = chart.selectAll(".bar")
      .data(data)
      .enter()
      .append("g")

    bars.append("rect")
      .attr("class", "bar")
      .attr("y", d=> y(d.key) + barheight/2)
      .attr("height", barheight)
      .attr("x", 0)
      .attr("fill", "steelblue")
      .attr("width", d => x(Math.max(d.value,0)))
      .on("mouseover", d => mouseover(d))  
      .on("mousemove", d => mousemove())		
      .on("mouseout", d => mouseout())
      .on("click", function(d) {
        var t = d3.select(this);
        if (t.attr("fill") == "steelblue"){
          t.attr("fill","red")
          dim.filter(d.key);
          renderAll(selector);
        } else {
          t.attr("fill","steelblue");
          dim.filterAll();
          renderAll(selector);
        };
        
      })
      ;

    
};





function bubblePlot(vals) {
  
  

  d3.select(selector).selectAll("svg").remove();
  d3.select(selector).selectAll("table").remove();

  var width = w - margin.left - margin.right;
  var height = h - margin.top - margin.bottom;

  
  function ticked(){
    circles.attr("transform",function(d){return "translate(" + d.x + "," + d.y + ")"})
  };

  var simulation = d3.forceSimulation()
        .force("forceX", d3.forceX().strength(.1).x(width * .05))
        .force("forceY", d3.forceY().strength(.1).y(height * .5))
        .force("center", d3.forceCenter().x(width * .5).y(height * .5))
        .force("charge", d3.forceManyBody().strength(-5))
        .force("collide",d3.forceCollide(d=>radiusScale(d.value) || 0));
    	
  var radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d=>d.value)])
    .range([1,100])
    ;


  var svg = d3.select(selector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform","translate(0,0)")
    ;
		  	
  var circles = svg.selectAll("items")
    .data(data)
    .enter()
    .append("g")
    .attr("cx",0)
    .attr("cy",0)
    .attr("fill", "steelblue")
    ;
    
  circles.append("circle")
      .attr("r", d=> Math.max(radiusScale(d.value), 0))
      ;
  
  //circles.append("text")
  //		.attr("dx", -2)
  //    .attr("dy", -2)
  //    .attr("font", ".5em")
  // 	.text(d => d.key)
  //	;
    
    
    

    
  simulation.nodes(data)
    .on("tick",ticked)
  
  //function ticked() {
  //	circles
  //		.attr("cx", d=>d.x)
  //		.attr("cy", d=>d.y)
  //}
  

  

};


