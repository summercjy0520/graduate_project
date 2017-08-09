/**
 * 初始化代码块
 */
$(function() {
	cache = [];
	$("#submit-button").on("click", function() {
		queryWrapper("submit");
	});
	$(document).keypress(function(e) {
		if (e.which == 13) {
			e.preventDefault();
			$("#submit-button").click();
		}
	});

});

/**
 * 查询成功的回调函数
 * 
 * @param data
 * @param keyword
 */
function success_fn(data, keyword) {
	drawTweets(data, keyword);
	var times = [];
	var Dataset=[];
	var  temp=data[1].dateline;
	var count=0;
	for (var i = 0; i < data.length; i++) {
		var record = data[i];
		var obj = new Object();
		obj.slice = record.dateline;
		obj.count = 1;
		count=count+1;
		times.push(obj);
		if (temp==record.dateline){
			temp=record.dateline;
		}else{
			Dataset.push(count);
			count=0;
			temp=record.dateline;
		}
		
	}
//      for(var key in data){
//    	  dataset.push(key);
//      }
	drawTimeSerialBrush(times,Dataset);
	cache = data;
}

/**
 * 查询函数入口，调用rest api
 * 
 * @param type
 */
function queryWrapper(type) {
	cache = [];
	var keyword = $("#keyword-textbox").val();
	$.ajax({
		type : 'GET',
		url : './keywordQuery/' + keyword,
		success : function(data) {
			if (data["error-code"]) {
				alert("[Ajax Error]\n");
			} else {
				success_fn(data, keyword);
			}
		},
		error : function(data) {
			if (data["status"] == 200) {
				success_fn(data, keyword);
			} else {
				alert("[Ajax Error]\n" + JSON.stringify(data));
			}
		}
	});
}

/**
 * 列出查出的所有新闻
 * 
 * @param message
 * @param keyword
 */
function drawTweets(message, keyword) {
	$('#NEWS').html('');
	$('#NEWS').append(
			'<table class="table"><thead></thead><tbody></tbody></table>');
	$('#NEWS table thead')
			.append(
					'<tr><td center><strong>TITLE</strong></td><td center><strong>DATELINE</strong></td></tr>');
	$.each(message, function(i, d) {
		$('#NEWS table thead').append(
				'<tr><td><strong>' + d.title + '</strong></td><td rowspan="2">'
						+ d.dateline + '</td></tr>').append(
				'<tr><td>' + handleContent(d.section, keyword) + '</td></tr>');
	});
	// $("#NEWS table").trigger('create');

}

/**
 * slice_count 为时间序列数组
 * 
 * @param slice_count
 */
function drawTimeSerialBrush(slice_count,Dataset) {
	$("#time-series").html("");
	var margin = {
		top : 10,
		right : 10,
		bottom : 30,
		left : 50
	}, width = 962 - margin.left - margin.right, height = 300 - margin.top
			- margin.bottom;

	timeSeries = dc.lineChart("#time-series");
	var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ").parse;

	slice_count.forEach(function(d) {
		d.slice = parseDate(d.slice);
		d.count = d.count;
	});
	
	var ndx = crossfilter(slice_count);
//    var temp=[];
	var timeDimension = ndx.dimension(function(d) {
		if (d.slice != null)
			return d.slice;
//		    temp.push(d.slice);
	});
	timeBrush = timeSeries.brush();
	// 拖动按钮的时间函数
	timeBrush.on('brushend', function(e) {
		    var width = 500;  
	        var height = 500;  
//	        var dataset = [ 30 , 10 , 43 , 55 , 13 ];  
	        var map = {};
	        for(var i = 0; i < Dataset.length; i++){
	            var ai = Dataset[i];
	            if(!map[ai]){
	                map[ai] = 1;
	            }else{
	                map[ai]++;
	            }
	        }
	        console.log(map);
	        var datalength=[];
	        for(var key in map){
           	  datalength.push(key);
            }
	        var dataset=[];
	        for(var i = 0; i < datalength.length; i++){
	        	dataset.push(map[datalength[i]]);
	        }
//	        var x = d3.time.scale().range([0, width]),
//	        y = d3.scale.linear().range([height, 0]);
//	        var dataset = d3.svg.brush()
//	        .x(x)
//            .extent([new Date(2013, 2, 2), new Date(2013, 2, 3)])  
//           .on("brush", brushed);
	        var svg = d3.select("body").append("svg")
			.attr("width",width)
			.attr("height",height);

           var pie = d3.layout.pie();

          var outerRadius = width / 4;
          var innerRadius = width / 8;
          var arc = d3.svg.arc()
	          .innerRadius(innerRadius)
	         .outerRadius(outerRadius);

          var color = d3.scale.category10();

          var drag = d3.behavior.drag()
             .origin(function(d) { return d; })
             .on("drag", dragmove);

          var gAll = svg.append("g")
                .attr("transform","translate("+outerRadius+","+outerRadius+")");
  
          var arcs = gAll.selectAll(".arcs_g")
                .data(pie(dataset))
                .enter()
               .append("g")
               .each(function(d){
	               	d.dx = 0;
	             	d.dy = 0;
                })
               .call(drag);

               arcs.append("path")
              .attr("fill",function(d,i){
             return color(i);
          })
            .attr("d",function(d){
            return arc(d);
      });

            arcs.append("text")
           .attr("transform",function(d){
           return "translate(" + arc.centroid(d) + ")";
})
          .attr("text-anchor","middle")
         .text(function(d){
         return d.value;
});

              console.log(dataset);
              console.log(pie(dataset));


            function dragmove(d) {
                  d.dx += d3.event.dx;
                  d.dy += d3.event.dy;
                  d3.select(this)
                 .attr("transform","translate("+d.dx+","+d.dy+")");
            }

	});
	var timeGroup = timeDimension.group().reduceSum(function(d) {
		return d.count;
	});
	var minDate = timeDimension.bottom(1)[0].slice;
	var maxDate = timeDimension.top(1)[0].slice;
	$('#time-series').append(
			'<text style="font:12px sans-serif">' + minDate.getFullYear() + "-"
					+ (minDate.getMonth() + 1) + "-" + minDate.getDate()
					+ '</text>');
	timeSeries.renderArea(true).width(width).height(height).margins(margin)
			.dimension(timeDimension).group(timeGroup).x(
					d3.time.scale().domain([ minDate, maxDate ]));
	dc.renderAll();
	$('#time-series').append(
			'<text style="font:12px sans-serif">' + maxDate.getFullYear() + "-"
					+ (maxDate.getMonth() + 1) + "-" + maxDate.getDate()
					+ '</text>');

	console.log('finished refining query');
}

/**
 * 处理文本内容，强调关键词、分段等
 * 
 * @param content
 * @param keyword
 * @returns
 */
function handleContent(content, keyword) {
	var newcontent = []
	var parts = content.split("　　");
	for (var j = 0; j < parts.length; j++) {
		var part = parts[j];
		newcontent.push("    ");
		var splitContents = part.split(keyword);
		for (var i = 0; i < splitContents.length; i++) {
			newcontent.push(splitContents[i]);
			if (i != splitContents.length - 1) {
				newcontent.push('<strong">');
				newcontent.push(keyword);
				newcontent.push('</strong>');
			}
		}
		if (j != parts.length - 1) {
			newcontent.push("\n");
		}
	}
	return newcontent.join("");
}
