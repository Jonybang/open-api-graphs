var Spider = function () {
    var self = this;
};
Spider.prototype = {
    config: {
        container: "body .content",
        dynamicAdd: false,
        circle: {
            size: 80
        },
        output: {
            image: function(d) { return d.photo_100;},
            title: function(d) { return d.first_name + ' ' + d.last_name; },
            id: function(d) { return d.id; }
        },
        force: {
            linkDistance: 300, //500
            charge: -220, //-120
            gravity: .001, //.05
            friction: 0.3, //0.6
            linkStrength: 0.2 //0.1
        },
        behavior: {
            dblClickCircleRadius: 150 //100
        }
    },
    graphic: { patterns: [], node: [], link: []},
    graph: { nodes: [], links: [], activeNodes: []},
    initGraphic: function (){
        var self = this;
        var graphic = this.graphic;
        var graph = this.graph;
        var config = this.config;

        var color = d3.scale.category20(config.container);

        graphic.width = $(config.container).width();
        graphic.height = $(config.container).height();

        graphic.svg = d3.select(config.container).append("svg")
            .attr("width", graphic.width)
            .attr("height", graphic.height)
            .append('g');

        graphic.node = graphic.svg.selectAll(".node");
        graphic.link = graphic.svg.selectAll(".link");

        //Контейнер для всех изображений
        graphic.images = graphic.svg
            .append('defs')
            .selectAll('.user-image');

        this.force = d3.layout.force()
            .linkDistance(config.force.linkDistance)
            .linkStrength(config.force.linkStrength)
            .charge(config.force.charge)
            .gravity(config.force.gravity)
            .friction(config.force.friction)
            //.alpha(0.01)
            //.theta(0.1)
            //.chargeDistance((graphic.width > graphic.height ? graphic.height : graphic.width)-200)
            //.distance(500)
            .size([graphic.width-200, graphic.height-200]);

        this.force
            .nodes(graph.nodes)
            .links(graph.links);

        this.force.on("tick", function(e){
            self.graphTick(e);
        });

        graphic.node_drag = this.initDrag();

        if(graph.nodes.length && graph.links.length){
            graph.nodes.forEach(function(node){
                node.dest = self.helpers.randomCoords(graphic);
                console.log('dest', node.dest);
            });
            this.linksBinding();
            this.renderNodes();
            this.renderLinks();
        }
    },
    initDrag: function (){
        var self = this;
        var force = this.force;
        var graph = this.graph;
        var config = this.config;

        function dragstart(d, i) {
            force.stop(); // stops the force auto positioning before you start dragging
            graph.currentIndex = i;
            graph.currentNode = d;

            graph.activeNodes = graph.links.map(function(link){
                var source = link.source.index, target = link.target.index;

                if(source != i && target == i && graph.activeNodes.indexOf(graph.nodes[source]) == -1)
                    return source;

                if(target != i && source == i && graph.activeNodes.indexOf(graph.nodes[target]) == -1)
                    return target;

                return false;
            }).filter(Boolean);
            graph.activeNodes.push(i);
        }
        function dragmove(d, i) {
            d.px += d3.event.dx;
            d.py += d3.event.dy;
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            self.graphTick(); // this is the key to make it work together with updating both px,py,x,y on d !
        }
        function dragend(d, i) {
            d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
            self.graphTick();
            force.resume();
        }
        return d3.behavior.drag()
            .on("dragstart", dragstart)
            .on("drag", dragmove)
            .on("dragend", dragend);
    },
    pushNodesToDestination: function(e){
        var graph = this.graph;

        if(!e)
            return;

        var k = 6 * e.alpha;

        // Push nodes toward their designated focus.
        graph.nodes.forEach(function(o, i) {
            var y = o.y + (o.dest.y - o.y) * k,
                x = o.x + (o.dest.x - o.x) * k;

            o.dest.x_end = Math.abs(x - o.x) < 1 || o.dest.x_end;
            o.dest.y_end = Math.abs(y - o.y) < 1 || o.dest.y_end;

            if(!o.dest.x_end)
                o.x = x;
            if(!o.dest.y_end)
                o.y = y;
        });
    },
    moveNodes: function(){
        var graphic = this.graphic;
        var graph = this.graph;
        var config = this.config;

        graphic.node
            .attr("cx", function(d) {
                return d.x;
            })
            .attr("cy", function(d) {
                return d.y;
            });

        if(graphic.images.length) {
            graphic.images.attr("x", function (d) {
                return d.x + config.circle.size / 2;
            })
                .attr("y", function (d) {
                    return d.y + config.circle.size / 2;
                });
        }
    },
    keepLinkNodes: function(){
        var graphic = this.graphic;
        var graph = this.graph;

        if(!graphic.link)
            return;

        graphic.link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .classed('active', function(d){
                return d.source.index == graph.currentIndex || d.target.index == graph.currentIndex;
            });

        graphic.node
            .classed('active', function(d, i){
                return graph.activeNodes.indexOf(i) != -1;
            });
    },
    graphTick: function (e){
        this.keepLinkNodes();

        this.pushNodesToDestination(e);

        this.moveNodes(e);
    },
    linksBinding: function(){
        var graph = this.graph;
        graph.links.forEach(function(d) {
            if (typeof d.source == "number") {
                d.source = graph.nodes[d.source] || d.source;
            }
            if (typeof d.target == "number") {
                d.target = graph.nodes[d.target] || d.target;
            }
        });
    },
    renderNodes: function(){
        var self = this;
        var graphic = this.graphic;
        var graph = this.graph;
        var config = this.config;
        var force = this.force;

        force.start();

        //Контейнеры для изображений
        graphic.images = graphic.images.data(graph.nodes);

        var pattern =  graphic.images
            .enter().append("pattern")
            .attr('class', 'user-image')
            .attr('id', config.output.id)
            .attr('height', config.circle.size).attr('width', config.circle.size)
            .attr('x', 0).attr('y', 0)
            .attr('patternUnits', "userSpaceOnUse");

        //Изображения в контейнеры
        pattern
            .append("image")
            .attr('height', config.circle.size).attr('width', config.circle.size)
            .attr('x', 0).attr('y', 0)
            .attr('xlink:href', config.output.image);

        //Круги
        graphic.node = graphic.node.data(graph.nodes);

        var circle = graphic.node
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", config.circle.size/2)
            //привязывание изображения к кругу
            .attr("fill", function(d) { return 'url(#' + config.output.id(d) + ')' });

        //привязывание евентов
        graphic.node
            .call(graphic.node_drag).
            on('dblclick', function(d, i){
                self.nodeDoubleClick(d, i);
            });

        //Вставка подписей
        graphic.node
            .append("title")
            .text(config.output.title);
    },
    renderLinks: function(){
        var graphic = this.graphic;
        var graph = this.graph;
        var force = this.force;

        force.start();

        //Связи
        graphic.link = graphic.link.data(graph.links);

        graphic.link
            .enter().insert("line",":first-child")//.append("line")
            .attr("class", "link");
        //.style("stroke-width", function(d) { return Math.sqrt(d.value); });
    },
    addNodeAndLink: function (node, link){
        this.linksBinding();
        this.addNode(node);
        this.addLink(link);
    },
    addNode: function (node, isFirst){
        var graphic = this.graphic;
        var graph = this.graph;
        var config = this.config;
        var force = this.force;

        node.dest = this.helpers.randomCoords(graphic);

        graph.nodes.push(node);

        if(config.dynamicAdd)
            this.renderNodes();
    },
    addLink: function (link){
        var graphic = this.graphic;
        var graph = this.graph;
        var config = this.config;
        var force = this.force;

        if(!graphic.node[0][link.source] || !graphic.node[0][link.target]){
            setTimeout(function(){this.addLink(link)}, 1001);
            return;
        }

        graph.links.push(link);

        if(config.dynamicAdd)
            this.renderLinks();
    },
    nodeDoubleClick: function (d, i) {
        var self = this;
        var force = this.force;
        var graph = this.graph;
        var graphic = this.graphic;
        var config = this.config;

        var activeNodesCount = graph.activeNodes.length - 1;

        var x_center = graph.currentNode.x, y_center = graph.currentNode.y;
        var _i = 0;
        graphic.node
            .attr('cx', function(d){
                if(i != graph.currentIndex && graph.activeNodes.indexOf(i) != -1){
                    d.x = x_center;
                }
                return d.x;
            })
            .attr('cy', function(d){
                if(i != graph.currentIndex && graph.activeNodes.indexOf(i) != -1){
                    d.y = y_center;
                }
                return d.y;
            })
            .attr("transform", function(d, i) {
                if(i == graph.currentIndex || graph.activeNodes.indexOf(i) == -1)
                    return '';
                else{
                    _i++;
                    //d.fixed = true;
                    return "rotate(" + (360 * _i / activeNodesCount)  + " " + x_center + " " + y_center + ")"
                        + "translate(" + config.behavior.dblClickCircleRadius +")";
                }
            });

    },

    helpers:{
        randomCoords: function(containerSize){
            function getRandom(min, max) {
                return Math.random() * (max - min) + min;
            }

            return {x: getRandom(0, containerSize.width), y: getRandom(0, containerSize.height)};
        }
    },

    finishFriendsLoading: function (){
        //возможно понадобится
    }
};