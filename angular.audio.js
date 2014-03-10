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
        console.log("this is an audio element");
        return;
      }

      if ($element[0].nodeName == 'NG-AUDIO') {
        console.log("this is an ngAudio audio element", $attrs);
        var audio = angular.element(document.createElement('audio'));
        audio.attr('ng-audio');

        $element.attr('id','');
        for (attr in $attrs.$attr) {
        	var attrName = attr;
        	console.log("Attr name?", attrName);
        	audio.attr(attrName,$attrs[attrName]);
        }

        var el = $compile(audio)($scope);
        $element.append(audio);
        return;
      }

      /* Add a click listner to the element the directive is on. */
      $element.on('click', function() {

        /* Find the sound tag embedded in the markup. */
        var $sound = document.getElementById($attrs.ngAudio);

        console.log("Sound finding?",$sound);

        /* Play the sound. */
        if ($sound) {
        	$sound.play();
        	return;
      	}

      	/* try to load the sound if there's no tag defeined */
      	loadAudio($attrs.ngAudio)
      	.then(
      		function(res){res.play()},
      		function(err){console.log("ERROR!")
      	})
      	function loadAudio(uri)
				{
						var r = $q.defer();
				    var audio = new Audio();
				
				    audio.addEventListener('canplaythrough', soundCanPlay, false); // It works!!
				    audio.src = $attrs.ngAudio;

				    function soundCanPlay() {
				    	r.resolve(audio);
				    }
				    return r.promise;
				}
      })
    },
  }
})

/* Service for use inside code */
.service('ngAudio', function() {
  var a = this;
  var mutedSounds = [];
  var soundVolumes = {};
  var songs = [];

  this.play = function(id) {
    var $sound = document.getElementById(id);

    if (_.contains(songs, id)) {
      a.stop(songs);
    };

    /* Play the sound. */
    try {
      $sound.pause();
      $sound.currentTime = 0;
      $sound.play();
    } catch (e) {
      console.warn('Tried accessing unavailable sound', id);
    }

  };

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
