/*global describe,it*/

var _ = require('lodash')
var promise = require('bluebird')
var expect = require('chai').expect
var utils = require('./TestUtils')

describe('Basic rendering', function() {
  this.timeout(10000)
  utils.setupTestServers(3)
 
  it('Returns correct HTML', function(done) {
    utils.requestTestPage('simpleTest.html').then(function(response) {
      expect(response.status).to.equal(200)
      expect(response.body).to.contain('Async content loaded!')
      expect(response.body).not.to.contain('Loading')
    }).finally(done)
  })

   it('Strips script tags', function(done) {
    utils.requestTestPage('simpleTest.html').then(function(response) {
      expect(response.body).to.not.contain('<script>')
    }).finally(done)
  })

  it('Starts up three PhantomJS threads', function(done) {
    utils.requestThreadInfo().then(function(info) {
      expect(info.length).to.equal(3)
    }).finally(done)
  })

  it('Supports hashbang URLs', function(done) {
    utils.requestTestPage('simpleTest.html#!/hashtest').then(function(response) {
      expect(response.body).to.contain('Hash #!/hashtest')
    }).finally(done)
  })
})

describe('Status codes', function() {
  this.timeout(10000)
  utils.setupTestServers(1)
 
  it('Sets the response status code from window.crudivore.status variable', function(done) {
    utils.requestTestPage('simpleTest.html#!/notfound').then(function(response) {
      expect(response.status).to.equal(404)
    }).finally(done)
  })

  it('Sets the response header from window.crudivore.headers object', function(done) {
    utils.requestTestPage('simpleTest.html#!/redirect').then(function(response) {
      expect(response.status).to.equal(302)
      expect(response.headers.location).to.equal('http://google.com')
    }).finally(done)
  })

  it('Starts up only one PhantomJS thread', function(done) {
    utils.requestThreadInfo().then(function(info) {
      expect(info.length).to.equal(1)
    }).finally(done)
  })

})

describe('Concurrent requests', function() {
  this.timeout(10000)
  utils.setupTestServers()
 
  it('Returns correct HTML', function(done) {
    promise.all([utils.requestTestPage('simpleTest.html'), utils.requestTestPage('simpleTest.html')])
    .then(function(responses) {
      expect(responses.length).to.equal(2)
      _.each(responses, function(response) {
        expect(response.status).to.equal(200)
        expect(response.body).to.contain('Async content loaded!')
      })
    }).finally(done)
  })

  it('Starts up another PhantomJS thread', function(done) {
    utils.requestThreadInfo().then(function(info) {
      expect(info.length).to.equal(2)
    }).finally(done)
  })
})

describe('Error handling', function() {
  this.timeout(10000)
  utils.setupTestServers(1)

  it('Shows 404 when requested page does not exist', function(done) {
    utils.requestTestPage('thisDoesNotExist.html').then(function(response) {
      expect(response.status).to.equal(404)
    }).finally(done)
  })
})

describe('PhantomJS crash', function() {
  this.timeout(10000)
  utils.setupTestServers(1)

  it('Survives crash', function(done) {
    utils.requestTestPage('timeoutTest.html').then(function(response) {
      expect(response.status).to.equal(200)
      expect(response.body).to.contain('Timeout test')
    }).finally(done)

    killPhantomJS() // While the test is requesting the page, kill only PhantomJS instance
  })

  function killPhantomJS() {
    utils.requestThreadInfo().then(function(info) {
      if (info.length !== 1) throw 'More than one PhantomJS worker running: ' + info.length
      process.kill(info[0].pid)
    })
  }
})
