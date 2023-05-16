var express = require('express');
var app = express();
var mongoose = require('mongoose');
var url = 'mongodb://localhost/BoardsDB';
var str = "";

mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Successfully connected to mongodb'))
  .catch(e => console.error(e));

const passwordSchema = new mongoose.Schema({
  password: { type: String }
});

const Password = mongoose.model('Password', passwordSchema);
const connection = mongoose.connection
connection.on('error', console.error)
connection.once('open', () => {
  console.log('Connected to mongod server')
})
const board_schema = new mongoose.Schema({
        id: {type: Number, default: 0},
     title: { type: String },
     url: { type: String },
     imageUrl: { type: String },
     content: { type: String },
     likeCount: { type: Number, default: 0 },
     createdAt: { type: Date, default: Date.now },
     comments: { type : Array , "default" : [] }
},{
     versionKey: false
})
var bid = 0;
const nfts = mongoose.model('nfts', board_schema);
nfts.findOne({},{},{sort:{'_id':-1}})
  .then(function(post){
        console.log(post.id);
        bid = post.id
  }).catch(function(post){
        console.log("board is empty");
        bid = 0
});
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
const ejs = require('ejs');
app.set('view engine', 'ejs');
app.set('views', './views');
app.get('/',function(req, res) {
        res.send("Hi");
});
app.get('/data', (req, res) => {
  nfts.find().then((board) => {
    res.json(board)
  })
})
app.get('/lists', (req, res) => {
  nfts.find().then((boards) => {
 const filteredBoards = boards.filter((board) => board.title && board.title.trim() !== "");
    res.render("nftlists", { name: "NFT Lists", boards: filteredBoards });
  }).catch((err) => {
    console.log(err);
    res.redirect('/');




//	res.render("nftlists", {"name":"NFT Lists", "boards":boards})
  })
})
app.get('/edit', (req, res) => {
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
     nfts.findOne({id:bid}).then((board) => {
       res.render("nftedit", {"name":"NFT Content", "board":board})
     })
  }
})

// 비밀번호 저장 라우트 핸들러
app.post('/password', function(req, res) {
  console.log('비밀번호');
  const { password } = req.body;
  console.log('사용자가 입력한 비밀번호:', password);
  const newPassword = new Password({ password });

  newPassword.save()
    .then(() => {
      // 비밀번호 저장 성공
      console.log('비밀번호 저장에 성공했습니다.');
      res.redirect('/');
    })
    .catch((err) => {
      // 비밀번호 저장 실패
      console.error('비밀번호 저장에 실패했습니다.', err);
      res.redirect('/');
    });
});

app.post('/edit', (req, res) => {
        console.log("edit post" + req.body.title + req.body.content)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid)
          nfts.findOneAndUpdate({id:bid},{$set:{title:req.body.title,url:req.body.url,imageUrl:req.body.imageUrl,content:req.body.content}},null).then((board) => {
          //res.render("content", {"name":"Board Content", "board":board})
          res.redirect("/content?bid="+bid)
     })
  }
})
app.post('/comment', (req, res) => {
        console.log("comment post" + req.query.bid + req.body.comment)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid + " cid=" + req.query.cid)
          nfts.findOneAndUpdate({id:bid},{$push:{comments:req.body.comment}},{new:true}).then((board) => {
          //res.render("content", {"name":"Board Content", "board":board})
          res.redirect("/content?bid="+bid)
     })
  }
})
app.get('/delcomm', (req, res) => {
        console.log("delete comment " + req.query.bid + req.query.cid)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid + " cid=" + req.query.cid)
          nfts.findOneAndUpdate({id:bid},{$pull:{comments:req.query.cid}},{new:true}).then((board) => {
          //res.render("content", {"name":"Board Content", "board":board})
          res.redirect("/content?bid="+bid)
     })
  }
})
app.get('/like', (req, res) => {
        console.log("like add")
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
app.get('/content', (req, res) => {
        console.log(req.query)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
        console.log(bid)
     nfts.findOne({id:bid}).then((board) => {
             console.log("content read good");
       res.render("nftcontent", {"name":"NFT Content", "board":board})
     })
  }
})
app.post('/board', (req, res) => {
   console.log("board");
   const title = req.body.title
   const content = req.body.content
   const url = req.body.url
   const imageUrl = req.body.imageUrl
   const password = req.body.password;
   const boards = new nfts({
         id : ++bid,
         title: title,
         url: url,
         imageUrl: imageUrl,
         content: content,
	 password: password 
  })
   boards.save()
                .then(()=>res.redirect("/lists"))
                .catch((err)=>res.json(req.body))
})

app.post('/delete', (req, res) => {
  const { bid, password } = req.body;

      console.log('post/delete.');
  // 비밀번호 확인 로직
  nfts.findOne({ id: bid, password: password })
    .then((board) => {
      if (!board) {
        // 비밀번호가 일치하지 않는 경우
        console.log('비밀번호가 일치하지 않습니다.');
        res.redirect('/'); // 비밀번호가 일치하지 않을 때의 처리를 구현해야 합니다.
      } else {
        // 비밀번호가 일치하는 경우, 해당 데이터 삭제
        nfts.findOneAndDelete({ id: bid })
          .then(() => {
            console.log('데이터를 성공적으로 삭제했습니다.');
            res.redirect('/lists'); // 삭제 후 리다이렉트할 경로를 설정해야 합니다.
          })
          .catch((error) => {
            console.error('데이터 삭제 중 에러가 발생했습니다.', error);
            res.redirect('/'); // 삭제 중 에러 발생 시의 처리를 구현해야 합니다.
          });
      }
    })
    .catch((error) => {
      console.error('비밀번호 확인 중 에러가 발생했습니다.', error);
      res.redirect('/'); // 비밀번호 확인 중 에러 발생 시의 처리를 구현해야 합니다.
    });
});

app.get('/delete', (req, res) => {
  const bid = req.query.bid;
  
      console.log('get/delete.');
  // 삭제 로직 구현
  nfts.findOneAndDelete({ id: bid })
    .then(() => {
      console.log('데이터를 성공적으로 삭제했습니다.');
      res.redirect('/lists'); // 삭제 후 리다이렉트할 경로를 설정해야 합니다.
    })
    .catch((error) => {
      console.error('데이터 삭제 중 에러가 발생했습니다.', error);
      res.redirect('/'); // 삭제 중 에러 발생 시의 처리를 구현해야 합니다.
    });
});







console.log("TEST");
var server = app.listen(8080, function() {});
