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
          console.log("Resolved loaded song",audObj)
          audObj.setSound(res);
          audObj.src = str;
          if (!soundLoaded(str)) allSoundsLoaded.push(audObj);
          r.resolve(audObj);
        });
    }

    audObj.addListener(function(type){
      console.log("Got event",type);
      if (type == 'song-play') {
        //console.log("Sou")
        var songs = getAllSongs();
        console.log("All songs?",songs);
        _.each(songs,function(song){
          song.stop();
        })
      }
    })

    return r.promise;

  };

  var getAllSongs = function() {
    return _.filter(allSoundsLoaded, function(audObj) {
      if (audObj.isSong()) return audObj;
    })
  }

  function soundLoaded(id) {
    return _.find(allSoundsLoaded, function(audObj) {
      if (audObj.src == id) return true;
      if (audObj.selector == id) return true;
    });
  }

  this.getAudio = function(id) {
    console.log("Getting audio for",id);
    var matchingSound = soundLoaded(id);
    console.log("Matching sound?",matchingSound,allSoundsLoaded);

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

    console.log("Adding listener to audio", audio);

    audio.addEventListener('canplaythrough', soundCanPlay, false); // It works!!
    audio.src = uri;

    function soundCanPlay() {
      console.log("Resolving");
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
    var deferredPlay = false;
    var listeners = [];

    this.getVolume = function() {
      return this.sound.volume;
    };

    this.addListener = function(li) {
      listeners.push(li);
    }

    this.setVolume = function(vol) {
      this.sound.volume = vol;
    };

    this.toggleMute = function() {
      (muting) ? this.unmute() : this.mute();
    }

    this.mute = function() {
      muting = true;
      if (!this.sound) return;
      oldVolume = this.sound.volume;
      this.sound.volume = 0;
    };
    
    this.unmute = function() {
    	if (!this.sound) return;
      muting = false;
      this.sound.volume = oldVolume || 1;
    }


    this.play = function(_sound) {
      var sound = _sound || this.sound;
      if (!sound) {
      //  console.log("Deferring play");
        deferredPlay = true;
        return;
      }
      console.log("Playing",this,this.isSong());
      deferredPlay = false;

      if (muting) return;

      if (song) {
        console.log("I'm playing, and i'm a song!");
        _.each(listeners,function(li){
          li('song-play');
        })
      }


      this.stop();
      sound.play();
    };

    var i;

    this.stop = function() {
    	if (!this.sound) return;
      this.pause();
      this.sound.currentTime = 0;
    };

    this.pause = function() {
    	if (!this.sound) return;
      this.sound.pause();
    }

    this.setSound = function(_sound) {
  
      o.sound = _sound;
      o.handleDeffered(_sound);

    }

    this.handleDeffered = function(_sound) {
      if (deferredPlay) {
        this.play(_sound);
      }
    }


    this.enableSong = function() {
    	console.log("Enabling song",this);
    	song = true;
    };

    this.isSong = function() {
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
    //console.log("PLaying this object",audObj);
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
