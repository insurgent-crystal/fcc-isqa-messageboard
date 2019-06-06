'use strict'

const expect      = require('chai').expect
const mongodb     = require('mongodb')
const MongoClient = require('mongodb').MongoClient
const ObjectId    = require('mongodb').ObjectID
const bcrypt      = require('bcrypt')

const SALT = 12
const connection = MongoClient.connect(process.env.DATABASE, {useNewUrlParser: true})

module.exports = app => {
  
  app.route('/api/threads/:board')
    
    //Get 10 most recent threads
    .get((req, res) => {
      const board = req.params.board
      
      connection.then(client => {
        const db = client.db('imageboard')
          
        db.collection('threads')
          .find({
            board: board
          })
          .sort({
            bumped_on: -1
          })
          .toArray()
          .then(threadData => {
          //reply reply reply reply reply reply reply reply
          
          let replyIDs = []
          threadData.forEach(thread => thread.replies.slice(-3).forEach(id => replyIDs.push(id)))
          
          db.collection('replies')
            .find({
              reply_id: {$in: replyIDs},
              board: board
            })
            .sort({
              created_on: 1
            })
            .toArray()
            .then(replyData => {
              let resultObject = []
              
              threadData.forEach(thread => {
                resultObject.push({
                  thread_id  : thread.thread_id,
                  text       : thread.text,
                  created_on : thread.created_on,
                  bumped_on  : thread.bumped_on,
                  replies    : replyData
                    .filter(reply => reply.thread === thread.thread_id)
                    .map(reply => ({
                      reply_id   : reply.reply_id,
                      text       : reply.text,
                      created_on : reply.created_on,
                    })),
                  replycount: thread.replycount
                })                
              })
              
              // console.log(`Get request for "/${board}/"`)
              return res.json(resultObject)              
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
          
          //reply reply reply reply reply reply reply reply end
          })
          .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
      })
      .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('Database connection error')
        })
    })
  
    //Starting new thread
    .post((req, res) => {
      const board    = req.params.board
      const text     = req.body.text
      const password = req.body.delete_password
      
      if (board && text && password) {
        
        connection.then(client => {
          const db = client.db('imageboard')
          
          db.collection('counters')
            .findOneAndUpdate({
              board: board
            }, {
              $set: {board: board},
              $inc: {counter: 1}
            }, {
              upsert: true
            })
            .then(countersData => {
            //thread thread thread thread thread thread thread thread
          
            db.collection('threads')
              .insertOne({
                thread_id       : countersData.value ? countersData.value.counter + 1 : 1,
                board           : board,
                text            : text,
                created_on      : new Date(),
                bumped_on       : new Date(),
                reported        : false,
                delete_password : bcrypt.hashSync(password, SALT),
                replycount      : 0,
                replies         : []
              })
              .then(threadData => {
                console.log(`New thread at /${board}/${threadData.ops[0].thread_id}`)
                return res.redirect(`/${board}/`)
              })
              .catch(error => {
                console.log('Database error: ' + error)
                return res.type('text').send('Couldn\'t start new thread')
              })
            
            //thread thread thread thread thread thread thread thread end
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('Database connection error')
        })
        
      } else {
        return res.type('text').send('Fill all required fields')
      }
    })
    
    //Reporting thread
    .put((req, res) => {
      const board  = req.params.board
      const thread = parseInt(req.body.thread_id)
      
      if (board && thread) {
        
        connection.then(client => {
          const db = client.db('imageboard')
          
          db.collection('threads')
            .findOneAndUpdate({
              thread_id : thread,
              board     : board
            }, {
              $set: {reported: true}
            })
            .then(data => {
              if (data.value === null) {
                return res.type('text').send('nothing was found')
              }
              console.log(`Thread "/${board}/${thread}" is reported`)
              return res.type('text').send('success')
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('Database connection error')
        })
        
      } else {
        return res.type('text').send('Fill all required fields')
      }
    })
  
    //Deletes thread and all replies
    .delete((req, res) => {
      const board    = req.params.board
      const thread   = parseInt(req.body.thread_id)
      const password = req.body.delete_password
      
      if (board && thread && password) {
        
        connection.then(client => {
          const db = client.db('imageboard')
          
          db.collection('threads')
            .findOne({
              thread_id : thread,
              board     : board
            })
            .then(data => {
            //check pass check pass check pass check pass 
            if (data === null) {
              return res.type('text').send('no thread with such id')
            }
            
            if (bcrypt.compareSync(password, data.delete_password)) {
            //delete thread delete thread delete thread delete thread 
            
            db.collection('threads')
              .findOneAndDelete({
                thread_id : thread,
                board     : board
              })
              .then(() => {
              //detele replies detele replies detele replies 
              
              db.collection('replies')
                .deleteMany({
                  thread : thread,
                  board  : board
                })
                .then(() => {
                  console.log(`Thread "/${board}/${thread}" is deleted`)
                  return res.type('text').send('success')
                })
                .catch(error => {
                  console.log('Database error: ' + error)
                  return res.type('text').send('Database error')
                })
              
              //detele replies detele replies detele replies end
              })
              .catch(error => {
                console.log('Database error: ' + error)
                return res.type('text').send('Database error')
              })
            
            //delete thread delete thread delete thread delete thread end
            } else {
              return res.type('text').send('incorrect password')
            }
            
            //check pass check pass check pass check pass end
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('Database connection error')
        })
        
      } else {
        return res.type('text').send('Fill all required fields')
      }
    })
    
  
  app.route('/api/replies/:board')
    
    //Get thread and all replies
    .get((req, res) => {
      const board  = req.params.board
      const thread = parseInt(req.query.thread_id)
      
      if (board && thread) {
        
        connection.then(client => {
          const db = client.db('imageboard')

          db.collection('threads')
            .findOne({
              thread_id : thread,
              board     : board
            })
            .then(threadData => {
            //reply reply reply reply reply reply reply reply
            
            db.collection('replies')
              .find({
                thread : thread,
                board  : board
              })
              .sort({
                created_on: 1
              })
              .toArray()
              .then(replyData => {
                
                const resultData = {
                  thread_id  : threadData.thread_id,
                  text       : threadData.text,
                  created_on : threadData.created_on,
                  bumped_on  : threadData.bumped_on,
                  replies    : replyData.map(reply => ({
                    reply_id   : reply.reply_id,
                    text       : reply.text,
                    created_on : reply.created_on
                  }))
                }
                
                // console.log(`Get request for "/${board}/${thread}"`)
                return res.json(resultData)  
                
              })
              .catch(error => {
                console.log('Database error: ' + error)
                return res.type('text').send('Database error')
              })

            //reply reply reply reply reply reply reply reply end
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('Database connection error')
        })
        
      } else {
        return res.type('text').send('Missing queries')
      }
    })
  
    //Reply to thread
    .post((req, res) => {
      const board    = req.params.board
      const thread   = parseInt(req.body.thread_id)
      const text     = req.body.text
      const password = req.body.delete_password
      
      if (board && thread && text && password) {
        
        connection.then(client => {
          const db = client.db('imageboard')
          
          db.collection('counters')
            .findOneAndUpdate({
              board: board
            }, {
              $set: {board: board},
              $inc: {counter: 1}
            }, {
              upsert: true
            })
            .then(countersData => {
            //thread thread thread thread thread thread thread thread
          
            db.collection('threads')
              .findOneAndUpdate({
                thread_id : thread,
                board     : board
              }, {
                $push : {replies: countersData.value.counter + 1},
                $inc  : {replycount: 1},
                $set  : {bumped_on: new Date()}
              })
              .then(threadData => {
              //reply reply reply reply reply reply reply reply
              
              db.collection('replies')
                .insertOne({
                  reply_id        : countersData.value.counter + 1,
                  board           : board,
                  thread          : thread,
                  text            : text,
                  created_on      : new Date(),
                  reported        : false,
                  delete_password : bcrypt.hashSync(password, SALT) 
                })
                .then(replyData => {
                  console.log(`New reply "${replyData.ops[0].reply_id}" in thread "/${board}/${thread}"`)
                  return res.redirect(`/${board}/${thread}`)
                })
                .catch(error => {
                  console.log('Database error: ' + error)
                  return res.type('text').send('Couldn\'t add reply')
                })
              
              //reply reply reply reply reply reply reply reply end
              })
              .catch(error => {
                console.log('Database error: ' + error)
                return res.type('text').send('Database error')
              })
            
            //thread thread thread thread thread thread thread thread end
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('Database connection error')
        })
        
      } else {
        return res.type('text').send('Fill all required fields')
      }
    })
  
    //Report reply
    .put((req, res) => {
      const board  = req.params.board
      const thread = parseInt(req.body.thread_id)
      const reply  = parseInt(req.body.reply_id)
      
      if (board && thread && reply) {
        
        connection.then(client => {
          const db = client.db('imageboard')
          
          db.collection('replies')
            .findOneAndUpdate({
              reply_id : reply,
              thread   : thread,
              board    : board
            }, {
              $set: {reported: true}
            })
            .then(data => {
              if (data.value === null) {
                return res.type('text').send('nothing was found')
              }
              
              console.log(`Reply "${reply}" at "/${board}/${thread}" is reported`)
              return res.type('text').send('success')
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('Database connection error')
        })
        
      } else {
        return res.type('text').send('Fill all required fields')
      }
    })
  
    //Delete reply
    .delete((req, res) => {
      const board    = req.params.board
      const thread   = parseInt(req.body.thread_id)
      const reply    = parseInt(req.body.reply_id)
      const password = req.body.delete_password
      
      if (board && thread && reply && password) {
        
        connection.then(client => {
          const db = client.db('imageboard')
          
          db.collection('replies')
            .findOne({
              reply_id : reply,
              thread   : thread,
              board    : board
            })
            .then(data => {
            //check pass check pass check pass check pass 
            if (data === null) {
              return res.type('text').send('no reply with such id')
            }
            
            if (bcrypt.compareSync(password, data.delete_password)) {
            //delete reply delete reply delete reply delete reply 
            
            db.collection('replies')
              .findOneAndDelete({
                reply_id : reply,
                thread   : thread,
                board    : board
              })
              .then(() => {
              //update thread doc update thread doc update thread doc
              
              db.collection('threads')
                .findOneAndUpdate({
                  thread_id : thread,
                  board     : board
                }, {
                  $inc  : {replycount: -1},
                  $pull : {replies: reply}
                })
                .then(() => {            
                  console.log(`Reply "${reply}" at "/${board}/${thread}" is deleted`)
                  return res.type('text').send('success')
                })
                .catch(error => {
                  console.log('Database error: ' + error)
                  return res.type('text').send('Database error')
                })
              
              //update thread doc update thread doc update thread doc end
              })
              .catch(error => {
                console.log('Database error: ' + error)
                return res.type('text').send('Database error')
              })
            
            //delete reply delete reply delete reply delete reply end 
            } else {
              return res.type('text').send('incorrect password')
            }
            
            //check pass check pass check pass check pass end
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('Database error')
            })
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('Database connection error')
        })
        
      } else {
        return res.type('text').send('Fill all required fields')
      }
    })

}
