const { User, Post, Mood, Comment } = require("../models");
//post user mood
module.exports = function (app) {
  // create a new post
  app.post("/api/posts", function (req, res) {
    Post.create(req.body).then(function (dbPost) {
      res.json(dbPost);
    }).catch(err => {
      res.json({ message: err.message });
    });
  });

  // get all posts by id of a logged in user
  app.get("/:username/posts", function (req, res) {
    // console.log("req.user", req.user)
    // checks to make sure there's req.user data from the login verification and if not sends a 403 forbidden
    if (!req.user) {
      res.sendStatus(403).json({ message: "invalid user" }).redirect("/");
    } else {
      // if there IS req.user data we use that to search for the user's posts by their user id and include the Mood table to also grab mood data for each post
      Post.findAll({
        include: [User, Mood, Comment],
        where: {
          UserId: req.user.id,
        },
        order: [['createdAt', 'DESC']],
        // offset: 5 * 1,
        // limit: 1,
        // subQuery: false,
      }).then((dbPost) => {
        // console.log("dbPost if no posts looks like", dbPost)
          // the data comes back yucky looking so we're looping through and creating new better data
          let dataArr = [];
          const postLoop = function (arr) {
            for (const data of dbPost) {
              const post = data.dataValues
              const mood = post.Mood
              const user = post.User
              const comments = post.Comments
              const commCount = comments.length;
              // console.log("commCount:", commCount)
              // console.log(comments)

              let obj = {
                id: post.id,
                title: post.title,
                body: post.body,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                moodId: mood.id,
                mood: mood.mood,
                color: mood.color,
                userId: user.id,
                username: user.username,
                name: user.name,
                // this was a pain in my ass to figure out
                comments: comments,
                commCount: commCount,
              }
              arr.push(obj);
            }
            return arr;
          }

        const dataArray = postLoop(dataArr);
        
        // console.log("dataArray with new commCount:", dataArray)

          const hbsObj = {
            post: dataArray,
            name: dataArray[0].name,
          }

          res.render("posts", hbsObj)
      }).catch((err) => {
        console.log(err)
        res.redirect(`/${req.user.username}/journal`)
      });
    }
  });

  //Keeley's
  app.get("/:username/journal", function (req, res) {

    if (!req.user) {
      res.sendStatus(403).json({ message: "invalid user" }).redirect("/");
    } else {
      Mood.findAll({
        raw: true
      }).then(dbMood => {
        // console.log(req.user);
        const hbsObj = {
          username: req.user.username,
          id: req.user.id,
          mood: dbMood
        };
        //send to the front end
        res.render("journal", hbsObj);
      }).catch(err => {
        res.json({ message: err.message });
      });
    }
  });
  // find one post by id
  app.get("/api/posts/:id", function (req, res) {
    Post.findOne({
      where: {
        id: req.params.id
      }, include: [User, Mood, Comment]
    }).then(function (dbPost) {
      res.json(dbPost);
    });
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function (req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        username: req.user.username,
        id: req.user.id
      });
    }
  });

  // Route for logging user out
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  // mood routes for now
  app.post("/api/moods", (req, res) => {
    Mood.create(req.body).then(dbMood => {
      res.json(dbMood);
    }).catch(err => {
      res.json({ message: err.message });
    });
  });

  // comment create and update
  app.post("/api/comments", (req, res) => {
    Comment.create(req.body).then(dbComm => {
      // console.log("dbComm", dbComm);
      res.json(dbComm);
    }).catch(err => {
      res.json({ message: err.message });
    });
  });

  app.put("/api/comments/:id", (req, res) => {
    Comment.update(req.body, {
      where: {
        id: req.params.id
      }
    }).then(dbComm => {
      res.json(dbComm);
    }).catch(err => {
      res.json({ message: err.message });
    });
  });
};

