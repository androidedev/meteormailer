import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Base64 } from 'meteor/base64';

// **************************************************************
// data defs
// **************************************************************

// mongo collection to store service settings (null make this go to minimongo (in memory))
mailersettings  = new Mongo.Collection(null); 

// mongo schema for a domain config
mailersettings.schema = new SimpleSchema({
    id: {type: String},
    domain: {type: String },
    smtpserver: {type: String },
    smtpsender: {type: String },
    smtppass: {type: String },
    smtpto: {type: String },
    smtpcc: {type: String },
    smtpsubject:{type: String }
});

// **************************************************************
// hi ho let's go!!
// **************************************************************
Meteor.startup(() => {
    // create iron router route
    setupRoute();
    // read config settings
    readSettings();
});


// **************************************************************
// config & parse service settings
// **************************************************************
function readSettings() {
    dlog("init: readSettings()");
    // attach scheme for ease of use & validation
    mailersettings.attachSchema(mailersettings.schema);
    // parse settings JSON
    var myjson = JSON.parse(Assets.getText("domains.json"));
    for (var i=0;i<myjson.length;i++) {
        mailersettings.insert({
            id: myjson[i].id, 
            domain:myjson[i].domain, 
            smtpserver:myjson[i].smtpserver, 
            smtpsender:myjson[i].smtpsender,
            smtppass:myjson[i].smtppass,
            smtpto:myjson[i].smtpto,
            smtpcc:myjson[i].smtpcc,
            smtpsubject:myjson[i].smtpsubject
        });
    };
}

function setupRoute()
{
    dlog("init: setupRoute()");
    // this setups a route in form : /mailer?q=<email_data>
    Router.route('/mailer/', function () {
        // extract data
        var query = this.params.query;
        var response = this.response; // store it to reuse

        // decrypt query string
        var decrypted = desaes256(query.q,"Passphrase");
        decrypted  = "["+decrypted+"]";

        // check for allowed domain
        var plainobject = getPlainJSObject(decrypted);
        const ms = mailersettings.findOne({domain: plainobject["domain"]});

        // if allowed one continue
        if(ms!=null)
        {
            var sendresult = "";
            // process email data against template
            var renderedEmail = templateProcessing(plainobject);
            // text version of email to bypass spam filters
            var txtEmail = txtProcessing(decrypted);
            // send email
            sendresult = sendMail(ms,renderedEmail,txtEmail);
            if(sendresult==="")
                response.writeHead(200, {'Content-Type':'text/html'});
            else
                response.writeHead(500, {'ERRORMESSAGE':sendresult});
        } else
        {
            response.writeHead(500, {'ERRORMESSAGE':"not allowed domain"});
        }
        response.end("");
    }, {where: 'server'});
}

function desaes256(encrypted,passphrase)
{
    // decode it to decrypt
    var uncoded = decodeURIComponent(encrypted);
    // decrypt 
    var decrypted = CryptoJS.AES.decrypt(uncoded, passphrase);
    decrypted = decrypted.toString(CryptoJS.enc.Utf8);
    return decrypted;
}

// data : a string with JSON format
// returns : plain js object with all fields of JSON input data
function getPlainJSObject(data)
{
    // Parse JSON string into javascript object
    var plainobject = new Object();
    var myjson = JSON.parse(data);
    for(var i in myjson){
        var key = i;
        var val = myjson[i];
        for(var j in val){
            var sub_key = j;
            var sub_val = val[j];
            plainobject[sub_key] = sub_val;
        }
    }
    return plainobject;
}

// dataobject : plain js object with all the data, the field templateid is mandatory
// returns : the html rendered email
function templateProcessing(dataobject)
{
    dlog("enter: templateProcessing()");
    // We always expect the field templateid in email data sent so we extract it, the templateid is the name of html file with the template
    var templateid = dataobject["templateid"];
    // compile template & render it to HTML
    SSR.compileTemplate('thetemplate', Assets.getText('templates/'+templateid+'.html'));
    var renderedEmail = SSR.renderEmail("thetemplate", dataobject)
    // return the renderer email
    return renderedEmail;
}

// data : string with JSON format
// returns : unformated string with all JSON fields except "templateid"
function txtProcessing(data)
{
    dlog("enter: txtProcessing()");
    // Parse JSON string into simple string couse JSON.stringify() returns a very ugly one
    var emailtxtbody = "";
    var myjson = JSON.parse(data);
    for(var i in myjson){
        var key = i;
        var val = myjson[i];
        for(var j in val){
            if(j!="templateid") // get rid of templateid field, the receiver should not know it
            {
                var sub_key = j;
                var sub_val = val[j];
                emailtxtbody += sub_key + " = " + sub_val + "\r\n";
            }
        }
    }
    return emailtxtbody;
}

// blaze doesn't like HTML or DOCTYPE so we must hack ....
SSR.renderEmail = function (template, data) {
    const html = SSR.render(template, data);
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml">${html}</html>`;
};


// mlsettings: mailer settings
// emaildata: the html body 
// emailtextdata : txt version of html body
// returns : result of Email.send
function sendMail(mlsettings,emaildata,emailtextdata)
{
    dlog("enter: sendMail");
    process.env.MAIL_URL = "smtp://"+mlsettings.smtpsender+":"+mlsettings.smtppass+"@"+mlsettings.smtpserver+":587";  // format = "smtp://email:password@server:port";
    var emailsent = "";
    try {  // the errors only can be captured with try...catch 
        Email.send({
            to: mlsettings.smtpto,
            from: mlsettings.smtpsender,
            cc: mlsettings.smtpcc,
            subject: mlsettings.smtpsubject
            ,text: emailtextdata
            ,html: emaildata
        });

    } catch (err) {
        emailsent=err;
    }
    return emailsent;
}


// **************************************************************
// utils
// **************************************************************
dlog = function (msg) {
    var justnow = new Date();
    if(msg==null)
        console.log(justnow.toLocaleTimeString() + " : msg == null");
    else if (msg==undefined)
        console.log(justnow.toLocaleTimeString() + " : msg == undefined");
    else
        console.log(justnow.toLocaleTimeString() + " : " + msg);
}
