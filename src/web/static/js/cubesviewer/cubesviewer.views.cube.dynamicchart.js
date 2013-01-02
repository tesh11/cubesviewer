/*
 * CubesViewer
 * Copyright (c) 2012-2013 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Sof	tware, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Series Sunburst object. Contains view functions for the 'sunburst' mode.
 * This is an optional component, part of the cube view. Depends on the series mode.
 */
function cubesviewerViewCubeDynamicChart() {

	this.cubesviewer = cubesviewer; 
	
	/*
	 * Prepares the view. 
	 */
	this.onViewCreate = function(event, view) {

		$.extend(view.params, {
			//"dynamiccharttype" : "sunburst",
		});
		
	};	
	
	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		
		if (view.cube == null) return;
		
		// Dynammic Chart Mode button
		$(view.container).find('.cv-view-toolbar').find(".cv-view-button-chart").css("margin-right", "5px");
		$(view.container).find('.cv-view-toolbar').find(".cv-view-button-chart").after(
			'<button class="cv-view-button-dynamicchart" title="Dynamic Chart" style="margin-right: 15px;"><span class="ui-icon ui-icon-calculator"></span></button>'
		);
		
		// Buttonize and event
		$(view.container).find('.cv-view-button-dynamicchart').button();
		$(view.container).find('.cv-view-button-dynamicchart').click(function() { 
			view.cubesviewer.views.cube.dynamicchart.modeDynamicChart(view);
			return false;
		});	
		$(view.container).find('.cv-view-button-dynamicchart').mouseenter(function() {
			$('.cv-view-menu').hide();
		});		
		
		if (view.params.mode != "dynamicchart") return;
		
		$(view.container).find('.cv-view-viewdata').append('<h3>Dynamic Chart</h3>');
		
		// Draw areas
		view.cubesviewer.views.cube.dynamicchart.drawInfo(view);
		
		// Remove horizontal dimension info
		$(".cv-view-series-horizontal-info", $(view.container)).parents('.infopiece').remove();

		// Highlight
		$(view.container).find('.cv-view-button-dynamicchart').button("option", "disabled", "true").addClass('ui-state-active');
		
		// Explore menu
		view.cubesviewer.views.cube.dynamicchart.drawChartMenu(view);
		
		// Load data
		view.cubesviewer.views.cube.dynamicchart.loadData(view);
		
	};	

	/*
	 * Updates view options menus.
	 */
	this.drawChartMenu = function (view) {
		
		this.cubesviewer.views.cube.series.drawSeriesMenu(view);
		
		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;
		
		// Remove horizontal dimension menu
		$(".cv-view-series-horizontal-menu", $(view.container)).remove();
		
		menu.append('<div></div>');
		
	};

	/*
	 * Change to chart mode.
	 */ 
	this.modeDynamicChart = function(view) {
		view.params.mode = "dynamicchart";
		view.cubesviewer.views.redrawView(view);
	};	
	
	/*
	 * Draws information.
	 * First calls drawInfo in series table in order to draw slice info and container. 
	 */
	this.drawInfo = function(view) {
		view.cubesviewer.views.cube.series.drawInfo(view);
	};
	
	/*
	 * Load and draw current data
	 */ 
	this.loadData = function(view) {

		// Check if we can produce a table
		if (view.params.yaxis == null) {
			$('#' + view.id).find('.cv-view-viewdata').empty().append(
					'<h3>Series Chart</h3><div><i>Cannot present dynamic chart: no <b>measure</b> has been selected.</i></div>'
			);
			return;
		} 
		
		// Build params (do not include xaxis)
		var params = this.cubesviewer.views.cube.buildQueryParams(view, false, false);
		
		$('#' + view.id).find('.cv-view-viewdata').empty().append('<h3>Dynamic Chart</h3><img src="' + view.cubesviewer.options.ajaxLoaderUrl + '" title="Loading..." /> Loading');
		
		$.get(view.cubesviewer.options.cubesUrl + "/cube/" + view.cube.name + "/aggregate", params, 
				view.cubesviewer.views.cube.dynamicchart._loadDataCallback(view), "json");
		
	};
	
	this._loadDataCallback = function(view) {

		var view = view;
		
		return function (data, status) {
			$(view.container).find('.cv-view-viewdata').empty();
			view.cubesviewer.views.cube.dynamicchart.drawChart(view, data);
		};
		
	};	
	
	/**
	 * Draws Series Chart.
	 */
	this.drawChart = function(view, data) {
		
		$(view.container).find('.cv-view-viewdata').empty();
		
		if (data.cells.length == 0) {
			$(view.container).find('.cv-view-viewdata').empty().append(
				'<h3>Dynamic Chart</h3>' +
				'<div>Cannot present chart as no data is returned by the current filtering and drilldown combination.</div>'
			);
			return;
		}
		
		$(view.container).find('.cv-view-viewdata').css("width", "95%");
		$(view.container).find('.cv-view-viewdata').append(
			'<h3>Dynamic Chart</h3>' +
			'<div id="dynamicChart-' + view.id + '" style="height: 440px; width: 440px; margin: auto; "></div>'
		);
		
		// Process and draw cells
		view.cubesviewer.views.cube.explore._sortData (view, data.cells, view.params.xaxis != null ? true : false);
		var json = view.cubesviewer.views.cube.dynamicchart.prepareDrilldownTree (view, data);
		view.cubesviewer.views.cube.dynamicchart.draw3DJSSunburst (view, json);
		
	};
	
	/*
	 * Prepares drilldowndata
	 */
	this.prepareDrilldownTree = function (view, data) {
		
		var json =  [{
			children: [],
			name: "Current Slice",
		}];
				
		var current = null;
		
		$(data.cells).each(function (idx, e) {
			
			current = json[0];
			
			// For the horizontal axis drilldown level, if present
			for (var i = 0; i < view.params.drilldown.length; i++) {

				// Get dimension
				var parts = cubesviewer.model.getDimensionParts(view.params.drilldown[i]);
				var infos = parts.hierarchy.readCell(e);
				
				$(infos).each(function(idx, info) {
					var child = $.grep(current.children, function(ed) { return ed.name == info.key; });
					if (child.length > 0) {
						current = child[0];
					} else {
						child = {
							children: [],
							name: info.key,
							//color: "#aabbcc" ,
						};
						current.children.push(child);
						current = child;
					}
				});	
				
			}
			
			current.measure = (e[view.params.yaxis]);
			
		});


		return json[0].children;
		
	};	
	
    	

	this.draw3DJSSunburst = function(view, json) {
		
		var json = json;
		
		var width = 420;
		var height = width;
		var radius = width / 2;
		var varx = d3.scale.linear().range([ 0.0 * Math.PI, 2.0 * Math.PI ]);
		var vary = d3.scale.pow().exponent(1.3).domain([ 0, 1 ]).range([ 0, radius]);
		var varp = 5;
		var duration = 1000;
		
		var container = $('#dynamicChart-' + view.id).get(0);
		
		var lastD = null;
		
		function isParentOf(p, c) {
	        if (p === c)
	            return true;
	        if ((p.children) && (p.children.length > 0)) {
	            return p.children.some(function(d) {
	                return isParentOf(d, c);
	            });
	        }
	        return false;
	    }

		function randColor() {
			var rgb = new Array();
			for (var i = 0; i < 3; i++) {
				var color = Math.round(Math.random() * 255);
				rgb.push(color);
			}
			return("rgb(" + rgb.join() + ")");
		};
		
	    function colour(d) {
	    	
	    	//return d3.scale.category10();
	    	
	    	/*
	        if ((d.children) && (d.children.length > 0)) {
	            if (d.children.length > 1) {
		        	// There is a maximum of two children!
		            var colours = d.children.map(colour), a = d3.hsl(colours[0]), b = d3
		                    .hsl(colours[1]);
		            // L*a*b* might be better here...
		            return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
	            } else {
	            	var colours = d.children.map(colour), a = d3.hsl(colours[0]), b = d3
                    .hsl(colours[0]);
	            }
	        }
	        */
	        
	    	//return d.color || "#fff";
	    	
	    	if (d.y != 0) {
	    		d.color = colour(d.parent);
	    	} else {
	    		d.color = randColor();
	    	}
	    	return d.color;
	    	
	    }

	    // Interpolate the scales!
	    function arcTween(d) {
	        var my = maxY(d), 
	            xd = d3.interpolate(varx.domain(), [ d.x, d.x + d.dx ]), 
	            yd = d3.interpolate(vary.domain(), [ d.y, my ]), 
	            yr = d3.interpolate(vary.range(), [ d.y ? 20 : 0, radius]);
	        return function(d) {
	            return function(t) {
	                varx.domain(xd(t));
	                vary.domain(yd(t)).range(yr(t));
	                return arc(d);
	            };
	        };
	    }

	    function maxY(d) {
	    	return 1;
	    	//return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
	    }

	    //http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
	    function brightness(rgb) {
	        return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
	    }

	    var div = d3.select('#dynamicChart-' + view.id);

	    var vis = div.append("svg").attr("width", width + varp * 2).attr("height",
	            height + varp * 2).append("g").attr("transform",
	            "translate(" + (radius + varp) + "," + (radius + varp) + ")");

	    var partition = d3.layout.partition().sort(null).value(function(d) {
	        return d.measure;
	    });

	    arc = d3.svg.arc().startAngle(function(d) {
	        return Math.max(0, Math.min(2 * Math.PI, varx(d.x)));
	    }).endAngle(function(d) {
	        return Math.max(0, Math.min(2 * Math.PI, varx(d.x + d.dx)));
	    }).innerRadius(function(d) {
	        return Math.max(0, d.y ? vary(d.y) : d.y);
	    }).outerRadius(function(d) {
	        return Math.max(0, vary(d.y + d.dy));
	    });

       var nodes = partition.nodes({
           children : json
       });

       var path = vis.selectAll("path").data(nodes);
       
       path.enter().append("path").attr("id", function(d, i) {
           return "path-" + i;
       }).attr("d", arc).attr("fill-rule", "evenodd").style(
               "fill", colour).on("click", click)
       .each(function(d, i) {
    	   var el = this; 
    	   $(el).hover(function() {
    		   d3.select(el)
    		      //.style("fill", "#ccccff")
    		      .style('stroke', '#ffffff')
    		      .style('stroke-width', '2')
    		      .style('stroke-opacity', '1');
    		   $(el).insertBefore($('text').first());
    	   }, function() {
    		   d3.select(el)
	    		   .style('stroke', '#000000')
	               .style('stroke-width', '0')
	               .style('stroke-opacity', '0');
    	   });
       });
       
       
       lastD = nodes[0];

       var text = vis.selectAll("text").data(nodes);
       var textEnter = text
               .enter()
               .append("text")
               .style("fill-opacity", 1)
               .style(
                       "fill",
                       function(d) {
                           return brightness(d3.rgb(colour(d))) < 125 ? "#eee"
                                   : "#000";
                       })
               .attr(
                       "text-anchor",
                       function(d) {
                           return varx(d.x + d.dx / 2) > Math.PI ? "end"
                                   : "start";
                       })
               .attr("dy", ".2em")
               .attr(
                       "transform",
                       function(d) {
                           var multiline = (d.name || "")
                                   .split(" ").length > 1, angle = varx(d.x
                                   + d.dx / 2)
                                   * 180 / Math.PI - 90, rotate = angle
                                   + (multiline ? -.5 : 0);
                           return "rotate(" + rotate
                                   + ")translate("
                                   + (vary(d.y) + varp) + ")rotate("
                                   + (angle > 90 ? -180 : 0)
                                   + ")";
                       }).on("click", click);
       textEnter.append("tspan").attr("x", 0).text(
               function(d) {
                   return d.depth ? d.name.split(" ")[0] : "";
               });
       textEnter
               .append("tspan")
               .attr("x", 0)
               .attr("dy", "1em")
               .text(
                       function(d) {
                           return d.depth ? d.name.split(" ")[1]
                                   || ""
                                   : "";
                       });

       /*
       d3.select("#graphBlocks").on("click", function() {
           graphBlocks();
           return false;
       });
       d3.select("#graphSize").on("click", function() {
           graphSize();
           return false;
       });
       */
       
       function updateText(d) {
    	   // Note the example hacked this as they rely on arcTween updating the scales.
           text 
                   .style(
                           "visibility",
                           function(e) {
                               var show = ( Math.abs(varx(e.x + e.dx ) - varx(e.x) ) > Math.PI / 48 );
                               return show ? null  : "hidden";
                               //return isParentOf(d, e) ? null  : d3.select(this).style("visibility");
                           }) 
                   .transition()
                   .duration(duration)
                   .attrTween(
                           "text-anchor",
                           function(d) {
                               return function() {
                                   return varx(d.x + d.dx / 2) > Math.PI ? "end"
                                           : "start";
                               };
                           })
                   .attrTween(
                           "transform",
                           function(d) {
                               var multiline = (d.name || "")
                                       .split(" ").length > 1;
                               return function() {
                                   var angle = varx(d.x + d.dx
                                           / 2)
                                           * 180
                                           / Math.PI
                                           - 90, rotate = angle
                                           + (multiline ? -.5
                                                   : 0);
                                   return "rotate("
                                           + rotate
                                           + ")translate("
                                           + (vary(d.y) + varp)
                                           + ")rotate("
                                           + (angle > 90 ? -180
                                                   : 0) + ")";
                               };
                           }).style(
                           "fill-opacity",
                           function(e) {
                               return isParentOf(d, e) ? 1
                                       : 1e-6;
                           }).each(
                           "end",
                           function(e) {
                               
                        	   var show = ( Math.abs(varx(e.x + e.dx ) - varx(e.x) ) > Math.PI / 48 );
                        	   d3.select(this).style("visibility", show ? null  : "hidden");
                        	   //d3.select(this).style("visibility", && isParentOf(d, e)  ? null  : "hidden");
                           });
           }
       
       function click(d) {
    	   
    	   lastD = d;
    	   
           path.transition().duration(duration).attrTween("d", arcTween(d));

           updateText(d);
       }
		
	}

	
	
	
};


/*
 * Create object.
 */
cubesviewer.views.cube.dynamicchart = new cubesviewerViewCubeDynamicChart();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.dynamicchart.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.dynamicchart.onViewDraw);
