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

/* Service for use inside code */
.service('ngAudio', function($q) {
  var a = this;
  var mutedSounds = [];
  var soundVolumes = {};
  var songs = [];

  var loadedAudio = [];
  var domAudio = [];

  function getAudio(str) {
  	

  }

  function contains(obj, target) {
    if (obj == null) return false;
    return any(obj, function(value) {
      return value === target;
    });
  }

  this.play = function(id) {
    var $sound = document.getElementById(id);

    if (muting) return;

    if (songs.indexOf(id) > -1) {
      a.stop(songs);
    };

    /* Play the sound. */
    if ($sound) {
      $sound.pause();
      $sound.currentTime = 0;
      $sound.play();
      domAudio.push(id);
      return;
    }

    /* If there is no sound, try to load it externally.*/
    loadAudio(id)
      .then(
        function(res) {
          res.play();
          loadedAudio[id] = res;
        },
        function(err) {
          console.log("ERROR: Could not load sound");
        })

    function loadAudio(uri) {
      var r = $q.defer();
      var audio = new Audio();

      audio.addEventListener('canplaythrough', soundCanPlay, false); // It works!!
      audio.src = id;

      function soundCanPlay() {
        r.resolve(audio);
      }
      return r.promise;
    }
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

  var muting = false;

  this.muteAll = function() {
  	a.stopAll();
  	muting = true;
  }

  this.unmuteAll = function() {
  	muting = false;
  }

  this.stopAll = function() {
  	_.each(loadedAudio,function(aud){
  			aud.stop();
  	});

  	_.each(domAudio,function(id){
  			a.stop(id);
  	});
  }

  this.toggleMuteAll = function() {
  	console.log("Toggling mute",muting);
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


/** Some functions from underscore **/
var breaker = {};
var _ = _ || {};
_.each = function(obj, iterator, context) {
  if (obj == null) return obj;
  if (obj.length === +obj.length) {
    for (var i = 0, length = obj.length; i < length; i++) {
      if (iterator.call(context, obj[i], i, obj) === breaker) return;
    }
  } else {
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
    }
  }
  return obj;
};

_.isArray = function(obj) {
	 return toString.call(obj) == '[object Array]';
}