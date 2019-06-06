const chaiHttp = require('chai-http')
const chai     = require('chai')
const assert   = chai.assert
const server   = require('../server')

chai.use(chaiHttp)

suite('Functional Tests', () => {

  suite('API ROUTING FOR /api/threads/:board', () => {
    
    suite('POST', () => {
      
      test('Start new thread in /test/', done => {
        const unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
              assert.isTrue(getRes.text.includes(unique))
                
              done()
            })
          })
      }).timeout(5000)
      
      test('Start new thread in /test/, but not send enough data', done => {
        const unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            random: 'shit'
          })
          .end((err, res) => {
            assert.equal(res.text, 'Fill all required fields')
          
            done()
          })
      }).timeout(5000)
      
    })
    
    suite('PUT', () => {
      
      test('Report thread', done => {
        const unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
            
            chai.request(server)
              .put('/api/threads/test')
              .send({
                thread_id: getRes.body.filter(thread => thread.text.includes(unique))[0].thread_id
              })
              .end((err, putRes) => {
                assert.equal(putRes.text, 'success')
                
                done()
              })
            })
          })
      }).timeout(5000)
      
      test('Report thread, but not send enough data', done => {
        const unique = Math.random()
        
        chai.request(server)
          .put('/api/threads/test')
          .send({
            random: 'shit'
          })
          .end((err, res) => {
            assert.equal(res.text, 'Fill all required fields')
          
            done()
          })
      }).timeout(5000)
      
    })
    
    suite('GET', () => {
      
      test('Get an array of the most recent 10 bumped threads', done => {
        const unique = Math.random()
        
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            assert.isDefined(res.body)
            assert.isAtLeast(res.body.length, 2) //after tests above the response should have at least 2 threads 
          
            done()
          })
      }).timeout(5000)
      
    })
    
    suite('DELETE', () => {
      
      test('Delete thread, correct password', done => {
        const unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
            
            chai.request(server)
              .delete('/api/threads/test')
              .send({
                thread_id       : getRes.body.filter(thread => thread.text.includes(unique))[0].thread_id,
                delete_password : 'admin'
              })
              .end((err, delRes) => {
                assert.equal(delRes.text, 'success')
                
                done()
              })
            })
          })
      }).timeout(5000)
      
      test('Delete thread, incorrect password', done => {
        const unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
            
            chai.request(server)
              .delete('/api/threads/test')
              .send({
                thread_id       : getRes.body.filter(thread => thread.text.includes(unique))[0].thread_id,
                delete_password : 'qwerty'
              })
              .end((err, delRes) => {
                assert.equal(delRes.text, 'incorrect password')
                
                done()
              })
            })
          })
      }).timeout(5000)
      
      test('Delete thread, but not send enough data', done => {
        const unique = Math.random()
        
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            random: 'shit'
          })
          .end((err, res) => {
            assert.equal(res.text, 'Fill all required fields')
          
            done()
          })
      }).timeout(5000)
      
    })    

  })
  
  suite('API ROUTING FOR /api/replies/:board', () => {
    
    suite('POST', () => {
      
      test('Reply to thread in /test/', done => {
        const unique = Math.random()
        const r_unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
            
            const threadID = getRes.body.filter(thread => thread.text.includes(unique))[0].thread_id
            
            chai.request(server)
              .post('/api/replies/test')
              .send({
                thread_id       : threadID,
                text            : 'REPLYING REPLYING ' + r_unique,
                delete_password : 'admin'
              })
              .end((err, replyPostRes) => {
              
              chai.request(server)
                .get('/api/replies/test')
                .query({
                  thread_id: threadID
                })
                .end((err, replyGetRes) => {
                  assert.isTrue(replyGetRes.text.includes(r_unique))
                
                  done()
                })
              
              })
            })
          })
      }).timeout(5000)
      
      test('Reply to thread in /test/, but not send enough data', done => {
        const unique = Math.random()
        
        chai.request(server)
          .post('/api/replies/test')
          .send({
            random: 'shit'
          })
          .end((err, res) => {
            assert.equal(res.text, 'Fill all required fields')
          
            done()
          })
      }).timeout(5000)
      
    })
    
    suite('PUT', () => {
      
      test('Report reply', done => {
        const unique = Math.random()
        const r_unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
            
            const threadID = getRes.body.filter(thread => thread.text.includes(unique))[0].thread_id
            
            chai.request(server)
              .post('/api/replies/test')
              .send({
                thread_id       : threadID,
                text            : 'REPLYING REPLYING ' + r_unique,
                delete_password : 'admin'
              })
              .end((err, replyPostRes) => {
              
              chai.request(server)
                .get('/api/replies/test')
                .query({
                  thread_id: threadID
                })
                .end((err, replyGetRes) => {
                
                chai.request(server)
                  .put('/api/replies/test')
                  .send({
                    thread_id : threadID,
                    reply_id  : replyGetRes.body.replies.filter(reply => reply.text.includes(r_unique))[0].reply_id
                  })
                  .end((err, replyPutRes) => {
                    assert.equal(replyPutRes.text, 'success')
                    
                    done()
                  })
                })
              })
            })
          })
      }).timeout(5000)
      
      test('Report reply, but not send enough data', done => {
        const unique = Math.random()
        
        chai.request(server)
          .put('/api/replies/test')
          .send({
            random: 'shit'
          })
          .end((err, res) => {
            assert.equal(res.text, 'Fill all required fields')
          
            done()
          })
      }).timeout(5000)
      
    })
    
    suite('GET', () => {
      
      test('Get thread with all replies', done => {
        const unique = Math.random()
        const r_unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
            
            const threadID = getRes.body.filter(thread => thread.text.includes(unique))[0].thread_id
            
            chai.request(server)
              .post('/api/replies/test')
              .send({
                thread_id       : threadID,
                text            : 'REPLYING REPLYING ' + r_unique,
                delete_password : 'admin'
              })
              .end((err, replyPostRes) => {
                
                chai.request(server)
                  .get('/api/replies/test')
                  .query({
                    thread_id: threadID
                  })
                  .end((err, replyGetRes) => {
                    assert.isDefined(replyGetRes.body)
                    assert.isDefined(replyGetRes.body.replies)
                    assert.isAtLeast(replyGetRes.body.replies.length, 1)

                    done()
                  })
                
              })
            })
          })
      }).timeout(5000)
        
    })
    
    suite('DELETE', () => {
      
      test('Delete reply, correct password', done => {
        const unique = Math.random()
        const r_unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
            
            const threadID = getRes.body.filter(thread => thread.text.includes(unique))[0].thread_id
            
            chai.request(server)
              .post('/api/replies/test')
              .send({
                thread_id       : threadID,
                text            : 'REPLYING REPLYING ' + r_unique,
                delete_password : 'admin'
              })
              .end((err, replyPostRes) => {
              
              chai.request(server)
                .get('/api/replies/test')
                .query({
                  thread_id: threadID
                })
                .end((err, replyGetRes) => {
                
                chai.request(server)
                  .delete('/api/replies/test')
                  .send({
                    thread_id       : threadID,
                    reply_id        : replyGetRes.body.replies.filter(reply => reply.text.includes(r_unique))[0].reply_id,
                    delete_password : 'admin'
                  })
                  .end((err, replyDelRes) => {
                    assert.equal(replyDelRes.text, 'success')
                    
                    done()
                  })
                })
              })
            })
          })
      }).timeout(5000)
      
      test('Delete reply, incorrect password', done => {
        const unique = Math.random()
        const r_unique = Math.random()
        
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text            : 'TESTING TESTING ' + unique,
            delete_password : 'admin'
          })
          .end((err, postRes) => {
          
          chai.request(server)
            .get('/api/threads/test')
            .end((err, getRes) => {
            
            const threadID = getRes.body.filter(thread => thread.text.includes(unique))[0].thread_id
            
            chai.request(server)
              .post('/api/replies/test')
              .send({
                thread_id       : threadID,
                text            : 'REPLYING REPLYING ' + r_unique,
                delete_password : 'admin'
              })
              .end((err, replyPostRes) => {
              
              chai.request(server)
                .get('/api/replies/test')
                .query({
                  thread_id: threadID
                })
                .end((err, replyGetRes) => {
                
                chai.request(server)
                  .delete('/api/replies/test')
                  .send({
                    thread_id       : threadID,
                    reply_id        : replyGetRes.body.replies.filter(reply => reply.text.includes(r_unique))[0].reply_id,
                    delete_password : 'bruteforce'
                  })
                  .end((err, replyDelRes) => {
                    assert.equal(replyDelRes.text, 'incorrect password')
                    
                    done()
                  })
                })
              })
            })
          })
      }).timeout(5000)
      
      test('Delete reply, but not send enough data', done => {
        const unique = Math.random()
        
        chai.request(server)
          .delete('/api/replies/test')
          .send({
            random: 'shit'
          })
          .end((err, res) => {
            assert.equal(res.text, 'Fill all required fields')
          
            done()
          })
      }).timeout(5000)
      
    })
    
  })

})
