var request = require('request')

// Persona
var TOMER_PERSONA = { "name": "תומר", "id" : "451985582288820"}
var AVI_PERSONA= { "name": "אבי", "id" : "333321727605996"}
var HILA_PERSONA = { "name": "הילה", "id" : "371213160254726"}
var KEREN_PERSONA = { "name": "קרן", "id" : "500650940677315"}
var YARON_PERSONA = { "name": "ירון", "id" : "2454054581496199"}

var personas = [TOMER_PERSONA, AVI_PERSONA, HILA_PERSONA, KEREN_PERSONA, YARON_PERSONA]


var dataTextMessage = function (text) {
  return {
    text: text
  }
}

var dataImageMessage = function (imageURL) {
  return {
    'attachment': {
      'type': 'image',
      'payload': {
        'url': imageURL
      }
    }
  }
}

var dataHScrollMessage = function (elements) {
  return {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': elements
      }
    }
  }
}

var dataButtonsMessage = function (text, buttons) {
  return {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'button',
        'text': text,
        'buttons': buttons
      }
    }
  }
}

var dataReceiptMessage = function (payload) {
  payload.template_type = 'receipt'
  return {
    'attachment': {
      'type': 'template',
      'payload': payload
    }
  }
}


var dataQuickReplies = function (text, quick_replies){
  return {
    "text": text,
    "quick_replies": quick_replies
  }
}

var dataQuickRepliesToList = function (elements, quick_replies){
  return {
    "attachment": {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': elements
      }
    },
    "quick_replies": quick_replies
  }
}

var dataListTemplate = function (elements){
  return {
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
}

var sendMessage = function(token, body, cb){
  var req = {
    url: 'https://graph.facebook.com/v3.3/me/messages',
    qs: token,
    method: 'POST',
    json: body
  }
  
  request(req, function (err, res, body) {
    if (!cb) return
    if (err) return cb(err)
    if (body.error) return cb(body.error)
    cb(null, body)
  })
}


var dataLocation =  function(entities, sessionId, sessions){
  var city  = entities["city"]
  var street  = entities["street"]
  
  var data
  if(sessions[sessionId].context["location"]["city"] == ''){
    if(city){
      sessions[sessionId].context["location"]["city"] = city[0]["value"];
      data = dataTextMessage('באיזה רחוב נמצא הסופר?'); 
    } else {
      data = dataTextMessage("בבקשה חזרו עוד פעעם עם השם של העיר ?")
    }
  } else if(sessions[sessionId].context["location"]["street"] == ''){
    if(street){
      sessions[sessionId].context["location"]["street"] = street[0]["value"];
      buttons = [{
        "type": "web_url",
        "url": "https://mivtsabot.herokuapp.com/webview/stores/54/32.134603/34.21132",
        "title": "סופרים שלי",
        "webview_height_ratio": "tall"
      }] 
      data = dataButtonsMessage("רשימת הסופרים מהאזור בו המבצעים נבדקים", buttons) 
    }else{
      data = dataTextMessage("בבקשה חזרו עוד פעעם עם השם של הרחוב ?") 
    }
  } else {
    buttons = [{
      "type": "web_url",
      "url": "https://mivtsabot.herokuapp.com/webview/stores/54/32.134603/34.21132",
      "title": "סופרים שלי",
      "webview_height_ratio": "tall"
    }] 
    data = dataButtonsMessage("רשימת הסופרים מהאזור בו המבצעים נבדקים", buttons) 
  }

  return data
}

var dataGreeting = function (session) {
  text = "הי, אני " + session.persona["name"] + ". אשמח לעזור לך היום. מה ברצונך לעשות? "
  quick_replies = [
    {
      "content_type":"text",
      "title":"אני בסופר ",
      "payload":"instore"
    },{
      "content_type":"text",
      "title":"לעיין במבצעים ",
      "payload":"outstore"
    }
  ]
  return dataQuickReplies(text, quick_replies);
}
/////////////////////////////////////////////////////////////////////////////////////

FBMessenger.prototype.startTyping = function (id, session, cb) {
  var body = {
      recipient: {id: id},
      sender_action: "typing_on",
      persona_id: session.persona["id"] 
    }

  var token = {access_token: this.token};
  sendMessage(token, body, cb);
}

FBMessenger.prototype.stopTyping = function (id, session, cb) {
  var body = {
      recipient: {id: id},
      sender_action: "typing_off",
      persona_id: session.persona["id"] 
    }

  var token = {access_token: this.token};
  sendMessage(token, body, cb);
}

FBMessenger.prototype.routeReply = function (id, quick_reply, sessionId, sessions){
  reply = quick_reply["payload"]

  if(reply){
    switch(reply){
      case 'instore':
        sessions[sessionId].context["location"] = {city: '', street: '' }
        data = dataTextMessage('באיזה עיר נמצא הסופר?');
        break;
      case 'outstore':
        sessions[sessionId].context["location"] = {city: '', street: '' }
        data = dataTextMessage('באיזה עיר לבדוק את המבצעים?');
        break;
      default:

    }
    var body = {
      recipient: {id: id},
      message: data,
      messaging_type: "RESPONSE",
      persona_id: sessions[sessionId].persona["id"] 
    }
    var token = {access_token: this.token};
    sendMessage(token, body);
  }
}

FBMessenger.prototype.routeIntents = function (id, entities, sessionId, sessions){
  var intent  = entities["intent"]
  var stop = false; 

  if(intent){
    sessions[sessionId].context["intent"] = intent[0]

    switch(intent[0]["value"]) {
      case 'saving':
        data = dataShowSavings(entities, sessionId, sessions)
        break;
      case 'promo':
        data = dataShowPromos(entities, sessionId, sessions)
        break;
      case 'list':
        data = dataCurrentList(entities, sessionId, sessions)
        break;
      case 'products':
        data = dataShowProducts(entities, sessionId, sessions)
        break;
      case 'goodbye':
        stop = true;              
        data = dataTextMessage('שמחתי לעזור');        
        break;
      case 'greeting':                
        data = dataGreeting(sessions[sessionId])
        break;
      case 'location':
        data = dataLocation(entities, sessionId, sessions)
        break;
      default:        
        data = dataTextMessage('אני הסתבחתי, אפשר בבקשה להסביר :(');
    }    
  }else {
    data = dataTextMessage('אני הסתבחתי, אפשר בבקשה להסביר :(');
  }

   var body = {
      recipient: {id: id},
      message: data,
      messaging_type: "RESPONSE",
      persona_id: sessions[sessionId].persona["id"] 
    }
  var token = {access_token: this.token};
  sendMessage(token, body, (stop)=>{
    if (stop) { delete sessions[sessionId]; }
  });
}

FBMessenger.prototype.getPersona = function () {
  return personas[Math.floor(Math.random()*personas.length)];
}

function FBMessenger (token) {
  this.token = token
}

module.exports = FBMessenger


/*
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

*/
