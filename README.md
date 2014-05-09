usplus
======

## Setup ##

+ Download and configure google app engine (we are using this just to serve up static files). 
	+ [download google app engine sdk](https://developers.google.com/appengine/downloads)
	+ [overview google app engine w python](https://developers.google.com/appengine/docs/python/gettingstartedpython27/devenvironment)
	+ [tutorial hello world google app engine w python](https://developers.google.com/appengine/docs/python/gettingstartedpython27/helloworld) -- note that the app.yaml file already exists in the repo you won't need to recreate this, no python file is needed we're just using the static dir mapping.
	+ [helpful post from okfocus about getting setup](http://drawwithyourface.tumblr.com/post/23308876869/geting-up-and-running-with-google-hangouts)

+ All relevant code is now located in redux/ dir, other dirs are just for reference. Push any new code with: `appcfg.py update .`

+ Log into google apis console to launch hangout in developer sandbox.
	+ [google hangout api](https://developers.google.com/+/hangouts/getting-started)
	+ [google apis console](https://code.google.com/apis/console/b/0/#project:652359686588)
	+ [chrome speech api](http://developer.chrome.com/extensions/experimental.speechInput.html)

+ (optional) See okfocus post about local dev.


## Software overview (in dir redux) ##
+ app.xml -- main proj file to launch app, links in js, cs, contains all html that used to be in index.html
+ hangout.js -- main js file, holds pointer to db and text parser, sets up functionality once hangout is fully loaded and DOM is loaded, updates viz and interfaces with google hangout api
+ speech.js -- handles voice input, interfaces with chrome speech api
+ parser.js -- handles parsing and logging of words when called by speech.js and hangout.js, holds pointer to statsHandler
+ statsHandler.js -- handles LIWC lookups and stat calculation 
+ LIWC.js -- just a holder for two large js vars which are really json objs, hacking around getJSON issues
