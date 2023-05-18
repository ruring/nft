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

const Image = mongoose.model('Image', {
  imageUrl: String,
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
        console.log("com 3");
          res.redirect("/content?bid=" + bid );
          //res.redirect("/content?bid=" + bid +"&password=" + password);
        });
      } else {
        res.send('<script>alert("비밀번호가 일치하지 않습니다."); window.history.back();</script>');
      }
    });
  }
});

const Board = mongoose.model('Board', board_schema);

//app.get('/api/images', async (req, res) => {
//  try {
//    const nft = await nfts.findOne({ id: bid });
//    const imageUrls = [nft.imageUrl];
//    res.json(imageUrls); // 이미지 URL을 JSON 형태로 응답 보내기
//  } catch (error) {
//    console.error(error);
//    res.status(500).send('내부 서버 오류'); // 서버 오류 응답 보내기
//  }
//});

app.get('/api/imagess', async (req, res) => {
  try {

        console.log("images1");
    const bid = req.query.bid;
    if (bid) {
        console.log("images2");
      const nft = await nfts.findOne({ id: bid });
        console.log("nft: "+nft);
      const imageUrls = [nft.imageUrl];
        console.log("nft: "+imageUrls);
      res.json(imageUrls); // 이미지 URL을 JSON 형태로 응답 보내기
    } else {
      res.status(400).send('bid 파라미터를 제공해야 합니다.'); // 요청에 bid 파라미터가 없는 경우 에러 응답 보내기
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('내부 서버 오류'); // 서버 오류 응답 보내기
  }
});

app.get('/api/imagesss', async (req, res) => {
  try {
    const nfts = await nfts.find({}, 'imageUrl');
    const imageUrls = nfts.map(nft => nft.imageUrl);
    res.json(imageUrls); // 이미지 URL들을 JSON 형태로 응답 보내기
  } catch (error) {
    console.error(error);
    res.status(500).send('내부 서버 오류'); // 서버 오류 응답 보내기
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const nftList = await nfts.find({}, 'imageUrl');
    const imageUrls = nftList.map(nft => nft.imageUrl);
    res.json(imageUrls); // 이미지 URL들을 JSON 형태로 응답 보내기
  } catch (error) {
    console.error(error);
    res.status(500).send('내부 서버 오류'); // 서버 오류 응답 보내기
  }
});


app.get('/content', (req, res) => {
  if (req.query.bid){
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
        console.log("com 1");
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
        console.log("com 2");
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


app.get('/delete', (req, res) => {
  if (req.query.bid) {
    const bid = parseInt(req.query.bid);
    const password = req.query.password;

    nfts.findOne({ id: bid }).then((board) => {
   console.log("#delete get: "+ board.password + ", " + password);
      if (board && board.password === password) {
   console.log("#delete OK 1");
        nfts.findOneAndDelete({ id: bid }).then(() => {
   console.log("#delete OK 2");
          res.redirect("/lists");
        }).catch((error) => {
          console.error(error);
          res.status(500).send("게시물 삭제에 실패했습니다.");
        });
      } else {
        res.status(401).send("잘못된 비밀번호입니다. 접근이 거부되었습니다.");
      }
    }).catch((error) => {
      console.error(error);
      res.status(500).send("게시물을 찾는데 실패했습니다.");
    });
  } else {
    res.status(400).send("잘못된 요청입니다. 'bid' 매개변수가 누락되었습니다.");
  }
});

app.post('/delete', (req, res) => {
  if (req.body.bid && req.body.password) {
    const bid = parseInt(req.body.bid);
    const password = req.body.password;

    nfts.findOne({ id: bid }).then((board) => {
   console.log("#delete post : "+ board.password + ", " + password);
      if (board.password === password) {
        nfts.findOneAndDelete({ id: bid }).then(() => {
          res.redirect("/lists");
        }).catch((error) => {
          console.error(error);
          res.status(500).send("게시글 삭제에 실패했습니다.");
        });
      } else {
        res.status(401).send("잘못된 비밀번호입니다. 접근이 거부되었습니다.");
      }
    }).catch((error) => {
      console.error(error);
      res.status(500).send("게시글을 찾는데 실패했습니다.");
    });
  } else {
    res.status(400).send("잘못된 요청입니다. 'bid' 또는 'password' 매개변수가 누락되었습니다.");
  }
});







app.get('/like', (req, res) => {
   console.log("#get_like add");
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid)
          nfts.findOneAndUpdate({id:bid},{$inc:{likeCount:1}},{new:true})
             .then( function(board) {
                console.log(" like update success. bid" + bid + board)
                res.render("nftcontent", {"name":"NFT Content", "board":board})
             })
  }
})

var server = app.listen(8080, function() {});
                console.log(" start")
