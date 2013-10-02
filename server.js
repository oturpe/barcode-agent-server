var mongoose = require('mongoose');
mongoose.connect('mongodb://nodejitsu:5d9bd603b625abe8249cbac6e3625c9a@paulo.mongohq.com:10063/nodejitsudb5597013691');

var util = require('util');
var querystring = require('querystring');
var fs = require('fs');

console.log('meow');

function postRequest(request, response, callback) {
    var queryData = "";
    if(typeof callback !== 'function') return null;

    if(request.method == 'POST') {
        request.on('data', function(data) {
            queryData += data;
            if(queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {'Content-Type': 'text/plain'}).end();
                request.connection.destroy();
            }
        });

        request.on('end', function() {
            response.post = querystring.parse(queryData);
            callback();
        });

    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}
//  console.log('meow');
//var Cat = mongoose.model('Cat', { name: String });
var Product = mongoose.model('Product', { barcode: String, name: String });
var Image = mongoose.model('Image', { product_id: String, by: String, image: String });
var Comment = mongoose.model('Comment', { product_id: String, comment: String, by: String, date: String });
//var Testmodel = mongoose.model('Testmodel', { pid: String });


//  console.log('meow');
/*var kitty = new Cat({ name: 'Zildjian' });
Cat.find(function (err, kittens) {
  console.log(err);
  //if (err) // TODO handle err
  console.log(kittens);
})*/

	            //var new_image = new Image({ product_id: "523e9ddc408124dc0c000001", by: "asfs", image: "asffs" });
/*	            var new_test = new Testmodel({ pid: "523e9ddc408124dc0c000001"});
	            new_test.save(function (err) {
	                if (err) { console.log("image not saved\n"); }
	                else { console.log("image saved\n"); }
	            });
	            console.log("asf");
                    Testmodel.find(function (err, test) {
                        console.log(test);
                    });*/
//	            process.exit(1);
// Load the http module to create an http server.
var http = require('http');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
    //response.writeHead(200, {"Content-Type": "text/plain"});
    //console.log(util.inspect(request, false, null));

    if (request.method == 'POST') {
        postRequest(request, response, function() {
            console.log(response.post);
            if (response.post.barcode && response.post.name) {
	            var new_product = new Product({'barcode': response.post.barcode, 'name': response.post.name});
	            new_product.save(function (err) {
                    if (err) { 
                        console.log("product not saved\n"); 
                        response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'});
                    }
                    else { console.log("product saved\n"); response.writeHead(200, "OK", {'Content-Type': 'text/plain'}); }
                    response.end();
	            });
	            //console.log
	        }
	        if (response.post.comment && response.post.by && response.post.product_id) {
	            var new_comment = new Comment(response.post);
	            new_comment.save(function (err) {
	                if (err) { console.log("comment not saved\n"); response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'}); }
	                else { console.log("comment saved\n"); response.writeHead(200, "OK", {'Content-Type': 'text/plain'}); }
	            });
	        }/*
	        if (response.post.product_id && response.post.image_by && response.post.url) {
	            var new_image = new Image(response.post);
	            new_image.save(function (err) {
	                if (err) { console.log("image not saved\n"); }
	                else { console.log("image saved\n") }
	            });
	        }*/
	        if (response.post.product_id && response.post.by && response.post.image) {
	            var new_image = new Image(response.post);
	            new_image.save(function (err) {
	                if (err) { console.log("image not saved\n"); response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'}); }
	                else { console.log("image saved\n"); response.writeHead(200, "OK", {'Content-Type': 'text/plain'}); }
	            });
    	        /*fs.writeFile("/home/i/barcodeagent/img/"+response.post.product_id, response.post.image, function(err) {
    	        new Buffer("SGVsbG8gV29ybGQ=".toString('ascii')
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("The file was saved!");
                    }
                });*/ 
	        }
            response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            response.end();
        });
    }
    
    if (request.method == 'GET') {
        var args = request.url.split('/');
        console.log(request.url.split('/'));
        var command = args[1];
        var product_id = args[2];
        var sub_command = args[3];
        var sub_command_id = args[4];
        //console.log(command+" == products");
        if (command == 'products') {
//response.end(command);
            if (product_id) {
                if (sub_command == 'comments') {
                    if (sub_command_id) {
                        Comment.findById(sub_command_id, function (err, comment) {
                            if (err) { response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'}); }
                            response.end(JSON.stringify(comment));
                        });
                    }
                    Comment.find(response, {'product_id': product_id}, function (err, comment) {
                            if (err) { response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'}); }
                        response.end(JSON.stringify(comment));
                    });
                }
                if (sub_command == 'img') {
                    if (sub_command_id) {
                        Image.findById(sub_command_id, function (err, image) {
                            if (err) { response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'}); }
                            response.end(JSON.stringify(image));
                        });
                    }
                    Image.find(response, {'product_id' : product_id}, function (err, image) {
                            if (err) { response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'}); }
                        response.end(JSON.stringify(image));
                    });
                }
                console.log("product id: "+product_id);
                Product.findById(product_id, function (err, product) {
                            if (err) { response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'}); }
                    console.log(product);
        		    response.end(JSON.stringify(product));
                });
            } else {
                Product.find(response, function (err, product) {
                            if (err) { response.writeHead(404, "NOT FOUND", {'Content-Type': 'text/plain'}); }
                    //console.log(response);
    //    		response.writeHead(200, {"Content-Type": "text/plain"});
    //response.end("lol");
        		    response.end(JSON.stringify(product));
                });
	        }
        }
    }
            //response.end();
//console.log(body);
  //response.end(request.url + " "+ request.method + " " + request.barcode + " " + request.name + "\n");
/*response.end('{'
+' "name": "Erikois RuokaHerkku",'
+'  "image": {'
+'    "by": "kayttäjä-1",'
+'    "date": "2013-05-10 1208",'
+'    "url": "http://localhost/products/1/img/1.jpg"'
+'  },'
+'  "comments": ['
+'    {"by": "käyttäjä-1", "date": "2013-05-10 1210", "text": "Hyvä tuote!"},'
+'    {"by": "käyttäjä-2", "date": "2013-05-12 1652", "text": "Ei kun huono tuote!"}'
+'  ]'
+'}');*/
});

// Listen on port 8001, IP defaults to 127.0.0.1
server.listen(8001);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8001/");
/*kitty.save(function (err) {
  if (err) // ...
  console.log('meow');
});*/
