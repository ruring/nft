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
    // password: { type: String }
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
   console.log("gett_data");
  nfts.find().then((board) => {
    res.json(board)
  })
})
app.get('/lists', (req, res) => {
   console.log("get_lists");
  nfts.find().then((boards) => {
 const filteredBoards = boards.filter((board) => board.title && board.title.trim() !== "");
    res.render("nftlists", { name: "NFT Lists", boards: filteredBoards });
  }).catch((err) => {
    console.log(err);
    res.redirect('/');




//	res.render("nftlists", {"name":"NFT Lists", "boards":boards})
  })
})
//app.get('/edit', (req, res) => {
//  console.log('get/edit');
//  if ( req.query.bid ) {
//          bid = parseInt(req.query.bid)
//     nfts.findOne({id:bid}).then((board) => {
//       res.render("nftedit", {"name":"NFT Content", "board":board})
//     })
//  }
//})




app.get('/edit', (req, res) => {
   console.log("get_edit");
  if (req.query.bid) {
    const bid = parseInt(req.query.bid);
    const password = req.query.password; // 비밀번호 입력값 가져오기

    nfts.findOne({ id: bid }).then((board) => {
      if (board) {
        console.log('입력 비밀번호:', password); // 입력받은 비밀번호 로그로 출력
        console.log('DB 비밀번호:', board.password); // DB에 저장된 비밀번호 로그로 출력

        // 비밀번호 비교
        if (password === board.password) {
          // 비밀번호 일치 시, 수정 페이지 렌더링
          res.render("nftedit", { "name": "NFT Content", "board": board });
        } else {
          // 비밀번호 불일치 시, 오류 처리
          res.send('<script>alert("비밀번호가 일치하지 않습니다."); window.history.back();</script>');
        }
      } else {
        // 해당 게시물이 없을 경우 오류 처리
        res.send('<script>alert("게시물을 찾을 수 없습니다."); window.history.back();</script>');
      }
    });
  } else {
    // bid 쿼리 파라미터가 없을 경우 오류 처리
    res.send('<script>alert("올바른 요청이 아닙니다."); window.history.back();</script>');
  }
});





// 비밀번호 저장 라우트 핸들러
app.post('/password', function(req, res) {
   console.log("post_password");
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

//app.post('/edit', (req, res) => {
//        console.log("edit post" + req.body.title + req.body.content)
//  if ( req.query.bid ) {
//          bid = parseInt(req.query.bid)
//          console.log("bid" + bid)
//          nfts.findOneAndUpdate({id:bid},{$set:{title:req.body.title,url:req.body.url,imageUrl:req.body.imageUrl,content:req.body.content}},null).then((board) => {
//          //res.render("content", {"name":"Board Content", "board":board})
//          res.redirect("/content?bid="+bid)
//     })
//  }
//})

app.post('/edit', (req, res) => {
   console.log("post_edit");
  console.log("edit post" + req.body.title + req.body.content)
  if (req.query.bid) {
    const bid = parseInt(req.query.bid);
    const password = req.body.password;

    // 비밀번호 검증 로직
    nfts.findOne({ id: bid }).then((board) => {
      if (board && board.password === password) {
        // 비밀번호 일치 시 업데이트 로직 실행
        nfts.findOneAndUpdate(
          { id: bid },
          {
            $set: {
              title: req.body.title,
              url: req.body.url,
              imageUrl: req.body.imageUrl,
              content: req.body.content,
            },
          },
          null
        ).then(() => {
          res.redirect("/content?bid=" + bid);
        });
      } else {
        // 비밀번호 불일치 시 오류 처리
        res.send('<script>alert("비밀번호가 일치하지 않습니다."); window.history.back();</script>');
      }
    });
  }
});






app.post('/comment', (req, res) => {
   console.log("post_delcomm");
        console.log("comment post" + req.query.bid + req.body.comment)
  if ( req.query.bid ) {
          bid = parseInt(req.query.bid)
          console.log("bid" + bid + " cid=" + req.query.cid)
          nfts.findOneAndUpdate({id:bid},{$push:{comments:req.body.comment}},{new:true}).then((board) => {
          //res.render("content", {"name":"Board Content", "boardboard":board})
          res.redirect("/content?bid="+bid)
     })
  }
})
app.get('/delcomm', (req, res) => {
   console.log("get_delcomm");
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
   console.log("get_like add");
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
   console.log("get_board");
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
   console.log("post_board");
   const title = req.body.title
   const content = req.body.content
   const url = req.body.url
   const imageUrl = req.body.imageUrl
   const password1 = req.body.password;
   console.log('입력 타이틀:', title); // 입력받은 비밀번호 로그로 출력
   console.log('입력 비밀번호:', password1); // 입력받은 비밀번호 로그로 출력
   const boards = new nfts({
         id : ++bid,
         title: title,
         url: url,
         imageUrl: imageUrl,
         content: content,
	 password: password1 
  })
   boards.save()
                .then(()=>res.redirect("/lists"))
                .catch((err)=>res.json(req.body))
})

app.post('/delete', (req, res) => {
      console.log('post_delete.');
  const { bid, password } = req.body;

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
      console.log('get_delete.');
  const bid = req.query.bid;
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
