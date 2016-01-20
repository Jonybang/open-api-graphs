//= require d3
//= require d3-graphs/spider

var ready = function() {
    $('#search_director_form').submit(function() {
        $('#loading').show();
        $(this).ajaxSubmit(function(data) {
            initFilmsSpider(data);
            $('#loading').hide();
        }, function(){
            console.log('error');
        });
        return false;
    });
};

$(document).ready(ready);
$(document).on('page:load', ready);

var initFilmsSpider = function (films) {
    var already_added_actors = [];
    var objects = [];
    var links = [];
    films.forEach(function(film){
        film.type = 'film';
        objects.push(film);
        var film_index = objects.length - 1;

        if(film.actors){
            film.actors.forEach(function(actor){
                if(!already_added_actors[actor.id]){
                    actor.type = 'actor';
                    objects.push(actor);
                    actor.index = objects.length - 1;

                    already_added_actors[actor.id] = actor;
                }
                links.push({source: already_added_actors[actor.id].index, target: film_index})
            })
        }
    });

    var filmsSpider = new Spider();
    $.extend(filmsSpider.config, {
        container: '#graph',
        output: {
            image: function(d) { return 'https://image.tmdb.org/t/p/w185' + (d.poster_path ? d.poster_path : d.profile_path);},
            title: function(d) { return d.title ? d.title : d.name; },
            id: function(d) { return d.id; }
        }
    });
    $.extend(filmsSpider.graph, {
        nodes: objects,
        links: links
    });
    filmsSpider.initGraphic();
};