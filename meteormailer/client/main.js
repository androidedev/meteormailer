import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Base64 } from 'meteor/base64';

import './main.html';


Template.FormFields.events({
    'click button'(event, instance) {

        // form data to JSON
        var myObject = new Object();
        myObject.domain = "alloweddmain.com";
        myObject.templateid = "template6";
        myObject.nombre = $("#idName").val();
        myObject.email = $("#idEmail").val();
        myObject.telefono = $("#idTelefono").val();
        myObject.observaciones = $("#idObservaciones").val();
        var myString = JSON.stringify(myObject);
        $("#resultado1").text("JSON: "+myString);
        
        // encrypt JSON
        var encrypted = CryptoJS.AES.encrypt(myString, "Passphrase");
        $("#resultado2").text("Encrypted: "+encrypted);

        // encode so we can pass by url
        var encoded = encodeURIComponent(encrypted);
        $("#resultado3").text("Encoded: "+encoded);

        // compose url & call
        window.location = 'http://localhost:3000/mailer?q='+encoded;

        //// decode it to decrypt
        //var uncoded = decodeURIComponent(encrypted);
        //$("#resultado4").text("Decoded: "+uncoded);

        //// decrypt 
        //var decrypted = CryptoJS.AES.decrypt(uncoded, "Passphrase");
        //decrypted = decrypted.toString(CryptoJS.enc.Utf8);
        //$("#resultado5").text("Decrypted: "+decrypted);

    },
});
