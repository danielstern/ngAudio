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
      audObj.defaultVolume = $sound.getAttribute('volume') || 0;
      audObj.startAt = $sound.getAttribute('startAt') || 0;
      audObj.defaultSong = $sound.hasAttribute('song');
      audObj.selector = str;
      console.log("Resolved song from HTML", audObj);

      if (audObj.defaultVolume) {
        audObj.setVolume(audObj.defaultVolume);
      }

      if (audObj.defaultSong) {
        audObj.enableSong();
      }

      if (!soundLoaded(str)) allSoundsLoaded.push(audObj);
      r.resolve(audObj);
      

    } else {

      _load(str)
        .then(function(res) {
          //console.log("Resolved loaded song",audObj,res);
          audObj.setSound(res);
          audObj.src = str;
          if (!soundLoaded(str)) allSoundsLoaded.push(audObj);
          r.resolve(audObj);
        });
    }

    audObj.addListener(function(type,target){
      console.log("Got event",type,target);
      if (type == 'song-play') {
        //console.log("Sou")
        var songs = getAllSongs();
        //console.log("All songs?",songs);
        _.each(songs,function(song){
          if (song.src != target.src)
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

  this.getAllSongs = getAllSongs;

  function soundLoaded(id) {
    return _.find(allSoundsLoaded, function(audObj) {
      if (audObj.src == id) return true;
      if (audObj.selector == id) return true;
    });
  }

  this.getAudio = function(id) {
   // console.log("Getting audio for",id);
    var matchingSound = soundLoaded(id);
    //console.log("Matching sound?",matchingSound,allSoundsLoaded);

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

    //console.log("Adding listener to audio", audio);

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
    var songmuting = false;

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

    this.muteSong = function() {
      songmuting = true;
      if (!this.sound) return;
      oldVolume = this.sound.volume;
      this.sound.volume = 0;
    }

    this.unmuteSong = function() {
      songmuting = false;
      if (!this.sound) return;
      oldVolume = this.sound.volume;
      this.sound.volume = oldVolume || 1;
    }
    
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
      console.log("Playing",this);
      deferredPlay = false;

      if (muting) return;
      if (this.isSong() && songmuting) return;
      
      this.stop();

      if (this.startAt) {
        sound.currentTime = Number(this.startAt);
      }

      if (song) {
        console.log("I'm playing, and i'm a song!");
        _.each(listeners,function(li){
          li('song-play',o);
        })
      }

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
    	//console.log("Enabling song",this);
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
    songmuting = false,
    l = ngAudioLoader;


  this.play = function(id) {
    if (muting) return;

		var audObj = l.getAudio(id);
    //console.log("PLaying this object",audObj);
		audObj.play();
  }

  this.getAllSongs = l.getAllSongs;

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
    //a.stopAll();
    _.each(l.getAllSounds(), function(audObj) {
      //var audObj = getAudio(id);
      audObj.mute();
    })
    muting = true;
  }

  this.unmuteAll = function() {
    _.each(l.getAllSounds(), function(audObj) {

      audObj.unmute();

    })
    muting = false;
  }

  this.stopAll = function() {
    _.each(l.getAllSounds(), function(audObj) {
      audObj.stop();
    })
  }

  this.toggleMuteAllSongs = function() {
    songmuting = !songmuting;
    var allSongs = l.getAllSongs();
    if (songmuting) {
      _.each(allSongs,function(audObj){
      //  console.log("Song muting this object",audObj);
        audObj.muteSong();
      })
    } else {
      _.each(allSongs,function(audObj){
      //  console.log("Song muting this object",audObj);
        audObj.unmuteSong();
      })
    }
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
