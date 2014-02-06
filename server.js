// required modules: 
// npm install mongoose
// npm install mkdirp

var mongoose = require('mongoose');
mongoose.connect('mongodb://nodejitsu:5d9bd603b625abe8249cbac6e3625c9a@paulo.mongohq.com:10063/nodejitsudb5597013691');

var util = require('util');
var querystring = require('querystring');
var fs = require('fs');
var http = require('http');
var mkdirp = require('mkdirp');

console.log('Server start');

var Product = mongoose.model('Product', {
    barcode: String,
    name: String,
    category: String
});
var Pictures = mongoose.model('Pictures', {
    product_id: String,
    by: String,
    image_url: String
});
var Comment = mongoose.model('Comment', {
    product_id: String,
    comment: String,
    by: String,
    date: String
});
var Flag = mongoose.model('Flag', {
    product_id: String,
    flag: String
});


// handle post events here

function postRequest(request, response, callback) {
    var queryData = "";
    if (typeof callback !== 'function') return null;

    if (request.method == 'POST') {
        request.on('data', function (data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, {
                    'Content-Type': 'text/plain'
                }).end();
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            callback(querystring.parse(queryData));
        });

    } else {
        response.writeHead(405, {
            'Content-Type': 'text/plain'
        });
        response.end();
    }
}

function notFound(response) {
    console.log("not found\n");
    response.writeHead(404, "Not Found", {
       'Content-Type': 'text/plain'
    });
    response.end();
}

function checkIfProductExists(url, response, callback) {
    if (url.product_id) {
        Product.find({
            _id: url.product_id
        }, function (err, prod) {
            console.log(prod);
            if (err) {
                notFound(response);
            }
            if (prod !== undefined) {
                if (prod[0] === undefined) {
                    notFound(response);
                } else {
                    callback();
                }
            } else {
                notFound(response);
            }
            return false;
        });
    }
}

function parseUrl(request_url) {
    var args = request_url.split('/');
    var url = {};
    url.command = args[1];
    url.product_id = args[2];
    url.sub_command = args[3];
    url.sub_command_id = args[4];
    return url;
}

function newProduct(response, postData) {
    var new_product = new Product({
        'barcode': postData.barcode,
        'name': postData.name
    });
    console.log(new_product);

    new_product.save(function (err, new_product) {
        if (err) {
            console.log("product not saved\n");
            response.writeHead(400, "Bad Request", {
                'Content-Type': 'text/plain'
            });
            response.end();
        } else {
            console.log("product saved\n");
            response.writeHead(201, "Created", {
                'Content-Type': 'text/plain'
            });
            response.write("" + new_product._id);
            response.end();
        }
    });
}

function newComment(url, response, postData) {
    if (url.command != "products" || url.sub_command != 'comments') {
        console.log("comment not saved, protocol error\n");
        response.writeHead(400, "Bad Request", {
            'Content-Type': 'text/plain'
        });
        response.end();
    } else {
        // add product_id to postData
        postData.product_id = url.product_id;

        // create comment from postData
        var new_comment = new Comment(postData);
        new_comment.save(function (err) {
            if (err) {
                console.log("comment not saved\n");
                response.writeHead(404, "Not Found", {
                    'Content-Type': 'text/plain'
                });
            } else {
                console.log("comment saved\n");
                response.writeHead(201, "Created", {
                    'Content-Type': 'text/plain'
                });
            }
            response.end();
        });
    }
}

function newFlag(url, response, postData) {
    if (url.command != "products" || url.sub_command != 'flags') {
        console.log("flag not saved, protocol error\n");
        response.writeHead(400, "Bad Request", {
            'Content-Type': 'text/plain'
        });
        response.end();
    } else {
        // add product_id to postData
        postData.product_id = url.product_id;

        // create comment from postData
        var new_flag = new Flag(postData);
        new_flag.save(function (err) {
            if (err) {
                console.log("flag not saved\n");
                response.writeHead(404, "Not Found", {
                    'Content-Type': 'text/plain'
                });
            } else {
                console.log("flag saved\n");
                response.writeHead(201, "Created", {
                    'Content-Type': 'text/plain'
                });
            }
            response.end();
        });
    }
}

function newImage(url, response, postData) {
    if (url.command != "products" || url.sub_command != 'images') {
        console.log("comment not saved, protocol error\n");
        response.writeHead(400, "Bad Request", {
            'Content-Type': 'text/plain'
        });
        response.end();
    } else {

        // check if product by id exists
        /*Product.findById(url.product_id, function (err, doc) {
                        if (err) {
                            response.writeHead(404, "Not Found", {
                                'Content-Type': 'text/plain'
                            });
                            console.log("here"+url.product_id);
                            response.end();
                        }
                    })*/

        var regex = /^data:.+\/(.+);base64,(.*)$/;
        var path = "products/" + url.product_id;

        //if dir not exists, create it
        mkdirp(path, function (err) {
            if (err) {
                // do something!
            }
        });

        console.log(new Date().getTime());
        var matches = postData.image.match(regex);
        var ext = matches[1];
        var data = matches[2];
        // filename is the number of millseconds since epoch
        var filename = new Date().getTime();
        var buffer = new Buffer(data, 'base64');
        fs.writeFileSync(path + '/' + filename + '.jpg', buffer);

        // delete base64data from postData, dont save to database
        delete(postData.image);

        postData.product_id = url.product_id;
        postData.image_url = path + "/" + filename + ".jpg";
        console.log(postData);
        var new_image = new Pictures(postData);
        new_image.save(function (err) {
            if (err) {
                console.log("image not saved to database\n");
                response.writeHead(400, "Bad Request", {
                    'Content-Type': 'text/plain'
                });
            } else {
                console.log("image saved\n");
                response.writeHead(201, "OK", {
                    'Content-Type': 'text/plain'
                });
            }
            response.end();
        });
    }
}

function productByBarcode(url, response) {
            if (url.product_id) {
                Product.find({ barcode: url.product_id }, function (err, product) {
                    if (err || product[0] === undefined) {
                        console.log("barcode not found\n");
                        response.writeHead(404, "NOT FOUND", {
                           'Content-Type': 'text/plain'
                        });
                        response.end();
                    } else {
                        response.end(JSON.stringify(product));
                    }
                });
            } else {
                console.log("bad request, no bardcode provided\n");
                response.writeHead(400, "Bad Request", {
                    'Content-Type': 'text/plain'
                });
                response.end();
            }
}

var server = http.createServer(function (request, response) {

    var url = parseUrl(request.url);
    
    console.log(url);

    if (request.method == 'POST') {
        postRequest(request, response, function (postData) {
            if (postData.barcode && postData.name && url.command == "products") {
                newProduct(response, postData);
            } else {
                checkIfProductExists(url, response, function () {
                    if (postData.comment && postData.by) {
                        newComment(url, response, postData);
                    } else if (postData.by && postData.image) {
                        newImage(url, response, postData);
                    } else if (postData.flag) {
                        newFlag(url, response, postData);
                    } else {
                        console.log("bad request\n");
                        response.writeHead(400, "Bad Request", {
                            'Content-Type': 'text/plain'
                        });
                        response.end();
                    }
                });
            }
        });
        //checkIfProductExists();
    } else if (request.method == 'GET') {
        if (url.command == "products") {
            if (url.product_id) {
                if (url.sub_command == "images") {
                    if (url.sub_command_id) {
                        Pictures.find({product_id: url.product_id}, function (err, pic) {
                           response.end(JSON.stringify(pic));
                        });
                    }
                    //console.log("here"+url.product_id);
                    Pictures.find({product_id: url.product_id}, function (err, pic) {
                       response.end(JSON.stringify(pic));
                    });
                
                } else if (url.sub_command == "comments") {
                    if (url.sub_command_id) {
                        Comment.find({ _id: url.sub_command_id }, 
                            function (err, comment) {
                            response.end(JSON.stringify(comment));
                        });
                    } else {
                        Comment.find(response, function (err, comment) {
                            response.end(JSON.stringify(comment));
                        });
                    }
                } else if (url.sub_command == "flags") {
                    Flag.find({ product_id: url.product_id }, function (err, flags) {
                        response.end(JSON.stringify(flags));
                    });
                } else {
                    Product.find({ _id: url.product_id }, function (err, product) {
                        response.end(JSON.stringify(product));
                    });
                }
            } else {
                console.log("bad request, no product id provided\n");
                response.writeHead(400, "Bad Request", {
                    'Content-Type': 'text/plain'
                });
                response.end();
            }
        } else if (url.command == "barcodes") {
            productByBarcode(url, response);
        }
    }
});

// Listen on port 8002, IP defaults to 127.0.0.1
server.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");
