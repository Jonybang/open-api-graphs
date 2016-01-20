role :app, %w{deploy@jonybang.ru}
role :web, %w{deploy@jonybang.ru}
role :db,  %w{deploy@jonybang.ru}

# Extended Server Syntax
# ======================
# This can be used to drop a more detailed server
# definition into the server list. The second argument
# something that quacks like a hash can be used to set
# extended properties on the server.
server 'jonybang.ru', user: 'deploy', roles: %w{web app}, my_property: :my_value
