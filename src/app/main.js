/**
 * This file is the application's main JavaScript file. It is listed as a dependency in run.js and will automatically
 * load when run.js loads.
 *
 * Because this file has the special filename `main.js`, and because we've registered the `app` package in run.js,
 * whatever object this module returns can be loaded by other files simply by requiring `app` (instead of `app/main`).
 *
 * Our first dependency is to the `dojo/has` module, which allows us to conditionally execute code based on
 * configuration settings or environmental information. Unlike a normal conditional, these branches can be compiled
 * away by the build system; see `staticHasFeatures` in app.profile.js for more information.
 *
 * Our second dependency is to the special module `require`; this allows us to make additional require calls using
 * module IDs relative to this module within the body of the define callback.
 *
 * In all cases, whatever function is passed to define() is only invoked once, and the returned value is cached.
 *
 * More information about everything described about the loader throughout this file can be found at
 * <http://dojotoolkit.org/reference-guide/loader/amd.html>.
 */
define([ 'dojo/has', 'require' ], function (has, require) {
	var app = {};

	/**
	 * This main.js file conditionally executes different code depending upon the host environment it is loaded in.
	 * This is an increasingly common pattern when dealing with applications that run in different environments that
	 * require different functionality (i.e. client/server or desktop/tablet/phone).
	 */
	if (has('host-browser')) {
		/*
		 * This require call's first dependency, `./Dialog`, uses a relative module identifier; you should use this
		 * type of notation for dependencies *within* a package in order to ensure the package is fully portable. It
		 * works like a path, where `./` refers to the current directory and `../` refers to the parent directory. If
		 * you are referring to a module in a *different* package (like `dojo` or `dijit`), you should *not* use a
		 * relative module identifier.
		 *
		 * The second dependency is a plugin dependency; in this case, it is a dependency on the special functionality
		 * of the `dojo/domReady` plugin, which simply waits until the DOM is ready before resolving.
		 * The `!` after the module name indicates you want to use special plugin functionality; if you were to
		 * require just `dojo/domReady`, it would load that module just like any other module, without the special
		 * plugin functionality.
		 */
		require([ 
			'dojo/parser', 
			'dojo/_base/json',
			'dojo/_base/array',
			'dojo/_base/lang',
			'dojo/dom-construct',
			'dojo/on',
			'dojo/dom',
			'dojox/grid/DataGrid', 
			'dojo/data/ItemFileWriteStore',
			'dojo/Deferred',
			'dojo/promise/all',
			'dojo/_base/config',
			'dojo/dom-style',
			'dijit/registry',
			'dojo/domReady!'
		], 
			function (parser, json, array, lang, construct, on, dom, DataGrid, ItemFileWriteStore, Deferred, all, config, style, registry) {

			parser.parse();



			 /*set up data store*/
				var data = {
				  identifier: "id",
				  items: []
				};

				var store = new ItemFileWriteStore({data: data});

				/*set up layout*/
				var layout = [[
				  {'name': 'Name', 'field': 'name', 'width': '100px'},
				  {'name': 'Comment', 'field': 'message', 'width': '300px'},
				  {'name': 'Delete', 'field': 'delete', 'width': '100px',
					formatter: function (val) {
                         var a = construct.create('a',
                                {
                                    href: '#',
                                    innerHTML: "delete",
                                    title: "Delete comment"
                                },
                                construct.create('span'));
						
//						 on(a, 'click', lang.partial(function(){alert();}));

                         return a.parentNode.innerHTML;
                     },
                     get: function (rowIdx, row) {
                         return row;
                     }
				}
				]];

				/*create a new grid*/
				var grid = new DataGrid({
					id: 'grid',
					structure: layout,
					store: store,
					selectionMode: 'extended',
					rowSelector: '20px'});

				/*append the new grid to the div*/
				grid.placeAt("gridDiv");

				/*Call startup() to render the grid*/
				grid.startup();

				on(grid, 'rowClick', function(e){
					console.log(e.cell);
					if (!(e.cell && e.cell.field==='delete'))
						return;

					var item = e.grid.getItem(e.rowIndex);
//					storeItem = e.grid.store._itemsByIdentity[item.id];

					window.log('Sending delete request to FB: "'+item.message+'"');
					console.log(item.id[0] + ': deleting...');
		
					 FB.api(item.id[0], 'delete', function(response) {
						   console.log(response);
						   if (!response || response.error) {
								console.log('Error deleting from FB: ', item.id[0]);
						  } else {
								e.grid.store.deleteItem(item);					
								e.grid.store.save();
								console.log(item.id[0] + ': deleted from FB.');
								window.log('Delete successful: "'+item.message+'"');
						  }
					 });
				});

				window.grid=grid;

			window.log = function(msg){
				construct.create('div',{
						className: 'outputRow',
						innerHTML: msg
					},
					'output', 'last');
			};

			window.createTestComments = function(e) {
					var i = 0;
					for (i=0; i<100 ;i++ )
					{
						 FB.api("204577813017231_204580473016965/comments", "post", {
								message: "I hate you!! (" + i + ")",
								access_token: window.page_access_token
							}, function(response) {
							   console.log(response);
							   if (!response || response.error || !response.id) {
									console.log("Failed.");
							  } else {
									console.log("Created comment "+response.id);
							  }
						 });
					}

			};

			window.deleteSelected = function(e) {
				var items = window.grid.selection.getSelected();
				if(items.length) {
					window.log("Deleting " + items.length + " comments from FB. This might take a while. Please wait!");

					var promises = array.map(items, function(item){
						if(item !== null){
							  var deferred = new Deferred();

							 FB.api(item.id[0], 'delete', function(response) {
								   console.log(response);
								   if (!response || response.error) {
										console.log('Error deleting from FB: ', item.id[0]);
								  } else {
										window.grid.store.deleteItem(item);					
										window.grid.store.save();
										console.log(item.id[0] + ': deleted from FB.');
									  deferred.resolve("success");
								  }
							 });

							 return deferred.promise;
						} 
					}); 

					all(promises).then(function(){
						window.log("Successfully deleted " + items.length + " comments from FB. Thank you for you patience.");
					});

				} 
			};

			window.setPage = function(id, access_token) {
				console.log('setPage ' + id + ' ' + access_token);

				 FB.api('/'+id+'/posts', {limit:5000}, function(response) {
				   console.log(response);

					var data = {
					  identifier: "id",
					  label: "name",
					  items: []
					};

					var store = new ItemFileWriteStore({data: data});

					window.grid.setStore(store);

				   array.forEach(response.data, function(post){
					   if (post.comments && post.comments.count)
					   {
							 FB.api(post.id+"/comments", {limit:5000}, function(response) {
							   console.log(response);
							   array.forEach(response.data, function(comment){
									store.newItem({ id: comment.id, name: comment.from.name, fromid: comment.from.id, message: comment.message });
							   });
							 });
					   }
				   });
				 });

				store.save();

				if (config.isDebug)
				{
					style.set(registry.byId('button_createTestComments').domNode, 'display', '');
				}
			};

			 window.fbAsyncInit = function() {
				// init the FB JS SDK
				FB.init({
				  appId      : config.fbAppId,//'510971358963852',//'542707679086193', // App ID from the App Dashboard
				  channelUrl : '//localhost/zerohate/channel.html', // Channel File for x-domain communication
				  status     : true, // check the login status upon init?
				  cookie     : true, // set sessions cookies to allow your server to access the session?
				  xfbml      : true  // parse XFBML tags on this page?
				});

				// Additional initialization code such as adding Event Listeners goes here
				FB.Event.subscribe('auth.logout', function (response) {
					 console.debug('auth.logout'+json.toJson(response));

				 FB.api('/me/accounts', function(response) {
				   console.log(response);
				   array.forEach(response.data, function(account){
						var n = construct.create('li', {
							innerHTML: account.name
						}, 'pages_list', 'append');
						
						on(n, 'click', lang.partial(setPage, account.id, account.access_token));
				   });
				 });



				});

				FB.Event.subscribe('auth.login', function (response) {
					 console.debug('auth.login'+json.toJson(response));

					FB.api('/me/permissions', function(response){
					  if (response && response.data && response.data.length){
						var permissions = response.data.shift();
						if (!(permissions.manage_pages && permissions.publish_stream)) {
						 FB.login(function(response) {
						   if (response.authResponse) {
							 console.log('Granted permissions');
						   } else {
							 console.log('User cancelled login or did not fully authorize.');
						   }
						 }, {scope:'manage_pages,publish_stream'});
						}
					  }
					});					
				});

				FB.Event.subscribe('auth.authResponseChange', function (response) {
					 console.debug('auth.authResponseChange'+json.toJson(response));

					if (response.authResponse)
					{
					
						var uid = response.authResponse.userID;
						var accessToken = response.authResponse.accessToken;

						 FB.api('/me/accounts', function(response) {
						   console.log(response);
						   array.forEach(response.data, function(account){
								var n = construct.create('li', {
									innerHTML: account.name
								}, 'pages_list', 'append');
								
								window.page_access_token = account.access_token;
								on(n, 'click', lang.partial(setPage, account.id, account.access_token));
						   });
						 });


					}
				});

				FB.Event.subscribe('auth.statusChange', function (response) {
					 console.debug('auth.statusChange'+json.toJson(response));

					 if (response.status==='not_authorized')
					 {
					 }
				});

				FB.getLoginStatus(function(response) {
				  if (response.status === 'connected') {
					// the user is logged in and has authenticated your
					// app, and response.authResponse supplies
					// the user's ID, a valid access token, a signed
					// request, and the time the access token 
					// and signed request each expire
					var uid = response.authResponse.userID;
					var accessToken = response.authResponse.accessToken;
//				  } else if (response.status === 'not_authorized') {
					// the user is logged in to Facebook, 
					// but has not authenticated your app
				  } else {
					// the user isn't logged in to Facebook.
					window.log('Hej! Kan vara lite svårt att ansluta till Facebook. Först måste man se till att inga popups blockeras. Sen är det bara att vara ihärdig. Facebook behöver ibland övertygas om att man menar allvar med att logga in. Klicka, klicka, klicka....');
						 FB.login(function(response) {
						   if (response.authResponse) {
							 console.log('Welcome!  Fetching your information.... ');
							 FB.api('/me', function(response) {
							   console.log('Good to see you, ' + response.name + '.');
							 });

						   } else {
							 console.log('User cancelled login or did not fully authorize.');
						   }
						 }, {scope:'manage_pages,publish_stream'});
				  }
				 });
			  };

			  // Load the SDK's source Asynchronously
			  // Note that the debug version is being actively developed and might 
			  // contain some type checks that are overly strict. 
			  // Please report such bugs using the bugs tool.
			  (function(d, debug){
				 var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
				 if (d.getElementById(id)) {return;}
				 js = d.createElement('script'); js.id = id; js.async = true;
				 js.src = "//connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
				 ref.parentNode.insertBefore(js, ref);
			   }(document, /*debug*/ false));
		});
	}
	else {
		// TODO: Eventually, the Boilerplate will actually have a useful server implementation here :)
		console.log('Hello from the server!');
	}
});