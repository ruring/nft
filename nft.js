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
const board_schema = new mongoose.Schema({
  id: { type: Number, default: 0 },
  title: { type: String },
  url: { type: String },
  imageUrl: { type: String },
  content: { type: String },
  likeCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  comments: { type: Array, default: [] }
}, {
  versionKey: false
});
var bid = 0;
const nfts = mongoose.model('nfts', board_schema);
nfts.findOne({}, {}, { sort: { '_id': -1 } })
  .then(function (post) {
    console.log(post.id);
    bid = post.id;
  }).catch(function (post) {
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
    const bid = parseInt(req.query.bid);
    nfts.findOne({ id: bid }).then((board) => {
      res.render("nftedit", { "name": "NFT Content", "board": board });
    });
  }
});

app.post('/edit', (req, res) => {
  if (req.query.bid) {
    const bid = parseInt(req.query.bid);
    const title = req.body.title;
    const url = req.body.url;
    const imageUrl = req.body.imageUrl;
    const content = req.body.content;
    const password = req.body.password;

    nfts.findOne({ id: bid }).then((board) => {
      // 비밀번호 검증
      bcrypt.compare(password, board.password, function (err, result) {
        if (err) {
          console.log(err);
          res.status(500).send('Error comparing password.');
          return;
        }

        if (result) {
          // 비밀번호가 일치하는 경우, 게시글 수정
          nfts.findOneAndUpdate({ id: bid }, { $set: { title: title, url: url, imageUrl: imageUrl, content: content } }, null)
            .then((board) => {
              res.redirect("/content?bid=" + bid);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send('Error updating board.');
              return;
            });
        } else {
          // 비밀번호가 일치하지 않는 경우, 권한 없음
          res.status(403).send('Permission denied.');
        }
      });
    });
  }
});

app.post('/comment', (req, res) => {
  console.log("comment post" + req.query.bid + req.body.comment);
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    console.log("bid" + bid + " cid=" + req.query.cid);
    nfts.findOneAndUpdate({ id: bid }, { $push: { comments: req.body.comment } }, { new: true }).then((board) => {
      res.redirect("/content?bid=" + bid);
    });
  }
});

app.get('/delcomm', (req, res) => {
  console.log("delete comment " + req.query.bid + req.query.cid);
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    console.log("bid" + bid + " cid=" + req.query.cid);
    nfts.findOneAndUpdate({ id: bid }, { $pull: { comments: req.query.cid } }, { new: true }).then((board) => {
      res.redirect("/content?bid=" + bid);
    });
  }
});

app.get('/like', (req, res) => {
  console.log("like add");
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    console.log("bid" + bid);
    nfts.findOneAndUpdate({ id: bid }, { $inc: { likeCount: 1 } }, { new: true })
      .then(function (board) {
        console.log(" like update success. bid" + bid + board);
        res.render("nftcontent", { "name": "NFT Content", "board": board });
      });
  }
});

app.get('/content', (req, res) => {
  console.log(req.query);
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    console.log(bid);
    nfts.findOne({ id: bid }).then((board) => {
      console.log("content read good");
      res.render("nftcontent", { "name": "NFT Content", "board": board });
    });
  }
});

app.post('/board', (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  const url = req.body.url;
  const imageUrl = req.body.imageUrl;
  const password = req.body.password;

  const board = new nfts({
    id: ++bid,
    title: title,
    url: url,
    imageUrl: imageUrl,
    content: content,
    password: password, // 비밀번호를 MongoDB에 저장
  });

  board
    .save()
    .then(() => res.redirect("/lists"))
    .catch((err) => res.status(500).json(err));
});

var server = app.listen(8080, function () {});
          //
