
// init project
var express = require('express');
var fetch = require("node-fetch");
var path = require("path");
var mongoose = require("mongoose");
var Recent = require("./models/recent");

var app = express();


app.use(express.static('public'));

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://vd1:vd1-password@ds261247.mlab.com:61247/image_search");

// https://www.googleapis.com/customsearch/v1?q=cars&cx=009347223267235495439%3A2k77gdtarv0&num=10&start=1&searchType=image&key=AIzaSyCgEyMwWpvMKOtH52a8R3YSZVaS42fxY5o

app.get("/recent", function (req, res) {
  Recent.find(function (err, results) {
    if(err) {
      console.log("Error in find recent");
    }
    else {
      res.locals.pastSearches = results;
      res.render("recent");
    }
  });
  
});

app.get("/", function (req, res) {
  res.render("index");
});

function addToDatabase(_term) {
  var date = new Date(Date.now());
  var dateFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  var natural = date.toLocaleDateString("en-us", dateFormatOptions) + ", " + date.toLocaleTimeString('en-US', {timeZone: "America/New_York"}) + " EST";
  
  var newTerm = new Recent({
    time: natural,
    term: _term
  });
  newTerm.save(function (err) {
    if(err) {
      console.log("Error in addToDatabase");
    }
    else {
      console.log("addToDatabase success");
    }
  }); 
  
  Recent.count({}, function(err , count){
    console.log("count is"+count);
    if(count >= 10) {
      Recent.find(function (err, results) {
        if(err) {
          console.log("Error in addToDatabase find recent");
        }
        else {
          var oldestId = results[0]._id;
          Recent.remove({ _id: oldestId }, function (err) {
            if (err) console.log("addToDatabase remove id error"+err);
            console.log("removed _id="+oldestId);
          });
        }
      });  
    }    
  });
}

function doSearch(_term, _offset, _res, _display) {  
  addToDatabase(_term);
  var startIndex = _offset * 10 + 1;
  var fetchTerm = "https://www.googleapis.com/customsearch/v1?q="+_term
        +"&cx=009347223267235495439%3A2k77gdtarv0&num=10&start="+startIndex
        +"&searchType=image&key=AIzaSyCgEyMwWpvMKOtH52a8R3YSZVaS42fxY5o";
  var fetchJson = fetch(fetchTerm).then(function(res) {
    console.log("got fetch result");
    return res.json();
  }).then(function(json) {
    var items = [];
    for(var ii = 0; ii < 10; ii++) {
      var image = {img: json.items[ii].link, title: json.items[ii].title, source: json.items[ii].image.contextLink};
      items.push(image);
    }
    
    if(_display === "api") {
      _res.json(items);
    }
    else {
      _res.locals.searchTerm = _term;
      _res.locals.searchResults = items;
      _res.render("results");
    }
  }); 
}

app.get("/api/:term", function(req, res) {
  var term = req.params.term;
  var offset = 0;
  
  if(req.query && req.query.offset) {
    if (!isNaN(req.query.offset)) {
      offset = req.query.offset;   
    }
  }
  
  doSearch(term, offset, res, "api"); 
});

app.get("/search/:term", function(req, res) {
  var term = req.params.term;
  var offset = 0;
  
  if(req.query && req.query.offset) {
    if (!isNaN(req.query.offset)) {
      offset = req.query.offset;   
    }
  }
  
  doSearch(term, offset, res, "readable"); 
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
