var express = require('express');
var app = express();
var mongoose = require('mongoose');
var url = 'mongodb://localhost/BoardsDB';
var str = "";

mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Successfully connected to mongodb'))
  .catch(e => console.error(e));

const connection = mongoose.connection;
connection.on('error', console.error);
connection.once('open', () => {
  console.log('Connected to mongod server');
});

const board_schema = new mongoose.Schema(
  {
    id: { type: Number, default: 0 },
    title: { type: String },
    url: { type: String },
    imageUrl: { type: String },
    content: { type: String },
    likeCount: { type: Number, default: 0 },
    password: { type: String },
    createdAt: { type: Date, default: Date.now },
    comments: { type: Array, default: [] }
  },
  {
    versionKey: false
  }
);

var bid = 0;
const nfts = mongoose.model('nfts', board_schema);

nfts.findOne({}, {}, { sort: { '_id': -1 } })
  .then(function (post) {
    console.log(post.id);
    bid = post.id;
  })
  .catch(function (post) {
    console.log("board is empty");
    bid = 0;
  });

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
const ejs = require('ejs');
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', function (req, res) {
  res.send("Hi");
});

app.get('/data', (req, res) => {
  nfts.find().then((board) => {
    res.json(board);
  });
});

app.get('/lists', (req, res) => {
  nfts.find().then((boards) => {
    res.render("nftlists", { "name": "NFT Lists", "boards": boards });
  });
});

app.get('/edit', (req, res) => {
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    nfts.findOne({ id: bid }).then((board) => {
      res.render("nftedit", { "name": "NFT Content", "board": board });
    });
  }
});

app.post('/edit', (req, res) => {
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    const password = req.body.password;

    // 비밀번호 검증 로직
    nfts.findOne({ id: bid }).then((board) => {
      if (board && board.password === password) {
        nfts.findOneAndUpdate(
          { id: bid },
          {
            $set: {
              title: req.body.title,
              url: req.body.url,
              imageUrl: req.body.imageUrl,
              content: req.body.content
            }
          },
          null
        ).then((board) => {
          res.redirect("/content?bid=" + bid);
        });
      } else {
        res.send('<script>alert("비밀번호가 일치하지 않습니다."); window.history.back();</script>');
      }
    });
  }
});


app.get('/content', (req, res) => {
  if (req.query.bid) {
    const bid = parseInt(req.query.bid);
    nfts.findOne({ id: bid })
      .then((board) => {
        console.log("content read good");
        res.render("nftcontent", { "name": "NFT Content", "board": board });
      })
      .catch((error) => {
        console.log(error);
        res.send("Error retrieving board content");
      });
  } else {
    res.send("Invalid request");
  }
});

app.post('/comment', (req, res) => {
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    const comment = req.body.comment;
    
    nfts.findOneAndUpdate(
      { id: bid },
      { $push: { comments: comment } },
      { new: true }
    ).then((board) => {
      res.redirect("/content?bid=" + bid);
    });
  }
});

app.get('/delcomm', (req, res) => {
  if (req.query.bid && req.query.cid) {
    const bid = parseInt(req.query.bid);
    const cid = parseInt(req.query.cid);
    
    nfts.findOneAndUpdate(
      { id: bid },
      { $pull: { comments: cid } },
      { new: true }
    ).then((board) => {
      res.redirect("/content?bid=" + bid);
    });
  }
});

app.post('/board', (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  const url = req.body.url;
  const imageUrl = req.body.imageUrl;
  const password = req.body.password;

  const boards = new nfts({
    id: ++bid,
    title: title,
    url: url,
    imageUrl: imageUrl,
    content: content,
    password: password
  });

  boards.save()
    .then(() => res.redirect("/lists"))
    .catch((err) => res.json(req.body));
});

var server = app.listen(8080, function() {});

