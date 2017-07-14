# meteormailer
Mail send rest service made with Meteor

## What is this ?
A mail service made in meteor that allows you to setup an url listening (rest) and send emails by calling it 

## Why?

* I did this only to test javascript and meteor, and I choosed this little toy because it has all sort of things, reading files, parsing query strings, encrypt things, mongo, etc.
* In the end it turned out to be useful and there is, as far as I know, at least one app using it in production, anyway it was not planned for it so be careful if you plan to use it in production
* I choose to publish it because I do not saw so many mail services in meteor, and because this is a learning exercise so the code is overcommented and could be useful to someone
* I did not made a [atmosphere](https://atmospherejs.com/) package because I think it's not worth it so you must clone and use it as you want

## Features
* Customizable templates
* Allow multiple domains using it
* Encrypted & encoded calls
* Unlimited fields in mail message (the system is agnostic to fields it simply translates them as they come)
* Uses minimongo to store the credentials for allowed domains
* The mailer renders a page with only the result in header so you can capture it and use as you want
* You can configure CC to receive copy of emails
* Some other things I forget because I did this a long time ago

## How to use
* Edit /private/domains.json to enter the credentials to all allowed domains that could send emails throung the service, if a domain is not in that file could not use it
* Start meteormailer, and service will listen in the url you have configured with "/mailer?q=<email_data>" url
* There is an example of use on "client" directory basically :
  * Creates a JSON object (the only mandatory fields are "domain" and "templateid")
  * Encrypts and encodes the object 
  * Calls the mailer url with it (do not forget to change the url in sample if you deploy to other url)
* You can customize/add the email templates in directory "private/templates"
* To add new fields simply put in in the template and fill it when call service, the service is agnostic to all fields except "domain" and "templateid" that are mandatory, the rest of it are filled if they come in request, ignored if not
* Remember to change "Passphrase" literals in to something less obvious if you are going to use this 

## Packages
* You must add the following packages:
  * meteor add email
  * meteor add ecmascript
  * meteor add iron:router
  * meteor add aldeed:simple-schema
  * meteor add aldeed:collection2
  * meteor add base64
  * meteor add meteorhacks:ssr
  * meteor add jparker:crypto-aes







