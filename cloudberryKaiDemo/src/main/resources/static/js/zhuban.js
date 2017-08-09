/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
// =============================   Inilization  =================================
$(function() {

	// Add a format function to String
	if (!String.prototype.format) {
		String.prototype.format = function() {
			var args = arguments;
			return this.replace(/{(\d+)}/g, function(match, number) {
				return typeof args[number] != 'undefined' ? args[number]
						: match;
			});
		};
	}

	TempDSName = "temp_" + Math.random().toString(36).substr(2, 9);

	// Initialize connection to AsterixDB. Just one connection is needed and
	// contains
	// logic for connecting to each API endpoint. This object A is reused
	// throughout the
	// code but does not store information about any individual API call.
	A = new AsterixDBConnection({

		// We will be using the geo dataverse, which we can configure either
		// like this
		// or by following our AsterixDBConnection with a dataverse call, like
		// so:
		// A = new AsterixDBConnection().dataverse("geo");
		"dataverse" : "zhuban",

		// Due to the setup of this demo using the Bottle server, it is
		// necessary to change the
		// default endpoint of API calls. The proxy server handles the call to
		// http://localhost:19002
		// for us, and we reconfigure this connection to connect to the proxy
		// server.
		// "endpoint_root" : "http://172.16.132.48:19002/",
		"endpoint_root" : "/zhubanWeb",

		// Finally, we want to make our error function nicer so that we show
		// errors with a call to the
		// reportUserMessage function. Update the "error" property to do that.
		"error" : function(data) {
			// For an error, data will look like this:
			// {
			// "error-code" : [error-number, error-text]
			// "stacktrace" : ...stack trace...
			// "summary" : ...summary of error...
			// }
			// We will report this as an Asterix REST API Error, an error code,
			// and a reason message.
			// Note the method signature: reportUserMessage(message,
			// isPositiveMessage, target). We will provide
			// an error message to display, a positivity value (false in this
			// case, errors are bad), and a
			// target html element in which to report the message.
			var showErrorMessage = "Asterix Error #" + data["error-code"][0]
					+ ": " + data["error-code"][1];
			var isPositive = false;
			var showReportAt = "aql";

			reportUserMessage(showErrorMessage, isPositive, showReportAt);
		}
	});

	// create map and add controls
	map = L.map('map').setView([ 33.8922, 109.0348 ], 4);
	L
			.tileLayer(
					'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
					{
						attribution : 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
						maxZoom : 18,
						// id : 'jeremyli.p6f712pj',
						// accessToken :
						// 'pk.eyJ1IjoiamVyZW15bGkiLCJhIjoiY2lrZ2U4MWI4MDA4bHVjajc1am1weTM2aSJ9.JHiBmawEKGsn3jiRK_d0Gw'
						id : 'mapbox.streets',
						// id : 'maimuderizi.citadfjci013f2so60krfp5gp-6o718',
						accessToken : 'pk.eyJ1IjoibWFpbXVkZXJpemkiLCJhIjoiY2lpamRwcWg2MDEwdHRta25odzJoMHhhdyJ9.InZvFo-41Ade6btFeXfoDg'
					}).addTo(map);

	cityPolygons = null;
	provincePolygons = null;
	// city_polygons = null;

	// cache each search results;
	cache = null;
	forRelationship = false;
	linesCache = []

	// status
	init = true;
	zoomLevel = 3;
	logicLevel = 'province';
	focusProvince = [ false, '' ];
	focusIndustry = [ false, '' ];

	// const
	initialStartDate = "2000-02-17T00:00:00.000Z";
	initialEndDate = getCurrentDate() + "T23:59:59.000Z";

	// style
	provinceStyle = {
		fillColor : '#f7f7f7',
		weight : 2,
		opacity : 1,
		color : '#92c5de',
		dashArray : '3',
		fillOpacity : 0.2
	};

	cityStyle = {
		fillColor : '#f7f7f7',
		weight : 1,
		opacity : 1,
		color : '#92c5de',
		fillOpacity : 0.2
	};

	hoverStyle = {
		weight : 5,
		color : '#666',
		dashArray : '',
		fillOpacity : 0.7
	};

	setInfoControl(map);

	// add zoom event listener

	map.on('zoomend', function() {
		zoomLevel = map.getZoom();
		if (zoomLevel > 5) {
			logicLevel = 'city';
			if (!forRelationship) {
				if (!init) {
					queryWrapper('zoom');
				}
				map.removeLayer(provincePolygons);
				map.addLayer(cityPolygons);
			}
		} else if (zoomLevel <= 5) {
			logicLevel = 'province';
			if (!forRelationship) {
				if (!init) {
					queryWrapper("zoom");
				}
				map.removeLayer(cityPolygons);
				map.addLayer(provincePolygons);
			}
		}
	}); // add drag event listener
	map.on("dragend", function() {
		focusProvince = [ false, '' ];
		if (logicLevel != 'province')
			queryWrapper("drag");
	});

	// submit button
	$("#submit-button").on("click", function() {
		init = false;
		focusProvince = [ false, '' ];
		focusIndustry = [ false, '' ];
		forRelationship = false;
		linesCache.forEach(function(e) {
			map.removeLayer(e);
		});
		linesCache = [];
		queryWrapper("submit");
	});

	$(document).keypress(function(e) {
		if (e.which == 13) {
			e.preventDefault();
			$("#submit-button").click();
		}
	});

	$('#sidebar').click(function(e) {
		e.preventDefault();
		if ($("#sidebar").attr("class") != "toggled")
			$("#sidebar").toggleClass("toggled");
		else {
			if ($(e.target).attr("id") == "sidebar")
				$("#sidebar").toggleClass("toggled");
		}
	});

	tempDatasetName = null;
	tempDatasetType = null;
	brush_start = null;
	brush_end = null;
});

function getCurrentDate() {
	var date = new Date();
	return toAQLDate(date);
}

function padding(integer) {
	return integer < 10 ? "0" + integer : integer;
}

function toAQLDate(date) {
	var month = date.getMonth() + 1
	var day = date.getDate();
	return date.getFullYear() + "-" + padding(month) + "-" + padding(day);
}

function toAQLTime(time) {
	var hours = time.getHours();
	var minus = time.getMinutes();
	var seconds = time.getSeconds();
	return padding(hours) + ":" + padding(minus) + ":" + padding(seconds);
}

function toAQLDateTime(dateTime) {
	return toAQLDate(dateTime) + "T" + toAQLTime(dateTime) + "Z";
}

function setInfoControl(map) {
	// Interaction function
	function highlightFeature(e) {
		var layer = e.target;

		layer.setStyle(hoverStyle);

		if (!L.Browser.ie && !L.Browser.opera) {
			layer.bringToFront();
		}
		info.update(layer.feature.properties);
	}

	function resetHighlight(e) {
		var style;
		if (!init)
			style = {
				weight : 2,
				fillOpacity : 0.5,
				color : 'white'
			};
		else
			style = {
				weight : 1,
				fillOpacity : 0.2,
				color : '#92c5de'
			}
		if (logicLevel == "province")
			provincePolygons.setStyle(style);
		else
			cityPolygons.setStyle(style);
		info.update();
	}

	function zoomToFeature(e) {
		focusProvince = [ true, e.target.feature.properties.code ];
		map.fitBounds(e.target.getBounds());
	}

	function onEachFeature(feature, layer) {
		layer.on({
			mouseover : highlightFeature,
			mouseout : resetHighlight,
			click : zoomToFeature
		});
	}

	// add info control
	var info = L.control();

	info.onAdd = function(map) {
		this._div = L.DomUtil.create('div', 'info'); // create a div with a
		// class "info"
		this.update();
		return this._div;
	};

	// method that we will use to update the control based on feature properties
	// passed
	info.update = function(props) {
		this._div.innerHTML = '<h4>Count by '
				+ logicLevel
				+ '</h4>'
				+ (props ? '<b>' + props.name + '</b><br />' + 'Count: '
						+ (props.count ? props.count : 0)
						: 'Hover over a province');
	};

	info.options = {
		position : 'topleft'
	};

	info.addTo(map);

	loadGeoJsonFiles(onEachFeature);
}

function loadGeoJsonFiles(onEachFeature) {
	/*
	 * state_hash = {} $.getJSON('static/data/states_hash.json', function(data) {
	 * state_hash = data; });
	 */

	province = {}
	$.getJSON('provinces.json', function(data) {
		province = data;
		provincePolygons = L.geoJson(data, {
			style : provinceStyle,
			onEachFeature : onEachFeature
		});
		provincePolygons.addTo(map);

	});

	city = {}
	$.getJSON('cities.json', function(data) {
		city = data;
		cityPolygons = L.geoJson(data, {
			style : cityStyle,
			onEachFeature : onEachFeature
		});
	});

}
// ============================= Query Builder Functions
// =================================
/**
 * buildAQL helper function
 */
function declareRectangle(bounds) {
	return 'let $region := create-rectangle(create-point({0},{1}),\n create-point({2},{3}))'
			.format(bounds['sw']['lng'], bounds['sw']['lat'],
					bounds['ne']['lng'], bounds['ne']['lat'])
}

/**
 * buildAQL helper function
 */
function buildTemporaryDataset(parameters) {
	tempDatasetName = [ 'securityCode', 'fullName', 'url', 'code', 'level',
			'bizscope', 'compintro', 'majorbiz', 'hashTag', 'releaseDate' ];
	tempDatasetType = [ 'string', 'string', 'string', 'tqCompBoardmapListItem',
			'int64', 'string', 'string', 'string', '[string]', 'datetime' ];

	var bounds = {
		"ne" : {
			"lat" : parameters["neLat"],
			"lng" : parameters["swLng"]
		},
		"sw" : {
			"lat" : parameters["swLat"],
			"lng" : parameters["neLng"]
		}
	};
	var aql = [];
	aql.push('drop dataset {0} if exists;'.format(TempDSName));
	aql.push('drop type tempType if exists;')
	var tempDataset = [];
	for (var i = 0; i < tempDatasetName.length; i++) {
		tempDataset.push(tempDatasetName[i] + ':' + tempDatasetType[i]);
	}
	aql.push('create type tempType as open{' + tempDataset.join(",") + '} \n');
	aql
			.push('create temporary dataset {0}(tempType) primary key securityCode; '
					.format(TempDSName));
	aql.push('insert into dataset {0} ('.format(TempDSName));
	aql.push(declareRectangle(bounds));// about $region

	var ds_for = 'for $t in dataset ZBCompanies \
		for $b in dataset allRegion ';
	var ds_predicate = 'let $temp := $t.xueqiu.basicInfo.tqCompBoardmapList \n'
			+ 'where len($temp)>0 \n'
			+ 'and contains(string($temp[len($temp)-1].keycode),$b.keycode) \n'
			+ 'and spatial-intersect($b.bounding_box, $region) \n';
	if (parameters["keyword"].length > 0) {
		var tokens = parameters["keyword"].split(/\s+/g);
		for (var i = 0; i < tokens.length; i++) {
			ds_predicate = 'let $keyword{0} := "{1}"\n'.format(i, tokens[i])
					+ ds_predicate;
		}
		for (var i = 0; i < tokens.length; i++) {
			ds_predicate += 'and  (contains($t.xueqiu.basicInfo.bizscope,$keyword{0}) \
				or contains($t.xueqiu.basicInfo.compintro,$keyword{0}) \
				or contains($t.xueqiu.basicInfo.majorbiz,$keyword{0}))  \n'
					.format(i);
		}
	}
	aql.push(ds_for);
	aql.push(ds_predicate);

	aql
			.push('return { \
					"securityCode": $t.securityCode,\
					"fullName" : $t.fullName,\
					"url":$t.url,\
					"code":$temp[len($temp)-1],\
					"level":len($temp),\
					"bizscope" : $t.xueqiu.basicInfo.bizscope,\
					"compintro" : $t.xueqiu.basicInfo.compintro,\
					"majorbiz" : $t.xueqiu.basicInfo.majorbiz, \
					"hashTag" : $t.companyInfo.conceptBelongedTo, \
					"releaseDate": datetime-from-date-time($t.companyInfo.releaseDate,time("00:00:00.000Z"))\
					}\n');
	aql.push(')'); // end of insert
	return aql;
}

/**
 * Builds AsterixDB REST Query from the form.
 */
function buildAQLQueryFromForm(parameters, type) {
	var aql;
	if (type != "time")
		aql = buildTemporaryDataset(parameters);
	else
		aql = [];

	aql.push(buildSpatial(type, parameters));
	aql.push(buildTimeGroupby(type, parameters));
	aql.push(buildHashTagCountQuery(type, parameters));
	aql.push(buildTweetSample(type, parameters));
	return aql.join('\n');
}

function buildSpatial(type, parameters) {
	var aql = [];
	aql.push('for $t in dataset {0}'.format(TempDSName));
	var level = parameters["level"];

	if (type == "time") {
		aql.push('let $ts_start := datetime("{0}")'
				.format(parameters['startdt']));
		aql.push('let $ts_end := datetime("{0}")'.format(parameters['enddt']));
		aql
				.push('where $t.releaseDate >= $ts_start and $t.releaseDate < $ts_end');
	}

	if (level === 'city') {
		aql.push(' group by $c := $t.code with $t ');
		aql.push(' let $count := count($t) \n');
		aql.push(' order by $count desc \n');
		aql.push(' return { "cell" : $c, "count" : $count};');
	} else if (level === "province") {
		aql.push(' group by $c := $t.code with $t ');
		aql.push(' let $count := count($t)\n');
		aql.push(' order by $count desc\n');
		aql.push(' return { "cell":$c, "count" : $count };');
	}
	return aql.join('\n');
}

/**
 * query tmp date set to get result group by time @ param string query type
 * @parameters query parameters
 */
function buildTimeGroupby(type, parameters) {
	var aql = [];
	aql.push('for $t in dataset {0}'.format(TempDSName));
	if (type == "time") {
		aql.push('let $ts_start := datetime("{0}")'
				.format(parameters['startdt']));
		aql.push('let $ts_end := datetime("{0}")'.format(parameters['enddt']));
	}
	aql.push('where $t.releaseDate >= datetime("1900-01-01T00:00:00.000Z")');
	if (type == 'time') {
		aql
				.push(' and $t.releaseDate >= $ts_start and $t.releaseDate < $ts_end');
	}
	aql
			.push('group by $c := print-datetime($t.releaseDate,"YYYY-MM") with $t ');
	aql.push('let $count := count($t)');
	aql.push('order by $c ');
	aql.push('return {"slice":$c, "count" : $count };\n');
	return aql.join('\n');
}

/**
 * query tmp date set to get result group by hashtag @ param string query type
 * @parameters query parameters
 */
function buildHashTagCountQuery(type, parameters) {
	var aql = [];

	aql.push('for $t in dataset {0}'.format(TempDSName));
	if (type == "time") {
		aql.push('let $ts_start := datetime("{0}")'
				.format(parameters['startdt']));
		aql.push('let $ts_end := datetime("{0}")'.format(parameters['enddt']));
	}
	aql.push('where not(is-null($t.hashTag)) ');
	if (type == "time") {
		aql
				.push('and $t.releaseDate >= $ts_start and $t.releaseDate < $ts_end');
	}
	aql.push('for $h in $t.hashTag');
	aql.push('group by $tag := $h with $h');
	aql.push('let $c := count($h) ');
	aql.push('order by $c desc ');
	aql.push('limit 50 ');
	aql.push('return { "tag": $tag, "count": $c};\n');
	return aql.join('\n');
}

/**
 * query tmp date set to get tweets @ param string query type
 * @parameters query parameters
 */
function buildTweetSample(type, parameters) {
	var aql = [];
	aql.push('for $t in dataset {0}'.format(TempDSName));

	if (type == "time") {
		aql.push('let $ts_start := datetime("{0}")'
				.format(parameters['startdt']));
		aql.push('let $ts_end := datetime("{0}")'.format(parameters['enddt']));
		aql
				.push('where $t.releaseDate >= $ts_start and $t.releaseDate < $ts_end');
	}

	aql.push('limit 10');
	aql.push('return $t;\n')
	return aql.join('\n');
}

// ============================= Query Functions
// =================================

/**
 * A wrapper function for query @ param string query type: {"submit", "zoom",
 * "time", "drag"}
 */
function queryWrapper(typeOrCode) {
	if (forRelationship) {
		APIqueryTracker = {
			"todo" : 'forRelationship',
			"securityCode" : typeOrCode,
			"tempDSName" : TempDSName
		}
		A._api(APIqueryTracker, drawRelationship, '/cloudberry');
	} else if (typeOrCode == 'industry') {
		var APIqueryTracker = {
			"todo" : 'industry',
			"industryName" : encodeURI(focusIndustry[1]),
			"tempDSName" : TempDSName
		};
		A._api(APIqueryTracker, drawMap, '/cloudberry');
	} else {
		mapQuery(typeOrCode);
	}
}

function mapQuery(type) {
	$("#aql").html('');
	var fuzzy = $("#keyword_checkbox")[0].checked;
	// build form data
	var kwterm = $("#keyword-textbox").val();
	if (kwterm.trim().length < 1) {
		alert("please provide at least one keyword")
		return;
	}
	var formData = {
		"keyword" : kwterm,
		"level" : logicLevel
	};
	// Set time
	if (type == "time") {
		formData.startdt = brush_start;
		formData.enddt = brush_end;
	} else {
		formData.startdt = initialStartDate;
		formData.enddt = initialEndDate;
	}
	// Get Map Bounds
	var bounds = map.getBounds();
	var swLat = Math.abs(bounds.getSouthWest().lat);
	var swLng = Math.abs(bounds.getSouthWest().lng);
	var neLat = Math.abs(bounds.getNorthEast().lat);
	var neLng = Math.abs(bounds.getNorthEast().lng);

	formData["swLat"] = Math.min(swLat, neLat);
	formData["swLng"] = Math.max(swLng, neLng);
	formData["neLat"] = Math.max(swLat, neLat);
	formData["neLng"] = Math.min(swLng, neLng);

	latlgts = [];
	latlgts.push(formData["neLng"]);
	latlgts.push(formData["swLat"]);
	latlgts.push(formData["swLng"]);
	latlgts.push(formData["neLat"]);

	APIqueryTracker = {
		"todo" : 'keyword',
		"focusProvince" : focusProvince[0],
		"provinceCode" : focusProvince[1],
		"fuzzy" : fuzzy,
		"keyword" : encodeURI(formData['keyword']),
		"bounds" : latlgts.join(','),
		"qtype" : type,
		"level" : formData['level'],
		"tempDSName" : TempDSName,
		"startdt" : formData['startdt'],
		"enddt" : formData['enddt']
	}
	A._api(APIqueryTracker, queryCallbackWrapper(type), '/cloudberry');
}

/**
 * query callback function
 * 
 * @param string
 *            query type
 */
function queryCallbackWrapper(type) {
	/**
	 * A spatial data cleaning and mapping call
	 * 
	 * @param {Object}
	 *            res, a result object from a tweetbook geospatial query
	 */
	return function queryCallback(res) {
		// First, we check if any results came back in.
		// If they didn't, return.
		console.timeEnd("query_aql_get_result");
		console.log(res)
		if (res.hasOwnProperty("responseText")) {
			reportUserMessage("Oops, no results found for those parameters.",
					false, "aql");
			return;
		}
		results = res;
		cache = results;
		// results = eval('(' + res.responseText + ')');
		if (results[0] && results[0].length > 0)
			drawMap(results[0]);
		// update time series
		if (results[1] && type != "time" && results[1].length > 0) {
			drawTimeSerialBrush(results[1]);
		}
		// update hashtag
		if (results[2] && results[2].length > 0) {
			drawHashtag(results[2]);
		}
		// update tweet table
		if (results[3] && results[3].length > 0) {
			drawTweets(results[3]);
		}
		if (results[4] && results[4].length > 0) {
			drawIndustries(results[4]);
		}
		if (results[5] && results[5].length > 0) {
			reportUserMessage(results[5][0], true, "aql");
		}
	}
}

// ============================= Draw Functions
// =================================

/**
 * Update map based on a set of spatial query result cells
 * 
 * @param [Array]
 *            mapPlotData, an array of coordinate and weight objects
 */
function drawMap(mapPlotData) {
	//if (!mapPlotData.length)
		//return;
	/** Clear anything currently on the map * */
	console.time("query_aql_draw");
	var maxWeight = 10;
	var minWeight = 0;

	// find max/min weight
	$.each(mapPlotData, function(i, data) {
		if (data.count) {
			maxWeight = Math.max(data.count, maxWeight);
			// minWeight = Math.min(data.count, minWeight);
		}
	});

	var range = maxWeight - minWeight;
	if (range < 0) {
		range = 0
		maxWeight = 0
		minWeight = 0
	}
	if (range < 10) {
		range = 10
	}

	/*
	 * colors = [ '#053061', '#4393c3', '#d1e5f0', '#fddbc7', '#d6604d',
	 * '#b2182b', '#67001f' ];
	 */
	colors = [ '#ffffff', '#ffff66', '#ffff66', '#ffff00', '#ff6600',
			'#ff3300', '#660000' ];
	mylevel = [ 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.7 ];
	// style function
	function getColor(d) {
		return d >= minWeight + range * mylevel[6] ? colors[6]
				: d >= minWeight + range * mylevel[5] ? colors[5]
						: d >= minWeight + range * mylevel[4] ? colors[4]
								: d >= minWeight + range * mylevel[3] ? colors[3]
										: d >= minWeight + range * mylevel[2] ? colors[2]
												: d >= minWeight + range
														* mylevel[1] ? colors[1]
														: d >= minWeight
																+ range
																* mylevel[0] ? colors[0]
																: colors[0];
	}

	function style(feature) {
		return {
			fillColor : getColor(feature.properties.count),
			weight : 2,
			opacity : 1,
			color : 'white',
			dashArray : '3',
			fillOpacity : 0.5
		};
	}

	// draw geojson polygons
	if (logicLevel == "province") {
		// transfer to geohash
		/*
		 * $.each(mapPlotData, function(m, data) { for ( var hash in state_hash) {
		 * if (state_hash.hasOwnProperty(hash)) { if (hash ==
		 * mapPlotData[m].cell) { var val = state_hash[hash];
		 * mapPlotData[m].cell = val; } } } });
		 */

		// update states count
		$.each(province.features,
				function(i, d) {
					d.properties.count = 0;
					for ( var m in mapPlotData) {
						if (mapPlotData[m].cell.keycode.substring(2, 4)
								+ '0000' == d.properties.code)
							d.properties.count += mapPlotData[m].count;
					}
				});

		// draw province polygons
		provincePolygons.setStyle(style);
	} else if (logicLevel == "city") {
		// update city's count
		$.each(city.features, function(i, d) {
			if (d.properties.count)
				d.properties.count = 0;
			for ( var m in mapPlotData) {
				if (mapPlotData[m].cell
						&& mapPlotData[m].cell.keyname == d.properties.name)
					d.properties.count = mapPlotData[m].count;
			}
		});

		// draw county polygons
		cityPolygons.setStyle(style);
	}
	// add legend
	if ($('.legend'))
		$('.legend').remove();

	var legend = L.control({
		position : 'topleft'
	});

	legend.onAdd = function(map) {
		var div = L.DomUtil.create('div', 'info legend'), grades = [ 0 ], labels = [];

		for (var i = 1; i < colors.length; i++) {
			var value = mylevel[i] * range + minWeight;
			if (value > grades[i - 1]) {
				grades.push(value);
			}
		}

		// loop through our density intervals and generate a label with a
		// colored square for each interval
		for (var i = 0; i < grades.length; i++) {
			div.innerHTML += '<i style="background:'
					+ getColor(grades[i])
					+ '"></i> '
					+ Math.floor(grades[i])
					+ (Math.floor(grades[i + 1]) ? '&ndash;'
							+ Math.floor(grades[i + 1]) + '<br>' : '+');
		}

		return div;
	};

	legend.addTo(map);

	console.timeEnd("query_aql_draw");
}

/**
 * draw relationship
 * 
 * @param res
 */
function drawRelationship(res) {
	console.timeEnd("query_aql_get_result");
	if (res.hasOwnProperty("responseText")) {
		reportUserMessage("Oops, no results found for those parameters.",
				false, "aql");
		return;
	}
	if (res.length) {
		newAMark(getCenter(res[0].codeA), res[0].fullNameA);
		$.each(res, function(i, re) {
			if (re) {
				var centerA = getCenter(re.codeA);
				var centerB = getCenter(re.codeB);
				var polyline = L.polyline([ centerA, centerB ], {
					color : 'red',
					weight : 1
				});
				polyline.relationship = re;
				map.addLayer(polyline);
				polyline.bringToFront();
				linesCache.push(polyline);
				var markercontent = [];
				markercontent.push(re.fullNameB);
				markercontent.push('<br/>关系：');
				markercontent.push('共同雇员')
				markercontent.push('-');
				markercontent.push(re.pname);
				if (re.pedu.length) {
					markercontent.push('(');
					markercontent.push(re.pedu);
					markercontent.push(')');
				}
				newAMark(centerB, markercontent.join(''));
				// map.fitBounds(polyline.getBounds());
			}
		});
	}
	console.timeEnd("draw_relationships_finished");
}

function newAMark(centerlatlng, markcontent) {
	var marker = L.marker(centerlatlng, {
		title : markcontent
	});
	marker.bindPopup(L.popup().setContent('<p>' + markcontent + '</p>'), {
		closeOnClick : true,
		closeButton : true
	});
	marker.on("click", function() {
		this.openPopup();
	});
	marker.addTo(map);
	linesCache.push(marker);
}

function getCenter(bounds) {
	// var As = str.replace('rectangle("', '').replace('")', '').replace(',', '
	// ')
	// .replace(',', ' ').split(' ')
	var southWestA = L.latLng(bounds[1][1], bounds[1][0]), northEastA = L
			.latLng(bounds[0][1], bounds[0][0]), boundsA = L.latLngBounds(
			southWestA, northEastA);
	return boundsA.getCenter();
}

/**
 * draw timeseris @ param {object} time series query results
 */
function drawTimeSerialBrush(slice_count) {
	$("#time-series").html("");
	var margin = {
		top : 10,
		right : 10,
		bottom : 30,
		left : 50
	}, width = 962 - margin.left - margin.right, height = 150 - margin.top
			- margin.bottom;

	timeSeries = dc.lineChart("#time-series");
	timeBrush = timeSeries.brush();

	timeBrush.on('brushend', function(e) {
		var extent = timeBrush.extent();
		brush_start = toAQLDateTime(extent[0]);
		brush_end = toAQLDateTime(extent[1]);
		queryWrapper('time');
	});

	var parseDate = d3.time.format("%Y-%m").parse;

	slice_count.forEach(function(d) {
		d.slice = parseDate(d.slice);
		d.count = +d.count;
	});
	var ndx = crossfilter(slice_count);
	var timeDimension = ndx.dimension(function(d) {
		if (d.slice != null)
			return d.slice;
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
 * draw hashtag @ param {object} hashtag query results
 */
function drawHashtag(tag_count) {
	$('#hashcount tr').html('');
	$.each(tag_count, function(i, d) {
		$('#hashcount tr:last').after(
				'<tr><td>' + "#" + d.tag + '<br/>' + d.count + '</td></tr>');
	});
}

/**
 * draw tweet list @ param {object} tweets query results
 * @param message
 */
function drawTweets(message) {
	$('#tweet').html('');
	$('#tweet').append(
			'<table class="table"><thead></thead><tbody></tbody></table>');
	$.each(message, function(i, d) {
		$('#tweet table thead').append(
				'<tr><td data-toggle="popover"  data-container="body">'
						+ d.fullName + '</td></tr>');
	});
	$("#tweet table").trigger('create');

	$('[data-toggle="popover"]').each(function() {
		var element = $(this);
		var id = element.attr('id');
		var txt = element.html();
		element.popover({
			trigger : 'manual',
			placement : 'left', // top, bottom, left or right
			title : txt,
			html : 'true',
			content : ContentMethod(txt),
		}).on("mouseenter", function() {
			var _this = this;
			$(this).popover("show");
			$('.popover').css('max-width', '1000px');

			$("body").children(".popover").on("mouseleave", function() {
				$(_this).popover('hide');
			});
			$('.popover').each(function() {
				var mark = $(_this).html();
				var __this = this;
				var current = $(__this).children('.popover-title').html();
				if (mark != current) {
					var tempSelector = '#tweet td:contains(' + current + ')';
					$(tempSelector).popover('hide');
				}
			});

		}).on("mouseleave", function() {
			var _this = this;
		}).on("click", function() {
			var mark = $(this).html();
			var selectItem = $.grep(cache[3], function(value) {
				return value.fullName == mark;
			});
			if (selectItem[0].securityCode) {
				forRelationship = true;
				// map.removeLayer(provincePolygons);
				// map.removeLayer(cityPolygons);
				linesCache.forEach(function(e) {
					map.removeLayer(e);
				});
				linesCache = []
				queryWrapper(selectItem[0].securityCode);
			}
		});
	});

	function ContentMethod(txt) {
		var selectItem = $.grep(cache[3], function(value) {
			return value.fullName == txt;
		});
		return '<table class="table table-bordered"><tr><td>股票代码</td><td>'
				+ selectItem[0].securityCode + '</td><tr><td>所属概念</td><td>'
				+ selectItem[0].hashTag + '</td><tr><td>所属行业</td><td>'
				+ selectItem[0].industry + '</td><tr><td>公司网址</td><td>'
				// + selectItem[0].compintro + '</td><tr><td>公司网址</td><td>'
				+ selectItem[0].url + '</td></table>';

	}
}

/**
 * draw tweet table @ param {object} tweets query results
 */
function drawTweetsDetails(message) {
	$('#tweet').html('<ol>');
	$.each(message, function(i, d) {
		var mytable = [];
		mytable.push('<table border="1">');
		for ( var p in d) {
			if (typeof (d[p] != "function")) {
				mytable.push('<tr><td>');
				mytable.push(p);
				mytable.push('</td><td>');
				mytable.push(d[p]);
				mytable.push('</td></tr>');
			}
		}
		mytable.push('</table><hr>');
		$('#tweet').append(mytable.join(''));
	});
	$('#tweet').append('</ol>');
}

/**
 * draw industry list
 * 
 * @param industry_count
 */
function drawIndustries(industry_count) {
	$('#industrycount tr').html('');
	$.each(industry_count, function(i, d) {
		$('#industrycount tr:last').after(
				'<tr class="industry"><td>' + "#" + d.industry + '#<br/>'
						+ d.count + '</td></tr>');
	});
	$('.industry').each(function() {
		$(this).on("click", function() {
			focusIndustry = [ true, $(this).html().split("#")[1] ];
			queryWrapper("industry");
		})
	});
}

// ============================= Utility Functions
// =================================

/**
 * Creates a message and attaches it to data management area.
 * 
 * @param {String}
 *            message, a message to post
 * @param {Boolean}
 *            isPositiveMessage, whether or not this is a positive message.
 * @param {String}
 *            target, the target div to attach this message.
 */
function reportUserMessage(message, isPositiveMessage, target) {
	// Clear out any existing messages
	$('#' + target).html('');

	message = message.replace(/\r\n?|\n/g, '<br />');
	// Select appropriate alert-type
	var alertType = "alert-success";
	if (!isPositiveMessage) {
		alertType = "alert-danger";
	}

	// Append the appropriate message
	$('<div/>').attr("class", "alert " + alertType).html(
			'<button type="button" class="close" data-dismiss="alert">&times;</button>'
					+ message).appendTo('#' + target);
}