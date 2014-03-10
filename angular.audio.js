/* NG AUDIO MOD
@github: danielstern
License: PLEASE USE FOR EVIL*/

angular.module('ngAudio', [])
/* Directive for creating a special audio element */
.directive('ngAudio', function($compile, ngAudio, $q) {
  return {
    restrict: 'AE',
    controller: function($scope, $attrs, $element) {

      if ($element[0].nodeName == 'AUDIO') {
        return;
      }

      if ($element[0].nodeName == 'NG-AUDIO') {

        var audio = angular.element(document.createElement('audio'));
        audio.attr('ng-audio');

        $element.attr('id', '');
        for (attr in $attrs.$attr) {
          var attrName = attr;
          audio.attr(attrName, $attrs[attrName]);
        }

        var el = $compile(audio)($scope);
        $element.append(audio);
        return;
      }

      /* Add a click listner to the element the directive is on. */
      $element.on('click', function(e) {
        ngAudio.play($attrs.ngAudio);
      })
    },
  }
})

.service('ngAudioLoader', function($q) {
  var allSoundsLoaded = [];

  this.getAllSounds = function() {
    return allSoundsLoaded;
  }
  this.loadAudio = function(str, audObj) {
    console.log("Loading",str);
    var r = $q.defer();

    if (soundLoaded(str)) return;

    var $sound = document.getElementById(str);
    if ($sound) {
      audObj.setSound($sound);
      audObj.src = $sound.getAttribute('src');
      audObj.selector = str;
      if (!soundLoaded(str)) allSoundsLoaded.push(audObj);
      r.resolve(audObj);
      

    } else {

      _load(str)
        .then(function(res) {
          audObj.setSound(res);
          audObj.src = str;
          if (!soundLoaded(str)) allSoundsLoaded.push(audObj);
          r.resolve(audObj);
        });
    }

    return r.promise;

  };

  function soundLoaded(id) {
    return _.find(allSoundsLoaded, function(audObj) {
      if (audObj.src == id) return true;
      if (audObj.selector == id) return true;
    });
  }

  this.getAudio = function(id) {
    var matchingSound = soundLoaded(id);

    var audObj = matchingSound || new AudioObject();

    if (!matchingSound) {
    	audObj.src = id;
    	audObj.selector = id;
    }
    this.loadAudio(id, audObj);
    return audObj;

  }

  function _load(uri) {
    var k = $q.defer();
    var audio = new Audio();

    audio.addEventListener('canplaythrough', soundCanPlay, false); // It works!!
    audio.src = uri;

    function soundCanPlay() {
      k.resolve(audio);
    }
    return k.promise;
  }

  var AudioObject = function() {
    this.play = undefined;
    this.stop = undefined;
    this.sound = undefined;
    var oldVolume = 1;
    var song = false;
    var o = this;
    var muting = false;

    this.getVolume = function() {
      return this.sound.volume;
    };

    this.setVolume = function(vol) {
      this.sound.volume = vol;
    };

    this.toggleMute = function() {
      console.log("Muting sound", this);
      (muting) ? this.unmute() : this.mute();
    }

    this.mute = function() {
    	muting = true;
      oldVolume = this.sound.volume;
      this.sound.volume = 0;
    };

    var deferredPlay = false;

    this.play = function(_sound) {
    	console.log("Playing",_sound);
      var sound = _sound || this.sound;
    	if (!sound) {
    		console.log("Deferring play");
    		deferredPlay = true;
     		return;
    	}

      if (muting) return;

    	deferredPlay = false;

      this.stop();
      sound.play();

      if (song) {
      	console.log("I'm playing, and i'm a song!");
      }
    };

    var i;

    
    this.unmute = function() {
    	if (!this.sound) return;
      muting = false;
      this.sound.volume = oldVolume || 1;
    }

    this.setSound = function(_sound) {
  
    	o.sound = _sound;
      o.handleDeffered(_sound);

    }

    this.handleDeffered = function(_sound) {
      console.log("Handling deferreds",o.sound, deferredPlay);
      if (deferredPlay) {
        console.log("Playing time");
        this.play(_sound);
      }
    }

    this.stop = function() {
    	if (!this.sound) return;
      this.pause();
      this.sound.currentTime = 0;
    };

    this.pause = function() {
    	if (!this.sound) return;
      this.sound.pause();
    }

    this.enableSong = function() {
    	console.log("Enabling song");
    	song = true;
    };

    this.isSong - function() {
      return song;
    }

  }


})

/* Service for use inside code */
.service('ngAudio', function($q, ngAudioLoader) {
  var a = this,

    muting = false,
    l = ngAudioLoader;


  this.play = function(id) {
    if (muting) return;

		var audObj = l.getAudio(id);
    console.log("PLaying this object",audObj);
		audObj.play();
  }

  this.isMusic = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    _.each(ids, function(id) {
      //  songs.push(id);
      var audObj = l.getAudio(id);
      audObj.enableSong();
    })
  }

  this.mute = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    _.each(ids, function(id) {
      var audObj = getAudio(id);
      audObj.mute();
    })
  };

  this.muteAll = function() {
    a.stopAll();
    muting = true;
  }

  this.unmuteAll = function() {
    muting = false;
  }

  this.stopAll = function() {
    _.each(l.getAllSounds(), function(audObj) {
      audObj.stop();
    })
  }

  this.toggleMuteAll = function() {
    //  console.log("Toggling mute", muting);
    muting ? a.unmuteAll() : a.muteAll();
  }

  this.toggleMute = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    };

    _.each(ids, function(id) {
      var audObj = l.getAudio(id);
      audObj.toggleMute();
    });
  }

  this.unmute = function(id) {
    mutedSounds = _.without(mutedSounds, id);
    a.setSoundVolume(id, soundVolumes[id]);
  };


  this.getSoundVolume = function(id) {
    var $sound = l.getAudio(id);
    return $sound.getVolume();
  }

  this.setSoundVolume = function(id, vol) {
    var $sound = l.getAudio(id);
    $sound.setVolume(vol);
  }

  this.stop = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    };

    _.each(ids, function(id) {

      var $sound = l.getAudio(id);
      $sound.stop();

    });

  };
})
