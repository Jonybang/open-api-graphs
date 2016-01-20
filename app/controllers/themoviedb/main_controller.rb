class Themoviedb::MainController < ApplicationController
  require 'oag_helpers'
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :set_api_key

  def index
  end

  def director_search
    @search = Tmdb::Search.new
    @search.resource('person') # determines type of resource
    @search.query(params['name']) # the query to search against
    search_result = @search.fetch

    @director = {id: search_result[0]['id'], name: search_result[0]['name'] }
    @director_credits = Tmdb::Person.credits(@director[:id])

    @actors = {}
    @films = []
    @director_credits['crew'].each do |film|
      next if film['job'] != 'Director' || !film['title']

      new_film = OAGHelpers.filter_fields(film, %w(id title poster_path release_date media_type))
      new_film['actors'] = Tmdb::Movie.credits(film['id'])['cast']

      next unless new_film['actors']
      @films.push new_film

      new_film['actors'].each {|actor| @actors[actor['id']] = @actors[actor['id']] ? @actors[actor['id']] + 1 : 1}
    end

    @films.each do |film|
      filtering_actors = []

      film['actors'].each do  |actor|
        filtering_actors.push(OAGHelpers.filter_fields(actor, %w(id name character profile_path))) if @actors[actor['id']] > 2
      end
      film['actors'] = filtering_actors
    end

    @results = @films

    #render action: 'index'
    render json: @results
  end

  def set_api_key
    Tmdb::Api.key(ENV['Tmdb_api_key'])
  end
end
