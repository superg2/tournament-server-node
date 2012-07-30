/**
 * Author: Baptiste Meurant <baptiste.meurant@gmail.com>
 * Date: 19/07/12
 * Time: 08:47
 */

fs = require('fs');
util = require('util');

module.exports = function (app, models) {

    app.options('*', function (req, res) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        res.end('');
    });

    app.get('/api', function (req, res) {
        res.send('App is running');
    });

    app.get('/api/participants', function (req, res) {
        res.header('Access-Control-Allow-Origin', '*');
        return models.participant.find(function (err, participants) {
            if (!err) {
                return res.send(participants);
            } else {
                return console.log(err);
            }
        });
    });

    app.post('/api/participant', function (req, res) {
        res.header('Access-Control-Allow-Origin', '*');
        var participant;
        console.log("POST participant: ");
        console.log(req.body);
        participant = new models.participant({
            firstname:req.body.firstname,
            lastname:req.body.lastname
        });
        participant.save(function (err) {
            if (!err) {
                return console.log("participant " + participant.firstname + " " + participant.lastname + " created");
            } else {
                return console.log(err);
                return res.send("Cannot post participant with body: " + req.body);
            }
        });
        return res.send(participant);
    });

    app.get('/api/participant/:id', function (req, res) {
        res.header('Access-Control-Allow-Origin', '*');
        return models.participant.findById(req.params.id, function (err, participant) {
            if (participant != null) {
                return res.send(participant);
            } else {
                console.log("Cannot find any participant with id: " + req.params.id);
                return res.send("Cannot find any participant with id: " + req.params.id, null, 404);
            }
        });
    });

    app.post('/api/participant/:id/photo', function (req, res) {
        res.header('Access-Control-Allow-Origin', '*');

        var isError = false;
        var responseError, status, picture_url;

        models.participant.findById(req.params.id, function (err, participant) {

            if (err) {
                responseError = err.message;
                status = 400;
                isError = true
            }
            else {
                if (participant == null) {
                    responseError = "Cannot find any participant with id: " + req.params.id;
                    status = 404;
                    isError = true
                }
                else {
                    picture_url = participant.getPictureUrl();
                }
            }

            if (isError) {
                return res.send(responseError, null, status);
            }
            if (picture_url) {
                fs.unlink(picture_url);
            }
            var ins, ous, type;
            ins = fs.createReadStream(req.files.file.path);
            type = (req.files.file.type.split('/'))[1];
            ous = fs.createWriteStream('./participants/photos/' + req.params.id + '.' + type);

            util.pump(ins, ous, function (err) {
                if (err) {
                    next(err);
                } else {
                    //res.redirect('/photos');
                }
            });
            res.send('Uploaded new photo for participant ' + req.params.id);

        });

    });

    app.get('/api/participant/:id/photo', function (req, res) {
        getPhoto(req, res, null);
    });

    app.get('/api/participant/:id/min-photo', function (req, res) {
        getPhoto(req, res, 'min');
    });

    function getPhoto(req, res, type) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Accept-Ranges', 'bytes');
        models.participant.findById(req.params.id, function (err, participant) {

            var img;
            var isError = false;
            var responseError, status, picture_url;

            if (err) {
                responseError = err.message;
                status = 400;
                isError = true
            }
            else {
                if (participant == null) {
                    responseError = "Cannot find any participant with id: " + req.params.id;
                    status = 404;
                    isError = true
                }
                else {

                    picture_url = participant.getPictureUrl();

                    if (!picture_url) {
                        responseError = "Cannot find any photo for participant with id: " + req.params.id;
                        status = 404;
                        isError = true
                    }
                }
            }

            if (isError) {
                return res.send(responseError, null, status);
            }
            img = fs.readFileSync(picture_url);

            var imgType = (picture_url.substring(picture_url.lastIndexOf('.') + 1, picture_url.length));

            if ((type != null) && (type == 'min')) {
                res.header('Cache-Control', 'public, max-age=3600');
            }

            res.writeHead(200, {
                'Content-Type':'image/' + imgType,
                'Content-Length':img.length
            });
            res.end(img, 'binary');
        });
    }

    app.delete('/api/participant/:id/photo', function (req, res) {
            res.header('Access-Control-Allow-Origin', '*');
            var img;
            var isError = false;
            var responseError, status, picture_url;

            models.participant.findById(req.params.id, function (err, participant) {

                if (err) {
                    responseError = err.message;
                    status = 400;
                    isError = true
                }
                else {
                    if (!participant) {
                        responseError = "Cannot find any participant with id: " + req.params.id;
                        status = 404;
                        isError = true
                    }
                    else {
                        picture_url = participant.getPictureUrl();
                    }
                }

                if (isError) {
                    return res.send(responseError, null, status);
                }
                if (picture_url) {
                    fs.unlink(picture_url);
                }

            });
            console.log("photo deleted for participant " + req.params.id);
            res.send('Deleted photo for participant ' + req.params.id);
        }
    )
    ;

    app.put('/api/participant/:id', function (req, res) {
        res.header('Access-Control-Allow-Origin', '*');
        console.log("PUT participant: " + req.params.id + ": ");
        console.log(req.body);
        return models.participant.findById(req.params.id, function (err, participant) {
            participant.firstname = req.body.firstname;
            participant.lastname = req.body.lastname;
            return participant.save(function (err) {
                if (!err) {
                    console.log("participant " + req.params.id + " updated");
                } else {
                    console.log(err);
                }
                return res.send(participant);
            });
        });
    });

    app.delete('/api/participant/:id', function (req, res) {
        res.header('Access-Control-Allow-Origin', '*');
        return models.participant.findById(req.params.id, function (err, participant) {
            if (participant != null) {
                return participant.remove(function (err) {
                    if (!err) {
                        console.log("participant " + req.params.id + " removed");
                        return res.send('');
                    } else {
                        console.log(err);
                        return res.send("cannot remove participant: " + req.params.id, null, 400);
                    }
                });
            }
            else {
                return res.send("cannot remove participant: " + req.params.id, null, 404);
            }
        });
    });

};