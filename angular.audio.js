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
  this.loadAudio = function(str) {
    var r = $q.defer();

    var audObj = new AudioObject();

    if (soundLoaded(str)){
    	r.resolve(this.getAudio(str));
    	return r.promise;
    };

    var $sound = document.getElementById(str);
    if ($sound) {
      audObj.sound = $sound;
      audObj.src = $sound.getAttribute('src');
      audObj.selector = str;
      if (!soundLoaded(str)) allSoundsLoaded.push(audObj);
      r.resolve(audObj);

    } else {

      _load(str)
        .then(function(res) {
          audObj.sound = res;
          audObj.src = str;
          if (!soundLoaded(str)) allSoundsLoaded.push(audObj);
          r.resolve(audObj);
        });
    }

    return r.promise;

  };

  function soundLoaded(id) {
  	console.log("Is sound loaded?",id,allSoundsLoaded);
  	return _.find(allSoundsLoaded,function(audObj){
  		if (audObj.src == id) return true;
  		if (audObj.selector == id) return true;
  	});
  }

  this.getAudio = function(id) {
  	allSoundsLoaded = _.uniq(allSoundsLoaded);
  	var matchingSound = soundLoaded(id);

  	var audObj = matchingSound || new AudioObject();
  	console.log("Getting audio for",id,allSoundsLoaded	);
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
    this.sound = {};
    var oldVolume = 1;

    this.getVolume = function() {
    	return this.sound.volume;
    };

    this.setVolume = function(vol) {
    	this.sound.volume = vol;
    };

    this.toggleMute = function() {
    	console.log("Muting sound", this);
    	 (this.sound.volume > 0) ? this.mute() : this.unmute();
    }

    this.mute = function() {
    	oldVolume = this.sound.volume;
    	this.sound.volume = 0;
    };

    this.play = function() {
    	this.stop();
    	this.sound.play();
    }

    this.unmute = function() {
    	this.sound.volume = oldVolume;

    }

    this.stop = function() {
    	this.pause();
    	this.sound.currentTime = 0;
    };

    this.pause = function() {
    	this.sound.pause();
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
    //if (_.contains(mutedSounds,id)) return;

    //if (songs.indexOf(id) > -1) {
     // a.stop(songs);
    //};

    var $sound = ngAudioLoader.loadAudio(id)
      .then(function(audObj) {
        audObj.play();
      })
  }

  this.isMusic = function(ids) {
    if (!_.isArray(ids)) {
      ids = [ids];
    }
    _.each(ids, function(id) {
    //  songs.push(id);
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
    _.each(l.getAllSounds(),function(audObj){
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

      var $sound = l.getAudio(id).sound;

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
