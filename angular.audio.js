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
  this.loadAudio = function(str) {
    var r = $q.defer();

    var audObj = new AudioObject();

    var $sound = document.getElementById(str);
    if ($sound) {
      audObj.sound = $sound;
      allSoundsLoaded.push(audObj);
      r.resolve(audObj);

    } else {

      _load(str)
        .then(function(res) {
          audObj.sound = res;
          allSoundsLoaded.push(audObj);
          r.resolve(audObj);
        });
    }

    return r.promise;

  };

  this.getAudio = function(id) {
  	var audObj = new AudioObject();
  	console.log("Getting audio for",id,allSoundsLoaded	);

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
  }


})

/* Service for use inside code */
.service('ngAudio', function($q, ngAudioLoader) {
  var a = this,
    mutedSounds = [],
    soundVolumes = {},
    songs = [],
    loadedAudio = [],
    domAudio = [],
    muting = false,
    l = ngAudioLoader;


  this.play = function(id) {
    if (muting) return;
    if (mutedSounds.indexOf(id) > -1) return;

    if (songs.indexOf(id) > -1) {
      a.stop(songs);
    };

    var $sound = ngAudioLoader.loadAudio(id)
      .then(function(audObj) {
        audObj.sound.play();
      })
  }

  this.isMusic = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    _.each(ids, function(id) {
      songs.push(id);
    })
  }

  this.mute = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    _.each(ids, function(id) {
      mutedSounds.push(id);
      soundVolumes[id] = a.getSoundVolume(id);
      a.setSoundVolume(id, 0);
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
    _.each(loadedAudio, function(aud) {
      aud.stop();
    });

    _.each(domAudio, function(id) {
      a.stop(id);
    });
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
      if (_.contains(mutedSounds, id)) {
        a.unmute(id);
      } else {
        a.mute(id);
      }
    });
  }

  this.unmute = function(id) {
    mutedSounds = _.without(mutedSounds, id);
    a.setSoundVolume(id, soundVolumes[id]);
  };


  this.getSoundVolume = function(id) {
    var $sound = document.getElementById(id);
    return $sound.volume;
  }

  this.setSoundVolume = function(id, vol) {
    var $sound = document.getElementById(id);
    $sound.volume = vol;
  }

  this.stop = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    };

    _.each(ids, function(id) {

      var $sound = document.getElementById(id);

      /* stop the sound. */
      try {
        $sound.pause();
        $sound.currentTime = 0;
      } catch (e) {
        console.warn('Tried accessing unavailable sound', id);
      }
    });

  };
})
