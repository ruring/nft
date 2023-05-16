const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const url = 'mongodb://localhost/BoardsDB';
let bid = 0;

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(e => console.error(e));

let connection = mongoose.connection;
connection.on('error', console.error);
connection.once('open', () => {
  console.log('Connected to MongoDB server');
});

let boardSchema = new mongoose.Schema({
  id: { type: Number, default: 0 },
  title: { type: String },
  url: { type: String },
  imageUrl: { type: String },
  content: { type: String },
  likeCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  comments: { type: Array, default: [] },
  password: { type: String }, // 비밀번호 필드 추가
}, {
  versionKey: false
});

let Nft = mongoose.model('nfts', boardSchema);

Nft.findOne({}, {}, { sort: { '_id': -1 } })
  .then((post) => {
    console.log(post.id);
    bid = post.id;
  })
  .catch(() => {
    console.log("Board is empty");
    bid = 0;
  });

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.send("Hi");
});

app.get('/data', (req, res) => {
  Nft.find().then((board) => {
    res.json(board);
  });
});

app.get('/lists', (req, res) => {
  Nft.find().then((boards) => {
    res.render("nftlists", { "name": "NFT Lists", "boards": boards });
  });
});

app.get('/edit', (req, res) => {
  if (req.query.bid) {
    let bid = parseInt(req.query.bid);
    Nft.findOne({ id: bid }).then((board) => {
      res.render("nftedit", { "name": "NFT Content", "board": board });
    });
  }
});

app.post('/edit', (req, res) => {
  if (req.query.bid) {
    let bid = parseInt(req.query.bid);
    let title = req.body.title;
    let url = req.body.url;
    let imageUrl = req.body.imageUrl;
    let content = req.body.content;
    let password = req.body.password;

    Nft.findOne({ id: bid }).then((board) => {
      // 비밀번호 검증
      bcrypt.compare(password, board.password, function (err, result) {
        if (err) {
          console.log(err);
          res.status(500).send('Error comparing password.');
          return;
        }

        if (result) {
          // 비밀번호가 일치하는 경우, 게시글 수정
          Nft.findOneAndUpdate(
            { id: bid },
            { $set: { title: title, url: url, imageUrl: imageUrl, content: content } },
            null
          )
            .then(() => {
              res.redirect("/content?bid=" + bid);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send('Error updating board.');
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
    Nft.findOneAndUpdate(
      { id: bid },
      { $push: { comments: req.body.comment } },
      { new: true }
    )
      .then(() => {
        res.redirect("/content?bid=" + bid);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send('Error updating board.');
      });
  }
});

app.get('/delcomm', (req, res) => {
  console.log("delete comment " + req.query.bid + req.query.cid);
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    console.log("bid" + bid + " cid=" + req.query.cid);
    Nft.findOneAndUpdate(
      { id: bid },
      { $pull: { comments: req.query.cid } },
      { new: true }
    )
      .then(() => {
        res.redirect("/content?bid=" + bid);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send('Error updating board.');
      });
  }
});

app.get('/like', (req, res) => {
  console.log("like add");
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    console.log("bid" + bid);
    Nft.findOneAndUpdate(
      { id: bid },
      { $inc: { likeCount: 1 } },
      { new: true }
    )
      .then((board) => {
        console.log("Like update success. bid" + bid, board);
        res.render("nftcontent", { "name": "NFT Content", "board": board });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send('Error updating board.');
      });
  }
});

app.get('/content', (req, res) => {
  console.log(req.query);
  if (req.query.bid) {
    bid = parseInt(req.query.bid);
    console.log(bid);
    Nft.findOne({ id: bid }).then((board) => {
      console.log("Content read success");
      res.render("nftcontent", { "name": "NFT Content", "board": board });
    });
  }
});

app.post('/board', (req, res) => {
  let title = req.body.title;
  let content = req.body.content;
  let url = req.body.url;
  let imageUrl = req.body.imageUrl;
  let password = req.body.password;

  let board = new Nft({
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
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error saving board.');
    });
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});


