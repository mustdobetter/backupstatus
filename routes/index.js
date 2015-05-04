var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var currentDate = new Date();
  currentDate = currentDate.getDate() + '/' + currentDate.getMonth() + '/' + currentDate.getFullYear();
  res.render('index', { title: 'C3 Backup Status', date: currentDate });
});

// Get Add Server page
router.get('/addServer', function(req, res, next) {
  res.render('addServer', { title: 'Add Server' });
});

// Log Backup page
router.post('/logBackup', function(req, res, next) {
  var db = req.db;
  var ObjectID = req.ObjectID;
  var postData = req.body;

  console.log(postData);

  // Check for query-string data. Return 500 Bad Request if not all required params passed
  if (!postData.id || (!postData.files && !postData.database) || postData.success == undefined) {
    res.status(400).send('Bad Request');
  }

  var now = new Date();
  var formattedDate = now.getFullYear() + '/' + now.getMonth() + '/' + now.getDate();

  // Find server by ID
  db.collection('serverlist').find({_id: new ObjectID(postData.id)}).toArray(function(err, docs) {
    if (docs.length) {
      var server = docs[0];

      var type;
      if (postData.files) {
        type = 'files';
      } else if (postData.database) {
        type = 'database';
      }

      // Check for existing entry for this server, type, and date
      db.collection('backuplog').find({
        serverId: postData.id,
        date: formattedDate,
        type: type
      }).toArray(function(err, docs) {
        console.log(docs.length);
          if (err) {
            res.send('Internal Server Error');
            res.status(500);
          } else if (docs.length) {
            res.send('Log entry already exists.');
            res.status(400);
          } else {
            db.collection('backuplog').insertOne({
              serverId: postData.id,
              date: formattedDate,
              type: type,
              log: postData.log.toString("utf8"),
              success: postData.success == 1 ? 1 : 0
            }, function(err, doc) {
              if (err) {
                res.send('Internal Server Error');
                res.status(500);
              } else {
                res.send('OK');
              }
            });
          }
      });
    }
  });
});

router.get('/showLog', function(req, res, next) {
  var db = req.db;
  res.render('showLog', { title: 'Log Entry' });
});

router.get('/getLog', function(req, res, next) {
  var db = req.db;
  var ObjectID = req.ObjectID;

  db.collection('backuplog').find({
    _id: ObjectID(req.query.id)
  }).toArray(function (err, items) {
    var item = items[0];

    db.collection('serverlist').find({_id: ObjectID(item.serverId)}).toArray(function(err, docs) {
      if (!err) {
        var server = docs[0];
        item.serverName = server.name;
      }

      res.json(item);
    });


  });
});

router.get('/getServers', function(req, res, next) {
  var db = req.db;
  db.collection('serverlist').find().sort({name: 1}).toArray(function (err, items) {
    res.json(items);
  });
});

router.get('/getEntries', function(req, res, next) {
  var db = req.db;
  var now = new Date();
  var formattedDate = now.getFullYear() + '/' + now.getMonth() + '/' + now.getDate();

  db.collection('backuplog').find({
    date: formattedDate
  }).toArray(function (err, items) {
    res.json(items);
  });
});

// Add Server post action
router.post('/addServer/post', function(req, res, next) {
  var db = req.db;

  // Data validation
  if (!req.body.name) {
    res.send('Please enter a server name.');
    return;

  } else {
    // Check server doesn't already exist
    var existing = false;

    db.collection('serverlist').find({name: req.body.name}).toArray(function(err, docs) {
      if (docs.length) {
        existing = true;
      }

      if (existing) {
        res.send('Server with name "' + req.body.name + '" already exists.');
        return;
      }

      if (!req.body.files && !req.body.database) {
        res.send('Please select at least one backup type.');
        return;
      }

      db.collection('serverlist').insertOne({
        name:     req.body.name,
        database: req.body.database == 'on' ? 1 : 0,
        files:    req.body.files == 'on' ? 1 : 0

      }, function (err, doc) {
        if (err) {
          res.send('There was a problem inserting the record into the database: ' + err);
        } else {
          res.redirect('/');
        }
      })
    });
  }
});

module.exports = router;
