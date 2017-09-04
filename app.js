var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var request = require('request');
const mdb = require('moviedb')('363f8477734870bd23272ace51dc0756');
// https://api.themoviedb.org/3/movie/550?api_key=363f8477734870bd23272ace51dc0756&language=pt-US

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());


/******************** global dialog **********************/
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    // session.send("You said: %s", session.message.text);
    session.send("Hello! My name is Stanley, your movie recommender.");
    session.beginDialog('/menu');
});

bot.dialog('/menu', function(session){
	var msg = "What type of movies are you looking for? \
	Do you want 1) New movies or 2) Top rated movies?";
	session.send(msg);

});

bot.dialog('/end', function(session){
	var msg = "Glad to help you. See you next time!";
	delete session.userData;
	session.endConversation(msg);
})
.triggerAction({ matches: /^.*bye.*|.*goodbye.*/i });


/******* global var *************/
// var movies = []
// var titles = []
// var des = []



/************************* best of all time ******************************/
bot.dialog("bestMovies", function(session){
	var request = require("request");
	// discover
	// var options = { method: 'GET', 
	// 	url: 'https://api.themoviedb.org/3/discover/movie',
	// 	qs: {api_key: '363f8477734870bd23272ace51dc0756',
	// 		 language: 'en-US',
	// 		 page: '5',
	// 		 sort_by: 'vote_count.desc',
	// 		 include_adult: 'false',
	// 		 include_video: 'false'},
	// 	body: '{}'};

	// top_rated
	var options = { method: 'GET',
		url: 'https://api.themoviedb.org/3/movie/top_rated',
		qs: {api_key: '363f8477734870bd23272ace51dc0756',
			language: 'en-US',
			page: '5'
		},
		body: '{}'
	};

	request(options, function(error, response, body){
		if (error) throw new Error(error);

		var data = JSON.parse(body);

		console.log(data['results'].length);

		session.userData.movies = [];
		session.userData.titles = [];
		session.userData.des = [];
		var movies = session.userData.movies;


		for (i=0; i< data['results'].length; i++){
	  	 session.userData.movies.push(data["results"][i]);
	  	}

		session.userData.titles = movies.map(function(a) {return a.title;});
		session.userData.des = movies.map(function(a) {return a.overview});
	  
		/*** alias ***/
		var titles = session.userData.titles;

	  	session.send("Here are the 10 top rated movies right now: <br>"
	  	 + '&emsp; 1. ' + titles[0].toString() + '<br>'
	  	 + '&emsp; 2. ' + titles[1].toString() + '<br>'
	  	 + '&emsp; 3. ' + titles[2].toString() + '<br>'
	  	 + '&emsp; 4. ' + titles[3].toString() + '<br>'
	  	 + '&emsp; 5. ' + titles[4].toString() + '<br>'
	  	 + '&emsp; 6. ' + titles[5].toString() + '<br>'
	  	 + '&emsp; 7. ' + titles[6].toString() + '<br>'
	  	 + '&emsp; 8. ' + titles[7].toString() + '<br>'
	  	 + '&emsp; 9. ' + titles[8].toString() + '<br>'
	  	 + '&emsp; 10. ' + titles[9].toString() + '<br>'
	  	 + "Respond 'description'(D) for detailed description, 'more'(M) for more movies, \
	  	 'restart'( R) to search again, 'end'(E) if you are set. "
	 	);

	});

})
.triggerAction({ matches: /^.*best.*$|^.*top.*rated$/i })
.beginDialogAction('showDesAction', 'topMovieDes', { matches: /^description$|D|des/i, })
.beginDialogAction('moreAction', 'showAll', { matches: /^more$|^more.*movies$|M/i })
.beginDialogAction('restartAction', '/menu', {matches: /restart|R/i })
.beginDialogAction('endAction', '/end', {matches: /end|E/i });

bot.dialog('topMovieDes', function(session){
	var titles = session.userData.titles;
	var des = session.userData.des;

	var result = 'Here are the movies and their description: <br>';
	for (var i=1; i<11; i++){
		result += '&emsp;' + i + '. ' + titles[i-1].toString() + '<br>'
		+ des[i-1].toString() + '<br>';
	}
	result += "Respond 'back'(B) to go back to previous step, 'restart'( R) for a new search, \
	'end'(E) if you are all set.";

	session.send(result);
})
.beginDialogAction('returnAction', 'bestMovies', { matches: /^back$|B/i })
.beginDialogAction('restartAction', '/menu', {matches: /restart|R/i })
.beginDialogAction('endAction', '/end', {matches: /end|E/i });


bot.dialog('showAll', function(session){
	var titles = session.userData.titles;
	
	var result = 'Here are some more top rated movies: <br>';
	count = 1;
	for (var i=0; i< titles.length; i++) {
		result += '&emsp;' + count + '. ' + titles[i].toString() + '<br>';
		count += 1;
	}
	result += "Respond 'description'(D) for detailed description, 'back'(B) to previous step, \
	'restart'( R) for a new search, 'end'(E) if you are all set.";
	
	console.log(result);

	session.send(result);
})
.beginDialogAction('descriptionLongAction', 'topDesLong', {matches: /^description$|^des$|D$/i})
.beginDialogAction('newMoviesAction', 'bestMovies', { matches: /^back$|B/i })
.beginDialogAction('restartAction', '/menu', {matches: /restart|R/i });

bot.dialog('topDesLong', function(session){
	var titles = session.userData.titles;
	var des = session.userData.des;

	var result = 'Here is the description for all the top rated movies: <br>';
	count = 1;
	for (var i=0; i< titles.length; i++) {
		result += '&emsp;' + count + '. ' + titles[i].toString() + '<br>' 
		+ des[i].toString() + '<br>';
		count += 1;
	}
	result += "Respond 'back'(B) to go back to previous step, 'restart'( R) for a new search, \
	  	'end'(E) if you are all set."

	session.send(result);


}).beginDialogAction('moreMoviesAction', 'showAll', {matches: /back|B/i})
.beginDialogAction('restartAction', '/menu', {matches: /restart|R/i })
.beginDialogAction('endAction', '/end', {matches: /end|E/i })


/***************************** new movies ********************************/
bot.dialog('newMovies', function(session){
	var request = require("request");

	var options = { method: 'GET',
	  url: 'https://api.themoviedb.org/3/movie/now_playing',
	  qs: 
	   { page: '1',
	     language: 'en-US',
	     api_key: '363f8477734870bd23272ace51dc0756' },
	  body: '{}' };

	request(options, function (error, response, body) {
	  if (error) throw new Error(error);

	  var data = JSON.parse(body);

	  /****** global var  *******/
	  session.userData.movies = [];
	  session.userData.titles = [];
	  session.userData.des = [];
	  var movies = session.userData.movies;

	  for (i=0; i<10; i++){
	  	session.userData.movies.push(data["results"][i]);
	  }

	  session.userData.titles = movies.map(function(a) {return a.title;});
	  session.userData.des = movies.map(function(a) {return a.overview});
	  
	  /*** alias ***/
	  var titles = session.userData.titles;

	  session.send("Here are the top 5 now playing movies right now: <br>"
	  	 + '&emsp; 1. ' + titles[0].toString() + '<br>'
	  	 + '&emsp; 2. ' + titles[1].toString() + '<br>'
	  	 + '&emsp; 3. ' + titles[2].toString() + '<br>'
	  	 + '&emsp; 4. ' + titles[3].toString() + '<br>'
	  	 + '&emsp; 5. ' + titles[4].toString() + '<br>'
	  	 + "Respond 'description'(D) for detailed description, 'more'(M) for more movies, \
	  	 'restart'( R) to search again, 'end'(E) if you are set. "
	  );
	
	});
})
.triggerAction({
	matches: /new.*$|^new.*movies$/i,
})
.beginDialogAction('showDesAction', 'showDescription', { matches: /^description$|D|des/i, })
.beginDialogAction('moreMoviesAction', 'moreMovies', { matches: /^more$|^more.*movies$|M/i })
.beginDialogAction('restartAction', '/menu', {matches: /restart|R/i })
.beginDialogAction('endAction', '/end', {matches: /end|E/i });


bot.dialog('showDescription', function(session){
	var titles = session.userData.titles;
	var des = session.userData.des;

	session.send("The movie description: <br>"
		+ '&emsp; 1. ' + titles[0].toString() + des[0].toString() + '<br>'
		+ '&emsp; 2. ' + titles[1].toString() + des[1].toString() + '<br>'
	  	+ '&emsp; 3. ' + titles[2].toString() + des[2].toString() + '<br>'
	  	+ '&emsp; 4. ' + titles[3].toString() + des[3].toString() + '<br>'
	  	+ '&emsp; 5. ' + titles[4].toString() + des[4].toString() + '<br>'
	  	+ "Respond 'back'(B) to go back to previous step, 'restart'( R) for a new search, \
	  	'end'(E) if you are all set.");
})
.beginDialogAction('newMoviesAction', 'newMovies', { matches: /^back$|B/i })
.beginDialogAction('restartAction', '/menu', {matches: /restart|R/i })
.beginDialogAction('endAction', '/end', {matches: /end|E/i });


/******************** more movies ************************/
bot.dialog('moreMovies', function(session){
	var titles = session.userData.titles;

	session.send("Here are some more movies on air: <br>"
		 + '&emsp; 1. ' + titles[5].toString() + '<br>'
	  	 + '&emsp; 2. ' + titles[6].toString() + '<br>'
	  	 + '&emsp; 3. ' + titles[7].toString() + '<br>'
	  	 + '&emsp; 4. ' + titles[8].toString() + '<br>'
	  	 + '&emsp; 5. ' + titles[9].toString() + '<br>'
	  	 + "Respond 'description'(D) for detailed description, 'back'(B) to previous step, \
	  	  'restart'( R) for a new search, 'end'(E) if you are all set.");
})
.beginDialogAction('descriptionLongAction', 'descriptionLong', {matches: /^description$|^des$|D$/i})
.beginDialogAction('newMoviesAction', 'newMovies', { matches: /^back$|B/i })
.beginDialogAction('restartAction', '/menu', {matches: /restart|R/i });

bot.dialog('descriptionLong', function(session){

	var titles = session.userData.titles;
	var des = session.userData.des;

	session.send("Here is the description for the movies: <br> "
		+ '&emsp; 1. ' + titles[5].toString() + des[5].toString() + '<br>'
		+ '&emsp; 2. ' + titles[6].toString() + des[6].toString() + '<br>'
	  	+ '&emsp; 3. ' + titles[7].toString() + des[7].toString() + '<br>'
	  	+ '&emsp; 4. ' + titles[8].toString() + des[8].toString() + '<br>'
	  	+ '&emsp; 5. ' + titles[9].toString() + des[9].toString() + '<br>'
	  	+ "Respond 'back'(B) to go back to previous step, 'restart'( R) for a new search, \
	  	'end'(E) if you are all set.");
})
.beginDialogAction('moreMoviesAction', 'moreMovies', {matches: /back|B/i})
.beginDialogAction('restartAction', '/menu', {matches: /restart|R/i })
.beginDialogAction('endAction', '/end', {matches: /end|E/i });
