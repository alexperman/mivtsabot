var request = require('request')

function FBMessenger (token, notification_type) {
  this.token = token
  this.notification_type = notification_type || 'REGULAR'
}

FBMessenger.prototype.sendTextMessage = function (id, text, notification_type, cb) {
  var messageData = {
    text: text
  }
  this.sendMessage(id, messageData, notification_type, cb)
}

FBMessenger.prototype.sendImageMessage = function (id, imageURL, notification_type, cb) {
  var messageData = {
    'attachment': {
      'type': 'image',
      'payload': {
        'url': imageURL
      }
    }
  }
  this.sendMessage(id, messageData, notification_type, cb)
}

FBMessenger.prototype.sendGenericMessage =
FBMessenger.prototype.sendHScrollMessage = function (id, elements, notification_type, cb) {
  var messageData = {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': elements
      }
    }
  }
  this.sendMessage(id, messageData, notification_type, cb)
}

FBMessenger.prototype.sendButtonMessage =
FBMessenger.prototype.sendButtonsMessage = function (id, text, buttons, notification_type, cb) {
  var messageData = {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'button',
        'text': text,
        'buttons': buttons
      }
    }
  }
  this.sendMessage(id, messageData, notification_type, cb)
}

FBMessenger.prototype.sendReceiptMessage = function (id, payload, notification_type, cb) {
  payload.template_type = 'receipt'
  var messageData = {
    'attachment': {
      'type': 'template',
      'payload': payload
    }
  }
  this.sendMessage(id, messageData, notification_type, cb)
}

FBMessenger.prototype.sendQuickReplies = function (id, text, quick_replies, notification_type, cb){
  var messageData = {
    "text": text,
    "quick_replies": quick_replies
  }

  this.sendMessage(id, messageData, notification_type, cb)
}

FBMessenger.prototype.sendQuickRepliesToList = function (id, elements, quick_replies, notification_type, cb){
  var messageData = {
    "attachment": {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': elements
      }
    },
    "quick_replies": quick_replies
  }

  this.sendMessage(id, messageData, notification_type, cb)
}

FBMessenger.prototype.sendListTemplate = function (id, elements,  notification_type, cb){
  var messageData = {
    "attachment": {
      'type': 'template',
      'payload': {
        'template_type': 'list',
        'elements': elements,
        'buttons': [
          {
            "title": "הצג עוד",
            "type": "postback",
            "payload": "payload"                        
          }
        ]  
      }
    }
  }

  this.sendMessageNew(id, messageData, notification_type, cb)
}

FBMessenger.prototype.sendMessageNew = function (id, data, notification_type, cb) {
  notification_type = notification_type || this.notification_type
  if(typeof notification_type === 'function') {
    cb = notification_type
    notification_type = this.notification_type
  }
  var req = {
    url: 'https://graph.facebook.com/me/messages',
    qs: {access_token: this.token},
    method: 'POST',
    json: {
      recipient: {id: id},
      message: data,
      notification_type: notification_type
    }
  }
  request(req, function (err, res, body) {
    if (!cb) return
    if (err) return cb(err)
    if (body.error) return cb(body.error)
    cb(null, body)
  })
}

FBMessenger.prototype.sendMessage = function (id, data, notification_type, cb) {
  notification_type = notification_type || this.notification_type
  if(typeof notification_type === 'function') {
    cb = notification_type
    notification_type = this.notification_type
  }
  var req = {
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: this.token},
    method: 'POST',
    json: {
      recipient: {id: id},
      message: data,
      notification_type: notification_type
    }
  }
  request(req, function (err, res, body) {
    if (!cb) return
    if (err) return cb(err)
    if (body.error) return cb(body.error)
    cb(null, body)
  })
}

FBMessenger.prototype.setGreetingText = function (){
 var req = {
    url: 'https://graph.facebook.com/v2.6/me/thread_settings',
    qs: {access_token: this.token},
    method: 'POST',
    json: {
      "setting_type":"greeting",
      "greeting":{
        "text":"Hi {{user_first_name}}, welcome to this bot."
      }
    }
  }
  request(req, function (err, res, body) {
    if (!cb) return
    if (err) return cb(err)
    if (body.error) return cb(body.error)
    cb(null, body)
  }) 
}

FBMessenger.prototype.getProfile = function (id, cb) {
  var req = {
    method: 'GET',
    uri: 'https://graph.facebook.com/v2.6/' + id,
    qs: {
      fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
      access_token: this.token
    },
    json: true
  }
  request(req, function (err, res, body) {
    if (!cb) return
    if (err) return cb(err)
    if (body.error) return cb(body.error)
    cb(null, body)
  })
}


module.exports = FBMessenger