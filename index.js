var treeify = require('treeify').asTree
var request = require('request')
var async = require('async')
var jquery = require('jquery')
var jsdom = require('jsdom')

var query = 'Cryptography'
var urlPrefix = 'http://en.wikipedia.org/wiki/'


async.waterfall([
  bind(requestArticle, query),
  bind(parseArticle),
], function(err, result){
  if (err) throw err
  console.log(treeify(result, true))
})

function requestArticle(articleName, cb) {
  // var fs = require('fs')
  // fs.readFile('./crypto.html', function(err, result){
  //   cb(null, result.toString())
  // })
  request({
    url: urlPrefix + articleName
  }, function(err, res, body) {
    var error = err || (res.statusCode != 200 ? res.statusCode : false)
    if (error) return cb(error, null)
      console.log(body)
    cb(null, body)
  })
}

function parseArticle(html, cb) {
  var env = jsdom.env
  var $ = undefined

  env(html, function (err, window) {
    if (err) cb(err)
    $ = jquery(window)
    async.map($('#toc > ul > li'), buildSection, cb)
  })

  function buildSection(element, cb) {
    var section = {}
    section.title = $('> a > .toctext', element).text()
    section.number = $('> a > .tocnumber', element).text()
    section.body = getSectionBody(element)
    async.map($('> ul > li', element), buildSection, function(err, results){
      if (err) return cb(err)
      section.children = results
      cb(null, section)
    })
  }

  function getSectionBody(element){
    var sectionId = $('a', element).attr('href')
    var content = ''
    $(sectionId)
      .parent()
      .nextUntil(':header')
      .each(function(index, element){
        content += $(element).html()
      })
    return content
  }
}

// util

function bind(fn) {
  var boundArgs = [].slice.call(arguments, 1)
  return function(){
    var newArgs = [].slice.call(arguments)
    var finalArgs = [].concat.apply(boundArgs, newArgs)
    return fn.apply(null, finalArgs)
  }
}