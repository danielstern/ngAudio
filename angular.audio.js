/* NG AUDIO MOD
@github: danielstern
License: PLEASE USE FOR EVIL*/

angular.module('ngAudio', [])
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
          audObj.setSound(res);
          audObj.src = str;
          if (!soundLoaded(str)) allSoundsLoaded.push(audObj);
          r.resolve(audObj);
        });
    }

    audObj.addListener(function(type, target) {
      if (type == 'song-play') {
        var songs = getAllSongs();
        _.each(songs, function(song) {
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

    //   audio.addEventListener('canplaythrough', soundCanPlay, false); // It works!!
    audio.src = uri;

    var i = setInterval(function() {
      if (audio.play) {
        soundCanPlay();
        clearInterval(i);
      }
    })

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
    var deferredPlay = false;
    var listeners = [];
    var songmuting = false;
    var volume = 1;

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
      oldVolume = volume;
      volume = 0;
      this.setVolume(volume)
    };

    this.muteSong = function() {
      songmuting = true;
      oldVolume = volume;
      volume = 0;
      this.setVolume(volume)
    }

    this.unmuteSong = function() {
      songmuting = false;
      volume = oldVolume || 1;
      this.setVolume(volume)
    }

    this.unmute = function() {
      muting = false;
      volume = oldVolume || 1;
      if (this.isSong() && songmuting) return;
      this.setVolume(volume)
    }

    this.setVolume = function(vol) {
      volume = vol;
      try {

        this.sound.volume = vol;
      } catch (e) {
        console.warn("sound edit error.")
      }
    }


    this.play = function(_sound) {
      var sound = _sound || this.sound;
      if (!sound) {
        deferredPlay = true;
        return;
      }
      console.log("Playing", this);
      deferredPlay = false;

      if (muting) return;
      //if (this.isSong() && songmuting) return;

      if (!this.isSong()) this.stop();

      if (this.startAt && sound.currentTime < this.startAt) {
        sound.currentTime = Number(this.startAt);
      }

      if (song) {
        _.each(listeners, function(li) {
          li('song-play', o);
        })
      }

      //if (this.isSong() && songmuting) return;
      this.setVolume(volume);
      if (songmuting) return;
      sound.play();
    };

    var i;

    this.stop = function() {
      //if (!this.sound || !this.sound.play) return;
      this.pause();
      try {
        this.sound.currentTime = 0;
      } catch (e) {
        console.warn("Sound error");
      }
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
      song = true;
      this.song = true;
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
    audObj.play();

    if (songmuting && audObj.isSong()) audObj.muteSong();
  }

  this.getAllSongs = l.getAllSongs;

  this.isMusic = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    _.each(ids, function(id) {
      var audObj = l.getAudio(id);
      audObj.enableSong();
    })
  }

  this.muteAll = function() {

    _.each(l.getAllSounds(), function(audObj) {
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
    console.log("muting all songs", allSongs);
    if (songmuting) {
      _.each(allSongs, function(audObj) {
        audObj.muteSong();
      })
    } else {
      _.each(allSongs, function(audObj) {
        audObj.unmuteSong();
      })
    }
  }

  this.toggleMuteAll = function() {
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

  this.mute = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    _.each(ids, function(id) {
      var audObj = getAudio(id);
      audObj.mute();
    })
  };

  this.unmute = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    _.each(ids, function(id) {
      var audObj = getAudio(id);
      audObj.unmute();
    })
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
